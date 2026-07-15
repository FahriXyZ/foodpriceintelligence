export type ForecastHistoryRow = {
    id: number;
    tanggal: string;
    tanggal_terakhir: string;
    commodity_id: number;
    komoditas: string;

    harga_terakhir: number;
    harga_sebenarnya: number | null;
    harga_aktual: number | null;

    prediksi_random_forest: number;
    prediksi_xgboost: number;
    prediksi_lightgbm: number;

    error_random_forest: number | null;
    error_xgboost: number | null;
    error_lightgbm: number | null;

    batas_harga_HET: number | null;
    status_stabilitas: string | null;

    is_evaluated: number;
    created_at: string | null;
};

export async function loadForecastHistoryData(): Promise<ForecastHistoryRow[]> {
    const response = await fetch("http://localhost:5000/forecast-history");

    if (!response.ok) {
        return [];
    }

    const result = await response.json();
    return result.data || [];
}