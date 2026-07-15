export const loadForecastDetail = async (
    commodityId: number,
    tanggal: string
) => {
    const response = await fetch(
        `http://localhost:5000/forecast-detail?commodity_id=${commodityId}&tanggal=${tanggal}`
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
};