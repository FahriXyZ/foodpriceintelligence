import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
  Cpu,
  Filter,
  Calendar as CalendarIcon,
  ListFilter,
  TrendingUp,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  X
} from "lucide-react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  loadForecastHistoryData,
  type ForecastHistoryRow,
} from "../services/forecastHistoryService";
import InteractivePredictionTable from "./InteractivePredictionTable";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PricePrediction = () => {
  const [predictionData, setPredictionData] = useState<ForecastHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("prediksi-h1");

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCommodity, setSelectedCommodity] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [evaluationData, setEvaluationData] = useState<any[]>([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");

  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const calculateDynamicThresholds = (data: any[]) => {
    return data.map((item) => {
      const rata7 = Number(item.rata_rata_7_hari || item.batas_harga_ratarata || 0);
      let fluktuasi7 = Number(item.fluktuasi_7_hari || 0);

      if (fluktuasi7 === 0) {
        fluktuasi7 = rata7 * 0.02;
      }

      const batasAman = rata7 + fluktuasi7;
      const batasWaspada = rata7 + (2 * fluktuasi7);

      let hargaAcuan = Number(item.harga_sebenarnya ?? item.harga_aktual);

      if (!hargaAcuan || Number.isNaN(hargaAcuan) || hargaAcuan === 0) {
        const predRf = Number(item.prediksi_random_forest || 0);
        const predXgb = Number(item.prediksi_xgboost || 0);
        const predLgbm = Number(item.prediksi_lightgbm || 0);

        hargaAcuan = (predRf + predXgb + predLgbm) / 3;
      }

      let status = "Aman";
      if (hargaAcuan > batasWaspada) {
        status = "Intervensi";
      } else if (hargaAcuan > batasAman) {
        status = "Waspada";
      }

      return {
        ...item,
        batas_aman_dinamis: batasAman,
        status_stabilitas_dinamis: status
      };
    });
  };

  const loadPredictionHistory = async () => {
    setLoading(true);

    try {
      const data = await loadForecastHistoryData();
      const processedData = calculateDynamicThresholds(data);
      setPredictionData(processedData);

      if (processedData.length > 0) {
        const allDates = processedData.map((d: any) =>
          convertToDate(d.tanggal_prediksi || d.tanggal).getTime()
        );
        const maxDate = Math.max(...allDates);

        const latestForecasts = processedData.filter(
          (d: any) =>
            convertToDate(d.tanggal_prediksi || d.tanggal).getTime() === maxDate
        );
        setForecastData(latestForecasts);

        const evaluatedData = processedData.filter((d: any) => {
          const actual = Number(d.harga_sebenarnya ?? d.harga_aktual);
          return !Number.isNaN(actual) && actual > 0;
        });

        if (evaluatedData.length > 0) {
          const evalDates = evaluatedData.map((d: any) =>
            convertToDate(d.tanggal_prediksi || d.tanggal).getTime()
          );
          const maxEvalDate = Math.max(...evalDates);

          const latestEvaluations = evaluatedData.filter(
            (d: any) =>
              convertToDate(d.tanggal_prediksi || d.tanggal).getTime() === maxEvalDate
          );
          setEvaluationData(latestEvaluations);
        }
      }
    } catch (error) {
      setPredictionData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictionHistory();
  }, []);

  const convertToDate = (value: any) => {
    if (!value) return new Date(0);

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      return new Date(`${text.slice(0, 10)}T00:00:00`);
    }

    return new Date(text);
  };

  const formatTanggal = (value: any) => {
    const date = convertToDate(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getMonthFromTanggal = (value: any) => {
    const date = convertToDate(value);

    if (Number.isNaN(date.getTime())) return "";

    return String(date.getMonth() + 1);
  };

  const formatRupiah = (value: any) => {
    const number = Number(value);

    if (Number.isNaN(number)) return "-";

    return number.toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    });
  };

  const monthOptions = [
    { value: "all", label: "Semua Bulan" },
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const perPageOptions = [10, 25, 50, 100, 250];

  const commodityOptions = useMemo(() => {
    const unique = Array.from(
      new Set(predictionData.map((item: any) => item.komoditas).filter(Boolean))
    );

    return unique.sort();
  }, [predictionData]);

  const filteredData = useMemo(() => {
    return predictionData.filter((item: any) => {
      const month = getMonthFromTanggal(item.tanggal || item.tanggal_prediksi);
      const matchMonth = selectedMonth === "all" || month === selectedMonth;
      const matchCommodity =
        selectedCommodity === "all" || item.komoditas === selectedCommodity;

      return matchMonth && matchCommodity;
    });
  }, [predictionData, selectedMonth, selectedCommodity]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const startData =
    filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endData = Math.min(currentPage * itemsPerPage, filteredData.length);

  const chartData = useMemo(() => {
    if (selectedMonth === "all") {
      return monthOptions
        .filter((month) => month.value !== "all")
        .map((month) => {
          const dataPerMonth = filteredData.filter((item: any) => {
            const itemMonth = getMonthFromTanggal(item.tanggal || item.tanggal_prediksi);
            return itemMonth === month.value;
          });

          const avg = (key: string) => {
            if (dataPerMonth.length === 0) return 0;
            const total = dataPerMonth.reduce(
              (sum: number, item: any) => sum + Number(item[key] || 0),
              0
            );
            return total / dataPerMonth.length;
          };

          return {
            label: month.label,
            aktual: avg("harga_sebenarnya") || avg("harga_aktual"),
            randomForest: avg("prediksi_random_forest"),
            xgboost: avg("prediksi_xgboost"),
            lightgbm: avg("prediksi_lightgbm"),
          };
        });
    }

    const groupedByDate = filteredData.reduce((acc: any, item: any) => {
      const rawDate = String(item.tanggal || item.tanggal_prediksi || "");
      const key = rawDate.slice(0, 10);

      if (!key || key.length < 10) return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);

      return acc;
    }, {});

    return Object.keys(groupedByDate)
      .sort()
      .map((dateKey) => {
        const dataPerDate = groupedByDate[dateKey];

        const avg = (key: string) => {
          if (dataPerDate.length === 0) return 0;
          const total = dataPerDate.reduce(
            (sum: number, item: any) => sum + Number(item[key] || 0),
            0
          );
          return total / dataPerDate.length;
        };

        const [year, month, day] = dateKey.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        const labelFormatted = dateObj.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        return {
          label: labelFormatted,
          aktual: avg("harga_sebenarnya") || avg("harga_aktual"),
          randomForest: avg("prediksi_random_forest"),
          xgboost: avg("prediksi_xgboost"),
          lightgbm: avg("prediksi_lightgbm"),
        };
      });
  }, [filteredData, selectedMonth]);

  const summary = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        total: 0,
        avgActual: 0,
        avgRf: 0,
        avgXgb: 0,
        avgLgbm: 0,
      };
    }

    const total = filteredData.length;

    let sumActual = 0;
    let validActualCount = 0;
    let sumRf = 0;
    let sumXgb = 0;
    let sumLgbm = 0;

    filteredData.forEach((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);

      if (actual && actual > 0) {
        sumActual += actual;
        validActualCount++;
      }

      sumRf += Number(item.prediksi_random_forest || 0);
      sumXgb += Number(item.prediksi_xgboost || 0);
      sumLgbm += Number(item.prediksi_lightgbm || 0);
    });

    return {
      total,
      avgActual: validActualCount > 0 ? sumActual / validActualCount : 0,
      avgRf: sumRf / total,
      avgXgb: sumXgb / total,
      avgLgbm: sumLgbm / total,
    };
  }, [filteredData]);

  const bestModelSummary = useMemo(() => {
    const counter = {
      randomForest: 0,
      xgboost: 0,
      lightgbm: 0,
    };

    filteredData.forEach((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);
      if (!actual || actual <= 0) return;

      const errRf = Math.abs(actual - Number(item.prediksi_random_forest));
      const errXgb = Math.abs(actual - Number(item.prediksi_xgboost));
      const errLgbm = Math.abs(actual - Number(item.prediksi_lightgbm));

      const minErr = Math.min(errRf, errXgb, errLgbm);
      if (minErr === errRf) {
        counter.randomForest += 1;
      } else if (minErr === errXgb) {
        counter.xgboost += 1;
      } else if (minErr === errLgbm) {
        counter.lightgbm += 1;
      }
    });

    const modelLabels = {
      randomForest: "Random Forest",
      xgboost: "XGBoost",
      lightgbm: "LightGBM",
    };

    const bestModel = Object.entries(counter).sort((a, b) => b[1] - a[1])[0];

    return {
      name: modelLabels[bestModel[0] as keyof typeof modelLabels] || "Tidak Ada",
      count: bestModel[1] || 0,
      details: {
        rf: counter.randomForest,
        xgb: counter.xgboost,
        lgbm: counter.lightgbm
      }
    };
  }, [filteredData]);

  const evaluationSummary = useMemo(() => {
    const dataToEvaluate = activeTab === "evaluasi" ? evaluationData : filteredData;

    const validData = dataToEvaluate.filter((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);
      const rf = Number(item.prediksi_random_forest);
      const xgb = Number(item.prediksi_xgboost);
      const lgbm = Number(item.prediksi_lightgbm);
      return !Number.isNaN(actual) && actual > 0 && !Number.isNaN(rf) && !Number.isNaN(xgb) && !Number.isNaN(lgbm);
    });

    if (validData.length === 0) return null;

    const total = validData.length;

    const rfMae = validData.reduce((sum, item) => sum + Math.abs(Number(item.harga_sebenarnya ?? item.harga_aktual) - Number(item.prediksi_random_forest)), 0) / total;
    const xgbMae = validData.reduce((sum, item) => sum + Math.abs(Number(item.harga_sebenarnya ?? item.harga_aktual) - Number(item.prediksi_xgboost)), 0) / total;
    const lgbmMae = validData.reduce((sum, item) => sum + Math.abs(Number(item.harga_sebenarnya ?? item.harga_aktual) - Number(item.prediksi_lightgbm)), 0) / total;

    const winCounts = { randomForest: 0, xgboost: 0, lightgbm: 0 };
    validData.forEach((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);
      const errRf = Math.abs(actual - Number(item.prediksi_random_forest));
      const errXgb = Math.abs(actual - Number(item.prediksi_xgboost));
      const errLgbm = Math.abs(actual - Number(item.prediksi_lightgbm));

      const minErr = Math.min(errRf, errXgb, errLgbm);
      if (minErr === errLgbm) winCounts.lightgbm++;
      else if (minErr === errXgb) winCounts.xgboost++;
      else winCounts.randomForest++;
    });

    let correctAlarms = 0;
    validData.forEach((item: any) => {
      const rata7 = Number(item.rata_rata_7_hari || item.batas_harga_ratarata || 0);
      let fluktuasi7 = Number(item.fluktuasi_7_hari || 0);
      if (fluktuasi7 === 0) {
        fluktuasi7 = rata7 * 0.02;
      }

      const batasAman = rata7 + fluktuasi7;
      const batasWaspada = rata7 + (2 * fluktuasi7);

      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);
      const rf = Number(item.prediksi_random_forest);
      const xgb = Number(item.prediksi_xgboost);
      const lgbm = Number(item.prediksi_lightgbm);
      const ensemble = (rf + xgb + lgbm) / 3;

      let actualStatus = "Aman";
      if (actual > batasWaspada) actualStatus = "Intervensi";
      else if (actual > batasAman) actualStatus = "Waspada";

      let predStatus = "Aman";
      if (ensemble > batasWaspada) predStatus = "Intervensi";
      else if (ensemble > batasAman) predStatus = "Waspada";

      if (actualStatus === predStatus) {
        correctAlarms++;
      }
    });
    const alarmAccuracy = (correctAlarms / total) * 100;

    const models = [
      { name: "Random Forest", value: Math.round(rfMae), fill: "#f97316", key: "randomForest" },
      { name: "XGBoost", value: Math.round(xgbMae), fill: "#3b82f6", key: "xgboost" },
      { name: "LightGBM", value: Math.round(lgbmMae), fill: "#10b981", key: "lightgbm" },
    ];

    const bestModel = [...models].sort((a, b) => a.value - b.value)[0];

    const modelLabels = {
      randomForest: "Random Forest",
      xgboost: "XGBoost",
      lightgbm: "LightGBM",
    };
    const highestWinEntry = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0];
    const winModelName = modelLabels[highestWinEntry[0] as keyof typeof modelLabels] || "Tidak Ada";
    const maxWinShare = highestWinEntry[1] || 0;

    const winList = [
      { name: "LightGBM", count: winCounts.lightgbm, colorClass: "text-emerald-600" },
      { name: "XGBoost", count: winCounts.xgboost, colorClass: "text-blue-600" },
      { name: "Random Forest", count: winCounts.randomForest, colorClass: "text-orange-600" }
    ].sort((a, b) => b.count - a.count);

    const dataWithError = validData.map((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);
      const rf = Number(item.prediksi_random_forest);
      const xgb = Number(item.prediksi_xgboost);
      const lgbm = Number(item.prediksi_lightgbm);
      const ensemble = (rf + xgb + lgbm) / 3;
      const ensembleError = Math.abs(actual - ensemble);

      return {
        ...item,
        ensembleError
      };
    });

    const sortedByError = [...dataWithError].sort((a, b) => a.ensembleError - b.ensembleError);
    const top5 = sortedByError.slice(0, 5);
    const bottom5 = [...sortedByError].reverse().slice(0, 5);

    return {
      rf: rfMae,
      xgb: xgbMae,
      lgbm: lgbmMae,
      bestModel,
      winCounts,
      winModelName,
      maxWinShare,
      winList,
      top5,
      bottom5,
      accuracy: alarmAccuracy.toFixed(1),
      chartData: models,
      total
    };
  }, [evaluationData, filteredData, activeTab]);

  const loadForecastH1 = async () => {
    setForecastLoading(true);
    setForecastError("");

    try {
      const response = await fetch(`${API_BASE_URL}/forecast-h1`);
      const data = await response.json();

      if (!response.ok) {
        setForecastError(data.error || "Gagal mengambil prediksi H+1");
        return;
      }

      await loadPredictionHistory();
      setActiveTab("prediksi-h1");
    } catch {
      setForecastError("Backend Flask belum berjalan.");
    } finally {
      setForecastLoading(false);
    }
  };

  const handleEvaluateH1 = async () => {
    try {
      setEvaluationLoading(true);
      setEvaluationMessage("");

      const response = await fetch(`${API_BASE_URL}/evaluate-h1`);
      const result = await response.json();

      if (!response.ok) {
        setEvaluationMessage(result.error || "Gagal melakukan evaluasi H+1");
        return;
      }

      const data = result.data || [];

      if (data.length === 0) {
        setEvaluationMessage(
          result.message ||
          "Data aktual belum tersedia untuk tanggal prediksi H+1. Lakukan update IPJ pada tanggal yang sesuai terlebih dahulu."
        );
        return;
      }

      await loadPredictionHistory();
      setActiveTab("evaluasi");
      setEvaluationMessage("");
    } catch {
      setEvaluationMessage("Backend Flask belum berjalan atau endpoint /evaluate-h1 gagal diakses.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  // const handleExport = () => {
  //   window.open("/data/prediksi_komoditas_2026.csv", "_blank");
  // };
  const ensembleStats = useMemo(() => {
    let totalValid = 0;
    let totalActual = 0;
    let totalEnsembleError = 0;

    filteredData.forEach((item: any) => {
      const actual = Number(item.harga_sebenarnya ?? item.harga_aktual);

      if (actual && actual > 0) {
        const rf = Number(item.prediksi_random_forest || 0);
        const xgb = Number(item.prediksi_xgboost || 0);
        const lgbm = Number(item.prediksi_lightgbm || 0);

        const ensemblePred = (rf + xgb + lgbm) / 3;
        const error = Math.abs(actual - ensemblePred);

        totalEnsembleError += error;
        totalActual += actual;
        totalValid++;
      }
    });

    if (totalValid === 0) return { gap: 0, accuracy: "0", avgActual: 0 };

    const gap = totalEnsembleError / totalValid;
    const avgActual = totalActual / totalValid;
    const accuracy = Math.max(0, 100 - (gap / avgActual) * 100).toFixed(1);

    return { gap, accuracy, avgActual };
  }, [filteredData]);

  let reliabilityLabel = "Kurang Akurat";
  let reliabilityColor = "text-rose-700 bg-rose-50 border-rose-100";
  if (Number(ensembleStats.accuracy) >= 90) {
    reliabilityLabel = "Sangat Andal";
    reliabilityColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
  } else if (Number(ensembleStats.accuracy) >= 75) {
    reliabilityLabel = "Cukup Andal";
    reliabilityColor = "text-blue-700 bg-blue-50 border-blue-100";
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
          Memuat data prediksi harga pangan...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Hasil Prediksi Harga Pangan
          </h2>
          <p className="text-slate-500">
            Menampilkan hasil prediksi harga dari Random Forest, XGBoost, dan LightGBM.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-100">
          <Cpu size={18} />
          3 Model Aktif
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600">
          <CalendarIcon size={18} className="text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent outline-none cursor-pointer"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600">
          <Filter size={18} className="text-slate-400" />
          <select
            value={selectedCommodity}
            onChange={(e) => {
              setSelectedCommodity(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent outline-none cursor-pointer min-w-[240px]"
          >
            <option value="all">Semua Komoditas</option>
            {commodityOptions.map((commodity: any) => (
              <option key={commodity} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600">
          <ListFilter size={18} className="text-slate-400" />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-transparent outline-none cursor-pointer"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} data / halaman
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedMonth("all");
            setSelectedCommodity("all");
            setItemsPerPage(25);
            setCurrentPage(1);
          }}
          className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
        >
          Reset Filter
        </button>
        {/* <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all ml-auto"
        >
          <Download size={18} />
          Export Excel
        </button> */}
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-xl w-full md:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("prediksi-h1")}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "prediksi-h1"
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Prediksi Hari Ini
        </button>

        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "evaluasi"
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Evaluasi Model
        </button>

        <button
          onClick={() => setActiveTab("riwayat")}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "riwayat"
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Riwayat Harga & Prediksi
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "prediksi-h1" && (
          <motion.div
            key="prediksi-h1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Prediksi Harga Masa Depan H+1
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Data prediksi H+1 otomatis diambil dari hasil prediksi terbaru di database.
                  </p>
                </div>
                <button
                  onClick={loadForecastH1}
                  disabled={forecastLoading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70"
                >
                  <RefreshCw size={18} className={forecastLoading ? "animate-spin" : ""} />
                  {forecastLoading ? "Memproses..." : "Prediksi H+1"}
                </button>
              </div>

              {forecastError && (
                <div className="m-6 bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-semibold">
                  {forecastError}
                </div>
              )}

              {forecastData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Tanggal Prediksi</th>
                        <th className="px-6 py-4 font-semibold">Komoditas</th>
                        <th className="px-6 py-4 font-semibold">Harga Terakhir</th>
                        <th className="px-6 py-4 font-semibold">Prediksi RF</th>
                        <th className="px-6 py-4 font-semibold">Prediksi XGB</th>
                        <th className="px-6 py-4 font-semibold">Prediksi LGBM</th>
                        <th className="px-6 py-4 font-semibold">Batas Aman (+1 SD)</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {forecastData.map((item: any, index: number) => (
                        <tr key={`${item.komoditas}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatTanggal(item.tanggal_prediksi || item.tanggal)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {item.komoditas}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            Rp {formatRupiah(item.harga_terakhir ?? item.harga_kemarin)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            Rp {formatRupiah(item.prediksi_random_forest)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            Rp {formatRupiah(item.prediksi_xgboost)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            Rp {formatRupiah(item.prediksi_lightgbm)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            Rp {formatRupiah(item.batas_aman_dinamis)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={
                                item.status_stabilitas_dinamis === "Aman"
                                  ? "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700"
                                  : item.status_stabilitas_dinamis === "Waspada"
                                    ? "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700"
                                    : "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700"
                              }
                            >
                              {item.status_stabilitas_dinamis}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {forecastData.length === 0 && !forecastError && (
                <div className="p-8 text-center text-slate-400">
                  Tidak ada data prediksi terbaru di database. Silakan klik tombol <b>Prediksi H+1</b>.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "evaluasi" && (
          <motion.div
            key="evaluasi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Evaluasi Model Prediksi</h3>
                <p className="text-sm text-slate-500 mt-1">Hitung error prediksi (MAE) dengan membandingkannya terhadap harga aktual terbaru.</p>
              </div>
              <button
                onClick={handleEvaluateH1}
                disabled={evaluationLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70"
              >
                <RefreshCw size={18} className={evaluationLoading ? "animate-spin" : ""} />
                {evaluationLoading ? "Memproses..." : "Jalankan Evaluasi H+1"}
              </button>
            </div>

            {evaluationMessage && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-semibold">
                {evaluationMessage}
              </div>
            )}

            {evaluationSummary ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-sm text-emerald-700 font-medium">Model Juara (MAE Terkecil)</p>
                    <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2 mt-1">
                      <Trophy size={20} /> {evaluationSummary.bestModel.name}
                    </h3>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Akurasi Alarm Sistem</p>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-1">
                      <ShieldCheck size={20} className="text-blue-500" /> {evaluationSummary.accuracy}%
                    </h3>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">
                      Win Share ({evaluationSummary.winModelName})
                    </p>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">
                      {evaluationSummary.maxWinShare} Komoditas
                    </h3>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Total Dievaluasi</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">
                      {evaluationSummary.total} Komoditas
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Grafik MAE (Error) per Model (Rupiah)</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={evaluationSummary.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {evaluationSummary.chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 flex items-center gap-2"><TrendingUp size={16} /> Top 5 Akurat</h4>
                      <ul className="text-sm mt-2 space-y-1 text-emerald-950 font-medium">
                        {evaluationSummary.top5.map((d: any, i: number) => (
                          <li key={i}>{i + 1}. {d.komoditas} <span className="text-xs text-slate-500 font-normal">(Selisih: Rp {formatRupiah(d.ensembleError)})</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <h4 className="font-bold text-rose-800 flex items-center gap-2"><AlertTriangle size={16} /> Top 5 Sulit Ditebak</h4>
                      <ul className="text-sm mt-2 space-y-1 text-rose-950 font-medium">
                        {evaluationSummary.bottom5.map((d: any, i: number) => (
                          <li key={i}>{i + 1}. {d.komoditas} <span className="text-xs text-slate-500 font-normal">(Selisih: Rp {formatRupiah(d.ensembleError)})</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card Analitik (Win Share) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Trophy size={20} />
                        <h4 className="font-bold text-slate-800">Analitik (Win Share)</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Perbandingan akurasi tiap model secara otomatis. Model <span className={`font-bold ${evaluationSummary.winList[0].colorClass}`}>{evaluationSummary.winList[0].name}</span> saat ini mendominasi performa prediksi komoditas.
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Total Kemenangan
                      </span>
                      <span className="text-2xl font-black text-emerald-600">
                        {evaluationSummary.winList[0].count} <span className="text-sm font-bold">Data</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Kritis (Kelemahan Model) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-rose-600 mb-2">
                        <AlertTriangle size={20} />
                        <h4 className="font-bold text-slate-800">Kritis (Kelemahan Model)</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Deteksi otomatis komoditas dengan tingkat kesulitan prediksi tertinggi akibat fluktuasi dan dinamika harga pasar yang ekstrem.
                      </p>
                    </div>
                    <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider truncate">
                        {evaluationSummary.bottom5[0]?.komoditas || "Komoditas"}
                      </span>
                      <span className="text-xl font-black text-rose-600 whitespace-nowrap">
                        Rp {formatRupiah(evaluationSummary.bottom5[0]?.ensembleError || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Card Keandalan EWS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <ShieldCheck size={20} />
                        <h4 className="font-bold text-slate-800">Keandalan EWS</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Tingkat kecocokan alarm peringatan dini (Aman, Waspada, Intervensi) algoritma AI terhadap fluktuasi harga riil di pasar.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                        Akurasi Sistem
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        {evaluationSummary.accuracy}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">Tabel Evaluasi Prediksi H+1</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Perbandingan hasil prediksi H+1 sebelumnya dengan harga aktual yang tercatat di Info Pangan Jakarta.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Tanggal</th>
                          <th className="px-6 py-4 font-semibold">Komoditas</th>
                          <th className="px-6 py-4 font-semibold">Harga Aktual</th>
                          <th className="px-6 py-4 font-semibold">Prediksi RF</th>
                          <th className="px-6 py-4 font-semibold">Error RF</th>
                          <th className="px-6 py-4 font-semibold">Prediksi XGB</th>
                          <th className="px-6 py-4 font-semibold">Error XGB</th>
                          <th className="px-6 py-4 font-semibold">Prediksi LGBM</th>
                          <th className="px-6 py-4 font-semibold">Error LGBM</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-50">
                        {evaluationData.map((item, index) => {
                          const actual = Number(item.harga_aktual ?? item.harga_sebenarnya ?? 0);
                          const rf = Number(item.prediksi_random_forest || 0);
                          const xgb = Number(item.prediksi_xgboost || 0);
                          const lgbm = Number(item.prediksi_lightgbm || 0);

                          const errRf = Math.abs(actual - rf);
                          const errXgb = Math.abs(actual - xgb);
                          const errLgbm = Math.abs(actual - lgbm);
                          const minErr = Math.min(errRf, errXgb, errLgbm);

                          const isRfBest = minErr === errRf;
                          const isXgbBest = minErr === errXgb;
                          const isLgbmBest = minErr === errLgbm;

                          return (
                            <tr key={`${item.komoditas}-${index}`} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {formatTanggal(item.tanggal_prediksi || item.tanggal)}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-800">{item.komoditas}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">Rp {formatRupiah(actual)}</td>

                              <td className={`px-6 py-4 text-sm transition-colors ${isRfBest ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'}`}>
                                Rp {formatRupiah(rf)}
                              </td>
                              <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${isRfBest ? 'bg-emerald-100/70 text-emerald-800 font-extrabold' : 'text-slate-400 bg-slate-50/50'}`}>
                                Rp {formatRupiah(errRf)} {isRfBest && "🏆"}
                              </td>

                              <td className={`px-6 py-4 text-sm transition-colors ${isXgbBest ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'}`}>
                                Rp {formatRupiah(xgb)}
                              </td>
                              <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${isXgbBest ? 'bg-emerald-100/70 text-emerald-800 font-extrabold' : 'text-slate-400 bg-slate-50/50'}`}>
                                Rp {formatRupiah(errXgb)} {isXgbBest && "🏆"}
                              </td>

                              <td className={`px-6 py-4 text-sm transition-colors ${isLgbmBest ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'}`}>
                                Rp {formatRupiah(lgbm)}
                              </td>
                              <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${isLgbmBest ? 'bg-emerald-100/70 text-emerald-800 font-extrabold' : 'text-slate-400 bg-slate-50/50'}`}>
                                Rp {formatRupiah(errLgbm)} {isLgbmBest && "🏆"}
                              </td>
                              {/* <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedDetailItem(item);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                                >
                                  Detail
                                </button>
                              </td> */}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
                Tidak ada data evaluasi terbaru di database.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "riwayat" && (
          <motion.div
            key="riwayat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <p className="text-slate-500 text-sm font-medium mb-1">
                  Total Data
                </p>
                <h4 className="text-2xl font-bold text-slate-800">
                  {summary.total.toLocaleString("id-ID")}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-sm font-medium mb-1">
                  Rata-rata Error
                </p>
                <h4 className="text-xl font-bold text-slate-800 mb-3">
                  Rp {evaluationSummary ? formatRupiah((evaluationSummary.rf + evaluationSummary.xgb + evaluationSummary.lgbm) / 3) : "0"}
                </h4>
                <div className="space-y-2 pt-3 border-t border-slate-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">RF</span>
                    <span className="font-bold text-orange-600">
                      Rp {evaluationSummary ? formatRupiah(evaluationSummary.rf) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">XGBoost</span>
                    <span className="font-bold text-blue-600">
                      Rp {evaluationSummary ? formatRupiah(evaluationSummary.xgb) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">LightGBM</span>
                    <span className="font-bold text-emerald-600">
                      Rp {evaluationSummary ? formatRupiah(evaluationSummary.lgbm) : "0"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-sm font-medium mb-1">
                  Model Terbaik
                </p>
                <h4 className="text-xl font-bold text-emerald-600 mb-3">
                  {bestModelSummary.name}
                </h4>
                <div className="space-y-2 pt-3 border-t border-slate-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">RF</span>
                    <span className="font-bold text-slate-700">{bestModelSummary.details.rf} akurat</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">XGBoost</span>
                    <span className="font-bold text-slate-700">{bestModelSummary.details.xgb} akurat</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">LightGBM</span>
                    <span className="font-bold text-slate-700">{bestModelSummary.details.lgbm} akurat</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-500 text-sm font-medium">
                    Akurasi Prediksi Gabungan
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${reliabilityColor}`}>
                    {reliabilityLabel}
                  </span>
                </div>

                <h4 className="text-2xl font-bold text-slate-800 mb-3">
                  {ensembleStats.accuracy}%
                </h4>

                <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                  <strong className="text-slate-700">Kesimpulan:</strong> Gabungan prediksi dari ketiga model (RF, XGB, LGBM) memiliki selisih rata-rata hanya <span className="font-bold text-slate-700">Rp {formatRupiah(ensembleStats.gap)}</span> terhadap harga riil.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-slate-800">
                  Grafik Aktual vs Prediksi Historis
                </h3>
              </div>

              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) =>
                        `Rp ${Number(value).toLocaleString("id-ID")}`
                      }
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`,
                        name
                      ]}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b", marginBottom: "4px" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        backgroundColor: "rgba(255, 255, 255, 0.95)"
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      wrapperStyle={{ paddingBottom: "10px", fontWeight: 600, fontSize: "13px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="aktual"
                      name="Harga Aktual (Riil)"
                      stroke="#1e293b"
                      strokeWidth={4}
                      dot={{ r: 5, fill: "#1e293b", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 8, fill: "#0f172a" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="randomForest"
                      name="Prediksi Random Forest"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#f97316" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="xgboost"
                      name="Prediksi XGBoost"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      strokeDasharray="8 4"
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lightgbm"
                      name="Prediksi LightGBM"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <InteractivePredictionTable
              paginatedData={paginatedData}
              formatRupiah={formatRupiah}
              formatTanggal={formatTanggal}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              startData={startData}
              endData={endData}
              totalFiltered={filteredData.length}
              onViewDetail={(item: any) => {
                setSelectedDetailItem(item);
                setIsDetailModalOpen(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedDetailItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Detail Analisis Harga
                  </span>
                  <h3 className="font-bold text-slate-800 text-xl mt-1.5">
                    {selectedDetailItem.komoditas}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tanggal Prediksi: {formatTanggal(selectedDetailItem.tanggal_prediksi || selectedDetailItem.tanggal)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedDetailItem(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Stabilitas Pasar</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${selectedDetailItem.status_stabilitas_dinamis === "Aman"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : selectedDetailItem.status_stabilitas_dinamis === "Waspada"
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                      >
                        {selectedDetailItem.status_stabilitas_dinamis}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ambang Batas Pengawasan</p>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-600 font-medium">Rata-rata 7 Hari</span>
                      <span className="font-bold text-slate-800">
                        Rp {formatRupiah(selectedDetailItem.rata_rata_7_hari || selectedDetailItem.batas_harga_ratarata || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Batas Aman (+1 SD)</span>
                      <span className="font-bold text-emerald-600">
                        Rp {formatRupiah(selectedDetailItem.batas_aman_dinamis)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedDetailItem(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all"
                >
                  Tutup Analisis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricePrediction;