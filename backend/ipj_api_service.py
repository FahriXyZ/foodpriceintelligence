import requests
import pandas as pd

SOURCE_URL = "https://infopangan.jakarta.go.id/api2/v1/public/master-data/commodities?date="


def get_ipj_latest_prices():
    response = requests.get(
        SOURCE_URL,
        timeout=30,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        },
    )

    response.raise_for_status()

    json_data = response.json()

    if json_data.get("status") != 200:
        raise ValueError("Response IPJ tidak sukses")

    payload = json_data.get("data", {})
    selected_date = payload.get("selected_price_date")
    commodities = payload.get("data", [])

    if not commodities:
        raise ValueError("Data komoditas kosong dari IPJ")

    rows = []

    for item in commodities:
        nama = item.get("name")
        harga_terkini = item.get("newest_price")
        harga_sebelumnya = item.get("prev_price")

        if not nama or harga_terkini is None:
            continue

        perubahan_rupiah = None
        perubahan_persen = None

        if harga_sebelumnya and harga_sebelumnya > 0:
            perubahan_rupiah = harga_terkini - harga_sebelumnya
            perubahan_persen = (perubahan_rupiah / harga_sebelumnya) * 100

        rows.append({
            "tanggal": item.get("newest_price_date") or selected_date,
            "komoditas": nama,
            "commodity_id": item.get("commodity_id"),
            "harga_terkini": harga_terkini,
            "harga_sebelumnya": harga_sebelumnya,
            "perubahan_rupiah": perubahan_rupiah,
            "perubahan_persen": perubahan_persen,
            "harga_rata_rata": item.get("avg_price"),
            "harga_terendah": item.get("lowest_price"),
            "harga_tertinggi": item.get("highest_price"),
            "status_perubahan": item.get("status"),
            "unit": item.get("unit") or "kg",
            "image_path": item.get("image_path"),
        })

    df = pd.DataFrame(rows)

    if df.empty:
        raise ValueError("Data harga tidak ditemukan dari response IPJ")

    df["tanggal"] = pd.to_datetime(df["tanggal"], errors="coerce")
    df["harga_terkini"] = pd.to_numeric(df["harga_terkini"], errors="coerce")

    df = df.dropna(subset=["tanggal", "komoditas", "harga_terkini"])
    df = df.drop_duplicates(subset=["tanggal", "komoditas"], keep="last")
    df = df.reset_index(drop=True)

    return df