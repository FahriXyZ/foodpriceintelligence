const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const loadForecastDetail = async (
    commodityId: number,
    tanggal: string
) => {
    const response = await fetch(`${API_BASE_URL}/forecast-detail?commodity_id=${commodityId}&tanggal=${tanggal}`);

    if (!response.ok) {
        return null;
    }

    return await response.json();
};