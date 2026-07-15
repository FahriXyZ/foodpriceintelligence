export async function loadForecastHistory() {
    const response = await fetch("http://localhost:5000/forecast-history");

    if (!response.ok) {
        return [];
    }

    const result = await response.json();
    return result.data || [];
}

export async function generateForecastH1() {
    const response = await fetch("http://localhost:5000/forecast-h1");
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Gagal membuat prediksi H+1");
    }

    return result.data || [];
}