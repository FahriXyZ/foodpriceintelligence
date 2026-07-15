from flask import Flask, request, jsonify
from flask_cors import CORS
from ipj_api_service import get_ipj_latest_prices
from sqlalchemy import create_engine, text
import os
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DB_URL = "mysql+pymysql://root:@localhost:3306/ta"
engine = create_engine(DB_URL)

MODEL_DIR = os.path.join(BASE_DIR, "models")

HISTORIS_PATH = os.path.join(
    PROJECT_DIR,
    "public",
    "data",
    "data_historis_komoditas_2026.csv"
)

HARGA_TERKINI_PATH = os.path.join(
    PROJECT_DIR,
    "public",
    "data",
    "harga_terkini_ipj.csv"
)

FORECAST_H1_HISTORY_PATH = os.path.join(
    PROJECT_DIR,
    "public",
    "data",
    "forecast_history_h1.csv"
)

app = Flask(__name__)
CORS(app)

rf = joblib.load(os.path.join(MODEL_DIR, "random_forest_2020_2023.pkl"))
xgb = joblib.load(os.path.join(MODEL_DIR, "xgboost_2020_2023.pkl"))
lgbm = joblib.load(os.path.join(MODEL_DIR, "lightgbm_2020_2023.pkl"))

features = [
    "commodity_id",
    "lag_1",
    "lag_3",
    "lag_7",
    "lag_14",
    "rolling_mean_3",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_std_7",
    "rolling_std_14",
    "diff_1",
    "day",
    "month",
    "year",
    "day_of_week",
]

def normalize_name(value):
    return (
        str(value)
        .lower()
        .replace(".", "")
        .replace("/", "")
        .replace("(", "")
        .replace(")", "")
        .replace("-", "")
        .replace(" ", "")
        .strip()
    )

def load_price_history_mysql():
    query = """
        SELECT
            p.tanggal AS time,
            p.harga,
            p.commodity_id,
            c.nama_komoditas,
            c.unit
        FROM price_history p
        JOIN commodities c
            ON c.commodity_id = p.commodity_id
        WHERE YEAR(p.tanggal) = YEAR(CURDATE())
        ORDER BY p.tanggal ASC
    """

    return pd.read_sql(query, engine)

def klasifikasi(harga_pred, rata7, std7):
    if pd.isna(std7) or std7 == 0:
        std7 = rata7 * 0.02
        
    batas_aman = rata7 + std7
    batas_waspada = rata7 + (2 * std7)

    if harga_pred <= batas_aman:
        return "Aman"
    elif harga_pred <= batas_waspada:
        return "Waspada"
    return "Intervensi"

def prepare_features(df):
    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df["harga"] = pd.to_numeric(df["harga"], errors="coerce")
    df["commodity_id"] = pd.to_numeric(df["commodity_id"], errors="coerce")

    df = df.dropna()
    df = df[(df["harga"] > 0) & (df["harga"] < 1000000)]
    df["commodity_id"] = df["commodity_id"].astype(int)

    df = df.drop_duplicates()
    df = df.sort_values(["commodity_id", "time"]).reset_index(drop=True)

    df["lag_1"] = df.groupby("commodity_id")["harga"].shift(1)
    df["lag_3"] = df.groupby("commodity_id")["harga"].shift(3)
    df["lag_7"] = df.groupby("commodity_id")["harga"].shift(7)
    df["lag_14"] = df.groupby("commodity_id")["harga"].shift(14)

    df["rolling_mean_3"] = df.groupby("commodity_id")["harga"].rolling(3).mean().reset_index(0, drop=True)
    df["rolling_mean_7"] = df.groupby("commodity_id")["harga"].rolling(7).mean().reset_index(0, drop=True)
    df["rolling_mean_14"] = df.groupby("commodity_id")["harga"].rolling(14).mean().reset_index(0, drop=True)

    df["rolling_std_7"] = df.groupby("commodity_id")["harga"].rolling(7).std().reset_index(0, drop=True)
    df["rolling_std_14"] = df.groupby("commodity_id")["harga"].rolling(14).std().reset_index(0, drop=True)

    df["diff_1"] = df["harga"] - df["lag_1"]

    df["day"] = df["time"].dt.day
    df["month"] = df["time"].dt.month
    df["year"] = df["time"].dt.year
    df["day_of_week"] = df["time"].dt.dayofweek

    df = df.dropna().reset_index(drop=True)

    return df

def save_evaluation_h1_to_mysql(df_eval):
    with engine.begin() as conn:
        for _, row in df_eval.iterrows():
            conn.execute(
                text("""
                    INSERT INTO forecast_evaluation (
                        tanggal_prediksi,
                        commodity_id,
                        harga_aktual,
                        prediksi_random_forest,
                        prediksi_xgboost,
                        prediksi_lightgbm,
                        error_random_forest,
                        error_xgboost,
                        error_lightgbm,
                        created_at
                    )
                    VALUES (
                        :tanggal_prediksi,
                        :commodity_id,
                        :harga_aktual,
                        :prediksi_random_forest,
                        :prediksi_xgboost,
                        :prediksi_lightgbm,
                        :error_random_forest,
                        :error_xgboost,
                        :error_lightgbm,
                        :created_at
                    )
                    ON DUPLICATE KEY UPDATE
                        harga_aktual = VALUES(harga_aktual),
                        prediksi_random_forest = VALUES(prediksi_random_forest),
                        prediksi_xgboost = VALUES(prediksi_xgboost),
                        prediksi_lightgbm = VALUES(prediksi_lightgbm),
                        error_random_forest = VALUES(error_random_forest),
                        error_xgboost = VALUES(error_xgboost),
                        error_lightgbm = VALUES(error_lightgbm),
                        created_at = VALUES(created_at)
                """),
                {
                    "tanggal_prediksi": pd.to_datetime(row["tanggal_prediksi"]).date(),
                    "commodity_id": int(row["commodity_id"]),
                    "harga_aktual": int(row["harga_aktual"]),
                    "prediksi_random_forest": float(row["prediksi_random_forest"]),
                    "prediksi_xgboost": float(row["prediksi_xgboost"]),
                    "prediksi_lightgbm": float(row["prediksi_lightgbm"]),
                    "error_random_forest": float(row["error_random_forest"]),
                    "error_xgboost": float(row["error_xgboost"]),
                    "error_lightgbm": float(row["error_lightgbm"]),
                    "created_at": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
                },
            )

def save_ipj_to_mysql(df_new):
    with engine.begin() as conn:
        commodities_db = pd.read_sql(
            """
            SELECT
                commodity_id,
                nama_komoditas
            FROM commodities
            """,
            conn
        )

        commodities_db["nama_key"] = commodities_db["nama_komoditas"].apply(
            normalize_name
        )

        commodity_map = dict(
            zip(
                commodities_db["nama_key"],
                commodities_db["commodity_id"]
            )
        )

        inserted = 0
        skipped = []

        for _, row in df_new.iterrows():
            nama_ipj = row["komoditas"]
            nama_key = normalize_name(nama_ipj)

            commodity_id = commodity_map.get(nama_key)

            if commodity_id is None:
                skipped.append(nama_ipj)
                continue

            conn.execute(
                text("""
                    INSERT INTO price_history (
                        tanggal,
                        commodity_id,
                        harga,
                        harga_sebelumnya,
                        perubahan_rupiah,
                        perubahan_persen,
                        harga_rata_rata,
                        harga_terendah,
                        harga_tertinggi,
                        status_perubahan
                    )
                    VALUES (
                        :tanggal,
                        :commodity_id,
                        :harga,
                        :harga_sebelumnya,
                        :perubahan_rupiah,
                        :perubahan_persen,
                        :harga_rata_rata,
                        :harga_terendah,
                        :harga_tertinggi,
                        :status_perubahan
                    )
                    ON DUPLICATE KEY UPDATE
                        harga = VALUES(harga),
                        harga_sebelumnya = VALUES(harga_sebelumnya),
                        perubahan_rupiah = VALUES(perubahan_rupiah),
                        perubahan_persen = VALUES(perubahan_persen),
                        harga_rata_rata = VALUES(harga_rata_rata),
                        harga_terendah = VALUES(harga_terendah),
                        harga_tertinggi = VALUES(harga_tertinggi),
                        status_perubahan = VALUES(status_perubahan)
                """),
                {
                    "tanggal": pd.to_datetime(row["tanggal"]).date(),
                    "commodity_id": int(commodity_id),
                    "harga": int(row["harga_terkini"]),
                    "harga_sebelumnya": int(row["harga_sebelumnya"]) if pd.notna(row.get("harga_sebelumnya")) else None,
                    "perubahan_rupiah": int(row["perubahan_rupiah"]) if pd.notna(row.get("perubahan_rupiah")) else None,
                    "perubahan_persen": float(row["perubahan_persen"]) if pd.notna(row.get("perubahan_persen")) else None,
                    "harga_rata_rata": int(row["harga_rata_rata"]) if pd.notna(row.get("harga_rata_rata")) else None,
                    "harga_terendah": int(row["harga_terendah"]) if pd.notna(row.get("harga_terendah")) else None,
                    "harga_tertinggi": int(row["harga_tertinggi"]) if pd.notna(row.get("harga_tertinggi")) else None,
                    "status_perubahan": row.get("status_perubahan"),
                },
            )

            inserted += 1

        return {
            "inserted": inserted,
            "skipped": skipped
        }

def save_forecast_h1_history(output):
    df_new = output.copy()

    df_new["created_at"] = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")

    if os.path.exists(FORECAST_H1_HISTORY_PATH):
        df_old = pd.read_csv(FORECAST_H1_HISTORY_PATH)
    else:
        df_old = pd.DataFrame()

    df_combined = pd.concat([df_old, df_new], ignore_index=True)

    df_combined = df_combined.drop_duplicates(
        subset=["tanggal_prediksi", "komoditas"],
        keep="last"
    )

    df_combined = df_combined.sort_values(
        ["tanggal_prediksi", "komoditas"]
    ).reset_index(drop=True)

    df_combined.to_csv(
        FORECAST_H1_HISTORY_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    return df_combined

def save_forecast_h1_to_mysql(df_forecast):
    with engine.begin() as conn:
        for _, row in df_forecast.iterrows():
            conn.execute(
                text("""
                    INSERT INTO forecast_h1 (
                        tanggal_prediksi,
                        tanggal_terakhir,
                        commodity_id,
                        harga_terakhir,
                        prediksi_random_forest,
                        prediksi_xgboost,
                        prediksi_lightgbm,
                        batas_aman_dinamis,
                        status_stabilitas,
                        harga_kemarin,
                        harga_3_hari_lalu,
                        harga_7_hari_lalu,
                        harga_14_hari_lalu,
                        rata_rata_7_hari,
                        rata_rata_14_hari,
                        fluktuasi_7_hari,
                        bulan,
                        hari_dalam_minggu,
                        created_at
                    )
                    VALUES (
                        :tanggal_prediksi,
                        :tanggal_terakhir,
                        :commodity_id,
                        :harga_terakhir,
                        :prediksi_random_forest,
                        :prediksi_xgboost,
                        :prediksi_lightgbm,
                        :batas_aman_dinamis,
                        :status_stabilitas,
                        :harga_kemarin,
                        :harga_3_hari_lalu,
                        :harga_7_hari_lalu,
                        :harga_14_hari_lalu,
                        :rata_rata_7_hari,
                        :rata_rata_14_hari,
                        :fluktuasi_7_hari,
                        :bulan,
                        :hari_dalam_minggu,
                        :created_at
                    )
                    ON DUPLICATE KEY UPDATE
                        tanggal_terakhir = VALUES(tanggal_terakhir),
                        harga_terakhir = VALUES(harga_terakhir),
                        prediksi_random_forest = VALUES(prediksi_random_forest),
                        prediksi_xgboost = VALUES(prediksi_xgboost),
                        prediksi_lightgbm = VALUES(prediksi_lightgbm),
                        batas_aman_dinamis = VALUES(batas_aman_dinamis),
                        status_stabilitas = VALUES(status_stabilitas),
                        harga_kemarin = VALUES(harga_kemarin),
                        harga_3_hari_lalu = VALUES(harga_3_hari_lalu),
                        harga_7_hari_lalu = VALUES(harga_7_hari_lalu),
                        harga_14_hari_lalu = VALUES(harga_14_hari_lalu),
                        rata_rata_7_hari = VALUES(rata_rata_7_hari),
                        rata_rata_14_hari = VALUES(rata_rata_14_hari),
                        fluktuasi_7_hari = VALUES(fluktuasi_7_hari),
                        bulan = VALUES(bulan),
                        hari_dalam_minggu = VALUES(hari_dalam_minggu),
                        created_at = VALUES(created_at)
                """),
                {
                    "tanggal_prediksi": pd.to_datetime(row["tanggal_prediksi"]).date(),
                    "tanggal_terakhir": pd.to_datetime(row["tanggal_terakhir"]).date(),
                    "commodity_id": int(row["commodity_id"]),
                    "harga_terakhir": int(row["harga_terakhir"]),
                    "prediksi_random_forest": float(row["prediksi_random_forest"]),
                    "prediksi_xgboost": float(row["prediksi_xgboost"]),
                    "prediksi_lightgbm": float(row["prediksi_lightgbm"]),
                    "batas_aman_dinamis": float(row["batas_aman_dinamis"]) if pd.notna(row["batas_aman_dinamis"]) else None,
                    "status_stabilitas": row["status_stabilitas"],
                    "harga_kemarin": float(row["harga_kemarin"]),
                    "harga_3_hari_lalu": float(row["harga_3_hari_lalu"]),
                    "harga_7_hari_lalu": float(row["harga_7_hari_lalu"]),
                    "harga_14_hari_lalu": float(row["harga_14_hari_lalu"]),
                    "rata_rata_7_hari": float(row["rata_rata_7_hari"]),
                    "rata_rata_14_hari": float(row["rata_rata_14_hari"]),
                    "fluktuasi_7_hari": float(row["fluktuasi_7_hari"]),
                    "bulan": int(row["bulan"]),
                    "hari_dalam_minggu": int(row["hari_dalam_minggu"]),
                    "created_at": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
                },
            )

@app.route("/price-history", methods=["GET"])
def price_history():
    try:
        query = """
            SELECT
                p.id,
                p.tanggal,
                p.commodity_id,
                c.nama_komoditas AS komoditas,
                p.harga,
                p.harga_sebelumnya,
                p.perubahan_rupiah,
                p.perubahan_persen,
                p.harga_rata_rata,
                p.harga_terendah,
                p.harga_tertinggi,
                p.status_perubahan,
                c.unit,
                p.created_at
            FROM price_history p
            JOIN commodities c
                ON c.commodity_id = p.commodity_id
            ORDER BY p.tanggal ASC, c.nama_komoditas ASC
        """

        df = pd.read_sql(query, engine)

        if df.empty:
            return jsonify({
                "message": "Data price_history belum tersedia",
                "total_data": 0,
                "data": []
            })

        df["tanggal"] = df["tanggal"].astype(str)
        df["created_at"] = df["created_at"].astype(str)

        df = df.replace({np.nan: None})

        return jsonify({
            "total_data": len(df),
            "data": df.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/update-ipj", methods=["GET"])
def update_ipj():
    try:
        df_new = get_ipj_latest_prices()

        required_columns = [
            "tanggal",
            "komoditas",
            "harga_terkini",
            "unit",
        ]

        missing_columns = [
            col for col in required_columns
            if col not in df_new.columns
        ]

        if missing_columns:
            return jsonify({
                "error": "Data hasil API IPJ tidak lengkap",
                "missing_columns": missing_columns,
                "available_columns": df_new.columns.tolist()
            }), 400

        if os.path.exists(HARGA_TERKINI_PATH):
            df_old = pd.read_csv(HARGA_TERKINI_PATH)
        else:
            df_old = pd.DataFrame()

        df_combined = pd.concat([df_old, df_new], ignore_index=True)

        df_combined["tanggal"] = pd.to_datetime(
            df_combined["tanggal"],
            errors="coerce"
        )

        df_combined = df_combined.drop_duplicates(
            subset=["tanggal", "komoditas"],
            keep="last"
        )

        df_combined = df_combined.sort_values(
            ["komoditas", "tanggal"]
        ).reset_index(drop=True)

        df_combined.to_csv(
            HARGA_TERKINI_PATH,
            index=False,
            encoding="utf-8-sig"
        )
        mysql_result = save_ipj_to_mysql(df_new)

        return jsonify({
            "message": "Update harga terkini IPJ berhasil",
            "jumlah_data_baru": len(df_new),
            "mysql_inserted": mysql_result["inserted"],
            "mysql_skipped": mysql_result["skipped"],
            "total_data_tersimpan": len(df_combined),
            "tanggal_update": str(df_new["tanggal"].max().date()),
            "file": "harga_terkini_ipj.csv",
            "data": df_new.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

@app.route("/import-historis-csv", methods=["GET"])
def import_historis_csv():
    try:
        df = pd.read_csv(HISTORIS_PATH)

        df["time"] = pd.to_datetime(df["time"], errors="coerce")
        df["harga"] = pd.to_numeric(df["harga"], errors="coerce")
        df["commodity_id"] = pd.to_numeric(df["commodity_id"], errors="coerce")

        df = df.dropna()
        df = df[df["harga"] > 0]
        df["commodity_id"] = df["commodity_id"].astype(int)

        with engine.begin() as conn:
            for _, row in df.iterrows():
                conn.execute(
                    text("""
                        INSERT INTO commodities (
                            commodity_id,
                            nama_komoditas,
                            unit,
                            source
                        )
                        VALUES (
                            :commodity_id,
                            :nama_komoditas,
                            :unit,
                            :source
                        )
                        ON DUPLICATE KEY UPDATE
                            nama_komoditas = VALUES(nama_komoditas),
                            unit = VALUES(unit),
                            source = VALUES(source)
                    """),
                    {
                        "commodity_id": int(row["commodity_id"]),
                        "nama_komoditas": row["nama_komoditas"],
                        "unit": row.get("unit", "Rp"),
                        "source": "CSV Historis 2026",
                    },
                )

                conn.execute(
                    text("""
                        INSERT INTO price_history (
                            tanggal,
                            commodity_id,
                            harga
                        )
                        VALUES (
                            :tanggal,
                            :commodity_id,
                            :harga
                        )
                        ON DUPLICATE KEY UPDATE
                            harga = VALUES(harga)
                    """),
                    {
                        "tanggal": pd.to_datetime(row["time"]).date(),
                        "commodity_id": int(row["commodity_id"]),
                        "harga": int(row["harga"]),
                    },
                )

        return jsonify({
            "message": "Import historis CSV ke MySQL berhasil",
            "total_data": len(df)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500        

@app.route("/forecast-h1", methods=["GET"])
def forecast_h1():
    try:
        if not os.path.exists(HISTORIS_PATH):
            return jsonify({
                "error": "File historis belum tersedia. Jalankan update IPJ terlebih dahulu."
            }), 404

        df = load_price_history_mysql()

        df["time"] = pd.to_datetime(df["time"], errors="coerce")
        df["harga"] = pd.to_numeric(df["harga"], errors="coerce")
        df["commodity_id"] = pd.to_numeric(df["commodity_id"], errors="coerce")

        df = df.dropna()
        df = df[df["harga"] > 0]
        df["commodity_id"] = df["commodity_id"].astype(int)

        df = df.sort_values(["commodity_id", "time"]).reset_index(drop=True)

        forecast_rows = []

        df["nama_key"] = df["nama_komoditas"].apply(normalize_name)

        for nama_key, group in df.groupby("nama_key"):
            group = group.sort_values("time").copy()

            if len(group) < 14:
                continue

            last_date = group["time"].max()
            next_date = last_date + pd.Timedelta(days=1)

            last_14 = group.tail(14)
            last_7 = group.tail(7)
            last_3 = group.tail(3)

            row = {
                    "tanggal_prediksi": next_date,
                    "komoditas": group["nama_komoditas"].iloc[-1],
                    "commodity_id": int(group["commodity_id"].iloc[-1]),

                    "harga_terakhir": group["harga"].iloc[-1],
                    "tanggal_terakhir": last_date,

                    "lag_1": group["harga"].iloc[-1],
                    "lag_3": group["harga"].iloc[-3],
                    "lag_7": group["harga"].iloc[-7],
                    "lag_14": group["harga"].iloc[-14],
                    "rolling_mean_3": last_3["harga"].mean(),
                    "rolling_mean_7": last_7["harga"].mean(),
                    "rolling_mean_14": last_14["harga"].mean(),
                    "rolling_std_7": last_7["harga"].std(),
                    "rolling_std_14": last_14["harga"].std(),
                    "diff_1": group["harga"].iloc[-1] - group["harga"].iloc[-2],
                    "day": next_date.day,
                    "month": next_date.month,
                    "year": next_date.year,
                    "day_of_week": next_date.dayofweek,

                    "harga_kemarin": group["harga"].iloc[-1],
                    "harga_3_hari_lalu": group["harga"].iloc[-3],
                    "harga_7_hari_lalu": group["harga"].iloc[-7],
                    "harga_14_hari_lalu": group["harga"].iloc[-14],
                    "rata_rata_7_hari": last_7["harga"].mean(),
                    "rata_rata_14_hari": last_14["harga"].mean(),
                    "fluktuasi_7_hari": last_7["harga"].std(),
                    "bulan": next_date.month,
                    "hari_dalam_minggu": next_date.dayofweek,
            }

            X_next = pd.DataFrame([row])[features]

            pred_rf = float(rf.predict(X_next)[0])
            pred_xgb = float(xgb.predict(X_next)[0])
            pred_lgbm = float(lgbm.predict(X_next)[0])

            row["prediksi_random_forest"] = pred_rf
            row["prediksi_xgboost"] = pred_xgb
            row["prediksi_lightgbm"] = pred_lgbm

            forecast_rows.append(row)

        result = pd.DataFrame(forecast_rows)

        if result.empty:
            return jsonify({
                "error": "Data historis tidak cukup untuk membuat prediksi H+1."
            }), 400

        rata7_arr = result["rata_rata_7_hari"].values
        std7_arr = result["fluktuasi_7_hari"].values
        
        batas_aman_list = []
        status_list = []

        for i, pred_row in result.iterrows():
            avg_pred = (pred_row["prediksi_random_forest"] + pred_row["prediksi_xgboost"] + pred_row["prediksi_lightgbm"]) / 3
            rata7 = pred_row["rata_rata_7_hari"]
            std7 = pred_row["fluktuasi_7_hari"]
            
            if pd.isna(std7) or std7 == 0:
                std7 = rata7 * 0.02
                
            batas_aman = rata7 + std7
            
            status = klasifikasi(avg_pred, rata7, std7)
            
            batas_aman_list.append(batas_aman)
            status_list.append(status)

        result["batas_aman_dinamis"] = batas_aman_list
        result["status_stabilitas"] = status_list

        result["tanggal_prediksi"] = result["tanggal_prediksi"].dt.strftime("%Y-%m-%d")
        result["tanggal_terakhir"] = result["tanggal_terakhir"].dt.strftime("%Y-%m-%d")

        output = result[[
            "tanggal_prediksi",
            "komoditas",
            "commodity_id",
            "harga_terakhir",
            "tanggal_terakhir",
            "prediksi_random_forest",
            "prediksi_xgboost",
            "prediksi_lightgbm",
            "batas_aman_dinamis",
            "status_stabilitas",
            "harga_kemarin",
            "harga_3_hari_lalu",
            "harga_7_hari_lalu",
            "harga_14_hari_lalu",
            "rata_rata_7_hari",
            "rata_rata_14_hari",
            "fluktuasi_7_hari",
            "bulan",
            "hari_dalam_minggu"
        ]]

        save_forecast_h1_to_mysql(output)

        forecast_history = save_forecast_h1_history(output)
        return jsonify({
            "message": "Prediksi H+1 berhasil dan tersimpan ke MySQL",
            "total_data": len(output),
            "total_history": len(forecast_history),
            "file": "forecast_history_h1.csv",
            "data": output.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get-commodities", methods=["GET"])
def get_commodities():
    try:
        query = text("SELECT DISTINCT nama_komoditas FROM commodities ORDER BY nama_komoditas ASC")
        df_comm = pd.read_sql(query, engine)
        
        list_komoditas = df_comm["nama_komoditas"].tolist()
        return jsonify({"commodities": list_komoditas}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-custom", methods=["POST"])
def predict_custom():
    try:
        data = request.json
        komoditas = data.get("komoditas")
        tanggal_target_str = data.get("tanggal")

        if not komoditas or not tanggal_target_str:
            return jsonify({"error": "Komoditas dan tanggal harus diisi"}), 400

        target_date = pd.to_datetime(tanggal_target_str)

        query = """
            SELECT p.tanggal AS time, p.harga, c.commodity_id 
            FROM price_history p
            JOIN commodities c ON c.commodity_id = p.commodity_id
            WHERE c.nama_komoditas = :komoditas
            ORDER BY p.tanggal ASC
        """
        df_hist = pd.read_sql(text(query), engine, params={"komoditas": komoditas})

        if len(df_hist) < 14:
            return jsonify({"error": "Data historis tidak cukup (minimal 14 hari) untuk komoditas ini."}), 400
        
        df_hist["harga"] = pd.to_numeric(df_hist["harga"], errors="coerce")
        df_hist["time"] = pd.to_datetime(df_hist["time"])
        
        df_hist_tail = df_hist.tail(14).copy()
        df_hist_tail["time"] = df_hist_tail["time"].dt.strftime("%Y-%m-%d")
        historical_data = df_hist_tail.rename(columns={"time": "tanggal"}).to_dict(orient="records")

        commodity_id = int(df_hist["commodity_id"].iloc[0])
        last_actual_date = df_hist["time"].iloc[-1]

        if target_date <= last_actual_date:
            return jsonify({"error": "Tanggal target harus setelah hari ini."}), 400

        prices = df_hist["harga"].tolist()
        
        date_range = pd.date_range(start=last_actual_date + pd.Timedelta(days=1), end=target_date)
        
        future_predictions = []

        for current_date in date_range:
            last_3 = prices[-3:]
            last_7 = prices[-7:]
            last_14 = prices[-14:]
            
            series_7 = pd.Series(last_7)
            series_14 = pd.Series(last_14)

            row = {
                "commodity_id": commodity_id,
                "lag_1": float(prices[-1]),
                "lag_3": float(prices[-3]),
                "lag_7": float(prices[-7]),
                "lag_14": float(prices[-14]),
                "rolling_mean_3": float(np.mean(last_3)),
                "rolling_mean_7": float(np.mean(last_7)),
                "rolling_mean_14": float(np.mean(last_14)),
                "rolling_std_7": float(series_7.std()),
                "rolling_std_14": float(series_14.std()),
                "diff_1": float(prices[-1] - prices[-2]),
                "day": current_date.day,
                "month": current_date.month,
                "year": current_date.year,
                "day_of_week": current_date.dayofweek,
            }

            X_input = pd.DataFrame([row])[features]

            pred_rf = float(rf.predict(X_input)[0])
            pred_xgb = float(xgb.predict(X_input)[0])
            pred_lgbm = float(lgbm.predict(X_input)[0])

            rata7 = row["rolling_mean_7"]
            std7 = row["rolling_std_7"]
            avg_pred = (pred_rf + pred_xgb + pred_lgbm) / 3
            
            if pd.isna(std7) or std7 == 0:
                std7 = rata7 * 0.02
                
            batas_aman = rata7 + std7
            batas_waspada = rata7 + (2 * std7)
            status = klasifikasi(avg_pred, rata7, std7)

            future_predictions.append({
                "tanggal": current_date.strftime("%Y-%m-%d"),
                "rf": round(pred_rf),
                "xgb": round(pred_xgb),
                "lgbm": round(pred_lgbm),
                "batas_aman": round(batas_aman),
                "batas_waspada": round(batas_waspada),
                "status_stabilitas": status
            })

            prices.append(avg_pred)

        return jsonify({
            "komoditas": komoditas,
            "tanggal_target": target_date.strftime("%Y-%m-%d"),
            "historical_data": historical_data,
            "future_predictions": future_predictions
        }), 200

    except Exception as e:
        return jsonify({"error": f"Gagal memproses prediksi multi-step: {str(e)}"}), 500

@app.route("/evaluate-h1", methods=["GET"])
def evaluate_h1():
    try:
        df_forecast = pd.read_sql("""
            SELECT
                f.id,
                f.tanggal_prediksi,
                f.commodity_id,
                c.nama_komoditas AS komoditas,
                f.prediksi_random_forest,
                f.prediksi_xgboost,
                f.prediksi_lightgbm
            FROM forecast_h1 f
            JOIN commodities c
                ON c.commodity_id = f.commodity_id
            WHERE f.is_evaluated = 0
        """, engine)

        df_actual = pd.read_sql("""
            SELECT
                p.tanggal,
                p.commodity_id,
                p.harga AS harga_aktual
            FROM price_history p
        """, engine)

        if df_forecast.empty:
            return jsonify({
                "message": "Tidak ada data prediksi H+1 yang perlu dievaluasi",
                "data": []
            })

        df_forecast["tanggal_prediksi"] = pd.to_datetime(
            df_forecast["tanggal_prediksi"],
            errors="coerce"
        )

        df_actual["tanggal"] = pd.to_datetime(
            df_actual["tanggal"],
            errors="coerce"
        )

        df_forecast["commodity_id"] = pd.to_numeric(
            df_forecast["commodity_id"],
            errors="coerce"
        )

        df_actual["commodity_id"] = pd.to_numeric(
            df_actual["commodity_id"],
            errors="coerce"
        )

        df_forecast = df_forecast.dropna(
            subset=["tanggal_prediksi", "commodity_id"]
        )

        df_actual = df_actual.dropna(
            subset=["tanggal", "commodity_id", "harga_aktual"]
        )

        df_forecast["commodity_id"] = df_forecast["commodity_id"].astype(int)
        df_actual["commodity_id"] = df_actual["commodity_id"].astype(int)

        df_eval = df_forecast.merge(
            df_actual[[
                "tanggal",
                "commodity_id",
                "harga_aktual"
            ]],
            left_on=["tanggal_prediksi", "commodity_id"],
            right_on=["tanggal", "commodity_id"],
            how="inner"
        )

        if df_eval.empty:
            return jsonify({
                "message": "Belum ada data aktual yang cocok dengan tanggal prediksi",
                "data": []
            })

        df_eval["harga_aktual"] = pd.to_numeric(
            df_eval["harga_aktual"],
            errors="coerce"
        )

        df_eval["error_random_forest"] = abs(
            df_eval["harga_aktual"] - df_eval["prediksi_random_forest"]
        )

        df_eval["error_xgboost"] = abs(
            df_eval["harga_aktual"] - df_eval["prediksi_xgboost"]
        )

        df_eval["error_lightgbm"] = abs(
            df_eval["harga_aktual"] - df_eval["prediksi_lightgbm"]
        )

        output = df_eval[[
            "tanggal_prediksi",
            "commodity_id",
            "komoditas",
            "harga_aktual",
            "prediksi_random_forest",
            "prediksi_xgboost",
            "prediksi_lightgbm",
            "error_random_forest",
            "error_xgboost",
            "error_lightgbm"
        ]].copy()

        update_forecast_evaluation(output)

        output["tanggal_prediksi"] = output["tanggal_prediksi"].dt.strftime(
            "%Y-%m-%d"
        )

        return jsonify({
            "message": "Evaluasi H+1 berhasil dan tersimpan ke tabel forecast_h1",
            "total_data": len(output),
            "data": output.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def update_forecast_evaluation(df_eval):
    with engine.begin() as conn:
        for _, row in df_eval.iterrows():
            conn.execute(
                text("""
                    UPDATE forecast_h1
                    SET
                        harga_aktual = :harga_aktual,
                        error_random_forest = :error_rf,
                        error_xgboost = :error_xgb,
                        error_lightgbm = :error_lgbm,
                        is_evaluated = 1
                    WHERE
                        commodity_id = :commodity_id
                        AND tanggal_prediksi = :tanggal_prediksi
                """),
                {
                    "commodity_id": int(row["commodity_id"]),
                    "tanggal_prediksi": pd.to_datetime(
                        row["tanggal_prediksi"]
                    ).date(),
                    "harga_aktual": float(row["harga_aktual"]),
                    "error_rf": float(row["error_random_forest"]),
                    "error_xgb": float(row["error_xgboost"]),
                    "error_lgbm": float(row["error_lightgbm"]),
                }
            )    

@app.route("/forecast-history", methods=["GET"])
def forecast_history():
    try:
        query = """
            SELECT
                f.id,
                f.tanggal_prediksi AS tanggal,
                f.tanggal_terakhir,
                f.commodity_id,
                c.nama_komoditas AS komoditas,
                f.harga_kemarin,
                f.harga_3_hari_lalu,
                f.harga_7_hari_lalu,
                f.harga_14_hari_lalu,
                f.rata_rata_7_hari,
                f.rata_rata_14_hari,
                f.fluktuasi_7_hari,
                f.bulan,
                f.hari_dalam_minggu,
                f.harga_terakhir,
                f.harga_aktual AS harga_sebenarnya,

                f.prediksi_random_forest,
                f.prediksi_xgboost,
                f.prediksi_lightgbm,

                f.error_random_forest,
                f.error_xgboost,
                f.error_lightgbm,

                f.batas_aman_dinamis,
                f.status_stabilitas,

                f.harga_aktual,
                f.is_evaluated,
                f.created_at
            FROM forecast_h1 f
            JOIN commodities c
                ON c.commodity_id = f.commodity_id
            ORDER BY f.tanggal_prediksi DESC, c.nama_komoditas ASC
        """

        df = pd.read_sql(query, engine)

        if df.empty:
            return jsonify({
                "message": "Data forecast_h1 belum tersedia",
                "total_data": 0,
                "data": []
            })

        df["tanggal"] = df["tanggal"].astype(str)
        df["tanggal_terakhir"] = df["tanggal_terakhir"].astype(str)
        df["created_at"] = df["created_at"].astype(str)

        df = df.replace({np.nan: None})

        return jsonify({
            "total_data": len(df),
            "data": df.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500   

@app.route("/forecast-detail")
def forecast_detail():
    try:
        commodity_id = request.args.get("commodity_id")
        tanggal = request.args.get("tanggal")

        query = """
            SELECT
                commodity_id,
                tanggal_prediksi,
                prediksi_random_forest,
                prediksi_xgboost,
                prediksi_lightgbm,
                harga_aktual,
                batas_aman_dinamis,
                status_stabilitas
            FROM forecast_h1
            WHERE commodity_id = :commodity_id
            AND tanggal_prediksi = :tanggal
            LIMIT 1
        """

        df = pd.read_sql(
            text(query),
            engine,
            params={
                "commodity_id": commodity_id,
                "tanggal": tanggal
            }
        )

        if df.empty:
            return jsonify({})

        row = df.iloc[0].to_dict()

        row = {
            k: (None if pd.isna(v) else v)
            for k, v in row.items()
        }

        return jsonify(row)

    except Exception as e:
        return jsonify({"error": str(e)}), 500                                  

@app.route("/latest-prices", methods=["GET"])
def latest_prices():
    try:
        query = """
            SELECT
                p.tanggal,
                p.commodity_id,
                c.nama_komoditas AS komoditas,
                p.harga AS harga_terkini,
                p.harga_sebelumnya,
                p.perubahan_rupiah,
                p.perubahan_persen,
                p.harga_rata_rata,
                p.harga_terendah,
                p.harga_tertinggi,
                p.status_perubahan,
                c.unit
            FROM price_history p
            JOIN commodities c
                ON c.commodity_id = p.commodity_id
            WHERE p.tanggal = (
                SELECT MAX(tanggal)
                FROM price_history
            )
            ORDER BY c.nama_komoditas ASC
        """

        df = pd.read_sql(query, engine)

        if df.empty:
            return jsonify({
                "message": "Data harga terkini belum tersedia",
                "total_data": 0,
                "data": []
            })

        df["tanggal"] = df["tanggal"].astype(str)

        return jsonify({
            "total_data": len(df),
            "tanggal_terbaru": str(df["tanggal"].iloc[0]),
            "data": df.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend aktif"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)