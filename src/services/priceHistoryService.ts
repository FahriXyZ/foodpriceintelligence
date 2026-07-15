export type PriceHistoryRow = {
    id: number;
    tanggal: string;
    commodity_id: number;
    komoditas: string;
    harga: number;
    harga_sebelumnya: number | null;
    perubahan_rupiah: number | null;
    perubahan_persen: number | null;
    harga_rata_rata: number | null;
    harga_terendah: number | null;
    harga_tertinggi: number | null;
    status_perubahan: string | null;
    unit: string;
    created_at: string | null;
};

export async function loadPriceHistoryData(): Promise<PriceHistoryRow[]> {
    const response = await fetch("http://localhost:5000/price-history");

    if (!response.ok) {
        return [];
    }

    const result = await response.json();
    return result.data || [];
}