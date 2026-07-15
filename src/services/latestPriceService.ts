const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export type LatestPriceRow = {
    tanggal: string;
    commodity_id: number;
    komoditas: string;
    harga_terkini: number;
    harga_sebelumnya: number | null;
    perubahan_rupiah: number | null;
    perubahan_persen: number | null;
    harga_rata_rata: number | null;
    harga_terendah: number | null;
    harga_tertinggi: number | null;
    status_perubahan: string | null;
    unit: string;
};

export async function loadLatestPriceData(): Promise<LatestPriceRow[]> {
    const response = await fetch(`${API_BASE_URL}/latest-prices`);

    if (!response.ok) {
        return [];
    }

    const result = await response.json();
    return result.data || [];
}