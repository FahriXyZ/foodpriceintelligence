import { useEffect, useState } from "react";
import { loadCsvData, type CsvPredictionRow } from "../services/csvService";

export type FoodCommodity = {
  id: number;
  name: string;
  price: number;
  change: number;
  status: "Aman" | "Waspada" | "Intervensi";
  trend: "up" | "down" | "stable";
};

export type PredictionChartData = {
  date: string;
  actual: number;
  randomForest: number;
  xgboost: number;
  lightgbm: number;
};

export function useFoodData() {
  const [rawData, setRawData] = useState<CsvPredictionRow[]>([]);
  const [foodCommodities, setFoodCommodities] = useState<FoodCommodity[]>([]);
  const [predictionData, setPredictionData] = useState<PredictionChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCsv() {
      try {
        const data = await loadCsvData();

        setRawData(data);

        const latestByCommodity: Record<string, CsvPredictionRow> = {};

        data.forEach((item) => {
          if (item.komoditas) {
            latestByCommodity[item.komoditas] = item;
          }
        });

        const commodities: FoodCommodity[] = Object.values(latestByCommodity)
          .slice(0, 6)
          .map((item, index) => {
            const actual = Number(item.harga_sebenarnya);
            const predicted = Number(item.prediksi_lightgbm);

            const change = actual
              ? Number((((predicted - actual) / actual) * 100).toFixed(2))
              : 0;

            let trend: "up" | "down" | "stable" = "stable";

            if (change > 0) trend = "up";
            if (change < 0) trend = "down";

            return {
              id: index + 1,
              name: item.komoditas,
              price: actual,
              change,
              status: item.status_stabilitas,
              trend,
            };
          });

        setFoodCommodities(commodities);

        const chartData: PredictionChartData[] = data
          .slice(0, 30)
          .map((item) => ({
            date: String(item.tanggal).slice(0, 10),
            actual: Number(item.harga_sebenarnya),
            randomForest: Number(item.prediksi_random_forest),
            xgboost: Number(item.prediksi_xgboost),
            lightgbm: Number(item.prediksi_lightgbm),
          }));

        setPredictionData(chartData);
      } catch (error) {
        console.error("Gagal load data CSV:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCsv();
  }, []);

  return {
    rawData,
    foodCommodities,
    predictionData,
    loading,
  };
}