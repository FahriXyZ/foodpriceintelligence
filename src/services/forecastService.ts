const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export async function loadForecastHistory() {
    const response = await fetch(`${API_BASE_URL}/forecast-history`);

    if (!response.ok) {
        return [];
    }

    const result = await response.json();
    return result.data || [];
}

export async function generateForecastH1() {
    const response = await fetch(`${API_BASE_URL}/forecast-history`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Gagal membuat prediksi H+1");
    }

    return result.data || [];
}