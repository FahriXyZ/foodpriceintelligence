import Papa from "papaparse";

export type CsvPredictionRow = {
    tanggal: string | number;
    komoditas: string;
    harga_sebenarnya: number;
    prediksi_random_forest: number;
    prediksi_xgboost: number;
    prediksi_lightgbm: number;
    error_random_forest: number;
    error_xgboost: number;
    error_lightgbm: number;
    batas_harga_HET: number;
    status_stabilitas: "Aman" | "Waspada" | "Intervensi";
    harga_kemarin: number;
    harga_3_hari_lalu: number;
    harga_7_hari_lalu: number;
    harga_14_hari_lalu: number;
    rata_rata_7_hari: number;
    rata_rata_14_hari: number;
    fluktuasi_7_hari: number;
    bulan: number;
    hari_dalam_minggu: number;
};

const toNumber = (value: any) => {
    const number = Number(value);
    return Number.isNaN(number) ? 0 : number;
};

export async function loadCsvData(): Promise<CsvPredictionRow[]> {
    const response = await fetch("/data/prediksi_komoditas_2026.csv");

    if (!response.ok) {
        throw new Error("File CSV tidak ditemukan");
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse<any>(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,

            complete: (result) => {
                const normalized: CsvPredictionRow[] = result.data.map((row: any) => ({
                    tanggal: row.tanggal ?? row.Tanggal,

                    komoditas: row.komoditas ?? row.Komoditas,

                    harga_sebenarnya: toNumber(
                        row.harga_sebenarnya ?? row["Harga Aktual"]
                    ),

                    prediksi_random_forest: toNumber(
                        row.prediksi_random_forest ?? row["Prediksi Random Forest"]
                    ),

                    prediksi_xgboost: toNumber(
                        row.prediksi_xgboost ?? row["Prediksi XGBoost"]
                    ),

                    prediksi_lightgbm: toNumber(
                        row.prediksi_lightgbm ?? row["Prediksi LightGBM"]
                    ),

                    error_random_forest: toNumber(
                        row.error_random_forest ?? row["Error Random Forest"]
                    ),

                    error_xgboost: toNumber(
                        row.error_xgboost ?? row["Error XGBoost"]
                    ),

                    error_lightgbm: toNumber(
                        row.error_lightgbm ?? row["Error LightGBM"]
                    ),

                    batas_harga_HET: toNumber(
                        row.batas_harga_HET ?? row.HET
                    ),

                    status_stabilitas:
                        row.status_stabilitas ??
                        row["Status Stabilitas"] ??
                        "Aman",

                    harga_kemarin: toNumber(
                        row.harga_kemarin ?? row["Harga Kemarin"]
                    ),

                    harga_3_hari_lalu: toNumber(
                        row.harga_3_hari_lalu ?? row["Harga 3 Hari Lalu"]
                    ),

                    harga_7_hari_lalu: toNumber(
                        row.harga_7_hari_lalu ?? row["Harga 7 Hari Lalu"]
                    ),

                    harga_14_hari_lalu: toNumber(
                        row.harga_14_hari_lalu ?? row["Harga 14 Hari Lalu"]
                    ),

                    rata_rata_7_hari: toNumber(
                        row.rata_rata_7_hari ?? row["Rata-rata 7 Hari"]
                    ),

                    rata_rata_14_hari: toNumber(
                        row.rata_rata_14_hari ?? row["Rata-rata 14 Hari"]
                    ),

                    fluktuasi_7_hari: toNumber(
                        row.fluktuasi_7_hari ?? row["Fluktuasi Harga 7 Hari"]
                    ),

                    bulan: toNumber(row.bulan ?? row.Bulan),

                    hari_dalam_minggu: toNumber(
                        row.hari_dalam_minggu ?? row["Hari Dalam Minggu"]
                    ),
                }));

                resolve(
                    normalized.filter(
                        (item) => item.tanggal && item.komoditas && item.harga_sebenarnya > 0
                    )
                );
            },

            error: (error: Error) => {
                reject(error);
            },
        });
    });
}