import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar as CalendarIcon,
  ListFilter,
  X,
  Brain,
  BarChart3,
  Activity,
  ShieldCheck,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import toast from "react-hot-toast";
import {
  loadPriceHistoryData,
  type PriceHistoryRow,
} from "../services/priceHistoryService";
import { loadLatestPriceData } from "../services/latestPriceService";
import { loadForecastDetail } from "../services/forecastDetailService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PriceList = () => {
  const [foodData, setFoodData] = useState<PriceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastDetail, setForecastDetail] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCommodity, setSelectedCommodity] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const [latestPrices, setLatestPrices] = useState<any[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);

  const loadPriceHistory = async () => {
    setLoading(true);
    try {
      const data = await loadPriceHistoryData();
      setFoodData(data);
    } catch (error) {
      setFoodData([]);
    } finally {
      setLoading(false);
    }
  };

  const convertToDate = (value: any) => {
    if (!value) return new Date(0);

    if (typeof value === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    }

    const numericValue = Number(value);

    if (!Number.isNaN(numericValue)) {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + numericValue * 24 * 60 * 60 * 1000);
    }

    return new Date(value);
  };

  const getDateKey = (value: any) => {
    const date = convertToDate(value);
    if (Number.isNaN(date.getTime())) return "-";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getMonthFromTanggal = (value: any) => {
    const date = convertToDate(value);
    if (Number.isNaN(date.getTime())) return "";

    return String(date.getMonth() + 1);
  };

  const latestIpjDate = useMemo(() => {
    if (latestPrices.length === 0) return null;

    return latestPrices
      .map((item: any) => getDateKey(item.tanggal))
      .filter(Boolean)
      .sort()
      .at(-1);
  }, [latestPrices]);

  const latestIpjPrices = useMemo(() => {
    if (!latestIpjDate) return [];

    return latestPrices.filter((item: any) => {
      const matchDate = getDateKey(item.tanggal) === latestIpjDate;
      const month = getMonthFromTanggal(item.tanggal);
      const matchMonth = selectedMonth === "all" || month === selectedMonth;
      const matchCommodity =
        selectedCommodity === "all" || item.komoditas === selectedCommodity;

      return matchDate && matchMonth && matchCommodity;
    });
  }, [latestPrices, latestIpjDate, selectedMonth, selectedCommodity]);

  const formatTanggal = (value: any) => {
    const date = convertToDate(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatRupiah = (value: any) => {
    const number = Number(value);
    if (Number.isNaN(number)) return "-";

    return number.toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    });
  };

  // --- FUNGSI HELPER UNTUK RENDER BADGE PERSENTASE ---
  const renderPercentageBadge = (percentage: any) => {
    const val = Number(percentage);
    if (Number.isNaN(val) || val === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
          0.00%
        </span>
      );
    }

    if (val > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
          ▲ +{val.toFixed(2)}%
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
        ▼ {val.toFixed(2)}%
      </span>
    );
  };

  const renderStatusBadge = (status: string | undefined, persentase?: any) => {
    const val = Number(persentase);

    // 1. Prioritaskan pengecekan dari angka persentase jika tersedia
    if (!Number.isNaN(val)) {
      if (val > 0) {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            Naik
          </span>
        );
      }
      if (val < 0) {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            Turun
          </span>
        );
      }
      if (val === 0) {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Tetap
          </span>
        );
      }
    }

    // 2. Cadangan jika persentase tidak ada, baru cek teks status dari API
    if (status && status.toLowerCase().includes("naik")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
          Naik
        </span>
      );
    }
    if (status && status.toLowerCase().includes("turun")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          Turun
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
        Tetap
      </span>
    );
  };

  const average = (rows: any[], key: string) => {
    const values = rows
      .map((item) => Number(item[key]))
      .filter((value) => !Number.isNaN(value));

    if (values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const getStatusClass = (status: string) => {
    if (status === "Aman") return "bg-emerald-100 text-emerald-700";
    if (status === "Waspada") return "bg-orange-100 text-orange-700";
    return "bg-rose-100 text-rose-700";
  };

  const loadLatestPrices = async () => {
    setLatestLoading(true);
    try {
      const data = await loadLatestPriceData();
      setLatestPrices(data);
    } catch {
      setLatestPrices([]);
    } finally {
      setLatestLoading(false);
    }
  };

  useEffect(() => {
    loadLatestPrices();
    loadPriceHistory();
  }, []);

  const handleUpdateIpj = async () => {
    const loadingToast = toast.loading(
      "Mengambil data terbaru dari Info Pangan Jakarta..."
    );

    try {
      const response = await fetch(`${API_BASE_URL}/update-ipj`);
      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || "Gagal update data IPJ");
        return;
      }

      await loadLatestPrices();
      await loadPriceHistory();

      toast.dismiss(loadingToast);
      toast.success(
        `Harga terkini berhasil diperbarui. ${data.jumlah_data_baru || 0} data berhasil diambil.`
      );
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Backend Flask belum berjalan");
    }
  };

  const commodityOptions = useMemo(() => {
    const unique = Array.from(
      new Set(foodData.map((item: any) => item.komoditas).filter(Boolean))
    );

    return unique.sort();
  }, [foodData]);

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

  const filteredData = useMemo(() => {
    const filtered = foodData.filter((item: any) => {
      const month = getMonthFromTanggal(item.tanggal);
      const matchMonth = selectedMonth === "all" || month === selectedMonth;
      const matchCommodity =
        selectedCommodity === "all" || item.komoditas === selectedCommodity;

      return matchMonth && matchCommodity;
    });

    const grouped: Record<
      string,
      {
        tanggal: any;
        tanggalKey: string;
        komoditas: string;
        commodity_id: number;
        totalHarga: number;
        jumlahData: number;
      }
    > = {};

    filtered.forEach((item: any) => {
      const tanggalKey = getDateKey(item.tanggal);
      const komoditas = item.komoditas;
      const harga = Number(item.harga);

      if (!tanggalKey || !komoditas || Number.isNaN(harga)) return;

      const key = `${tanggalKey}-${komoditas}`;

      if (!grouped[key]) {
        grouped[key] = {
          tanggal: item.tanggal,
          tanggalKey,
          komoditas,
          commodity_id: item.commodity_id,
          totalHarga: 0,
          jumlahData: 0,
        };
      }

      grouped[key].totalHarga += harga;
      grouped[key].jumlahData += 1;
    });

    const averaged = Object.values(grouped).map((item) => ({
      tanggal: item.tanggal,
      tanggalKey: item.tanggalKey,
      komoditas: item.komoditas,
      commodity_id: item.commodity_id,
      harga: item.totalHarga / item.jumlahData,
      jumlah_data_pasar: item.jumlahData,
    }));

    const sortedAveraged = averaged.sort((a: any, b: any) => {
      const dateA = convertToDate(a.tanggal).getTime();
      const dateB = convertToDate(b.tanggal).getTime();

      if (dateA !== dateB) return dateA - dateB;
      return String(a.komoditas).localeCompare(String(b.komoditas));
    });

    // --- HITUNG PERUBAHAN PERSENTASE SECARA KRONOLOGIS ---
    const commodityGroups: Record<string, any[]> = {};
    sortedAveraged.forEach((item: any) => {
      if (!commodityGroups[item.komoditas]) {
        commodityGroups[item.komoditas] = [];
      }
      commodityGroups[item.komoditas].push(item);
    });

    Object.values(commodityGroups).forEach((group) => {
      group.forEach((item, index) => {
        if (index === 0) {
          item.perubahan_persen = 0;
        } else {
          const prevPrice = group[index - 1].harga;
          item.perubahan_persen =
            prevPrice > 0 ? ((item.harga - prevPrice) / prevPrice) * 100 : 0;
        }
      });
    });

    return sortedAveraged;
  }, [foodData, selectedMonth, selectedCommodity]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const startData =
    filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endData = Math.min(currentPage * itemsPerPage, filteredData.length);

  const detailRows = useMemo(() => {
    if (!selectedDetail) return [];

    return foodData
      .filter((item: any) => item.komoditas === selectedDetail.komoditas)
      .sort(
        (a: any, b: any) =>
          convertToDate(a.tanggal).getTime() - convertToDate(b.tanggal).getTime()
      );
  }, [foodData, selectedDetail]);

  const getPreviousPrice = (rows: any[], selectedDate: any, daysBack: number) => {
    const targetDate = convertToDate(selectedDate);
    targetDate.setDate(targetDate.getDate() - daysBack);
    targetDate.setHours(0, 0, 0, 0);

    const found = rows.find((item: any) => {
      const itemDate = convertToDate(item.tanggal);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === targetDate.getTime();
    });

    return found ? Number(found.harga || 0) : 0;
  };

  const detailSummary = useMemo(() => {
    if (!selectedDetail || detailRows.length === 0) return null;

    const currentRow = detailRows.find(
      (item: any) => getDateKey(item.tanggal) === selectedDetail.tanggalKey
    );

    const hargaAktual = Number(currentRow?.harga || selectedDetail.harga || 0);

    const hargaKemarin = getPreviousPrice(detailRows, selectedDetail.tanggal, 1);
    const harga3Hari = getPreviousPrice(detailRows, selectedDetail.tanggal, 3);
    const harga7Hari = getPreviousPrice(detailRows, selectedDetail.tanggal, 7);
    const harga14Hari = getPreviousPrice(detailRows, selectedDetail.tanggal, 14);

    const selectedDate = convertToDate(selectedDetail.tanggal);

    const last7Rows = detailRows.filter((item: any) => {
      const date = convertToDate(item.tanggal);
      const diffDays =
        (selectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays >= 0 && diffDays < 7;
    });

    const last14Rows = detailRows.filter((item: any) => {
      const date = convertToDate(item.tanggal);
      const diffDays =
        (selectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays >= 0 && diffDays < 14;
    });

    const rata7 = average(last7Rows, "harga");
    const rata14 = average(last14Rows, "harga");

    const fluktuasi7 = (() => {
      const values = last7Rows
        .map((item: any) => Number(item.harga))
        .filter((value) => !Number.isNaN(value));

      if (values.length <= 1) return 0;

      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

      const variance =
        values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
        values.length;

      return Math.sqrt(variance);
    })();

    const stdDevFinal = fluktuasi7 === 0 ? rata7 * 0.02 : fluktuasi7;

    const batasAman = rata7 + stdDevFinal;
    const batasWaspada = rata7 + (2 * stdDevFinal);

    let statusHarga = "Aman";
    if (hargaAktual > batasWaspada) {
      statusHarga = "Intervensi";
    } else if (hargaAktual > batasAman) {
      statusHarga = "Waspada";
    }

    const predRf = Number(forecastDetail?.prediksi_random_forest || 0);
    const predXgb = Number(forecastDetail?.prediksi_xgboost || 0);
    const predLgbm = Number(forecastDetail?.prediksi_lightgbm || 0);

    const persentaseFluktuasi = rata7 > 0 ? (stdDevFinal / rata7) * 100 : 0;

    const tren =
      hargaAktual > hargaKemarin
        ? "Naik"
        : hargaAktual < hargaKemarin
          ? "Turun"
          : "Stabil";

    const perubahanKemarin =
      hargaKemarin > 0 ? ((hargaAktual - hargaKemarin) / hargaKemarin) * 100 : 0;

    const perubahanRata7 =
      rata7 > 0 ? ((hargaAktual - rata7) / rata7) * 100 : 0;

    const predictionErrors = [
      {
        model: "Random Forest",
        value: predRf,
        error: Math.abs(hargaAktual - predRf),
      },
      {
        model: "XGBoost",
        value: predXgb,
        error: Math.abs(hargaAktual - predXgb),
      },
      {
        model: "LightGBM",
        value: predLgbm,
        error: Math.abs(hargaAktual - predLgbm),
      },
    ];

    const bestPrediction = predictionErrors.sort((a, b) => a.error - b.error)[0];

    const arahKemarin =
      perubahanKemarin > 0
        ? "kenaikan"
        : perubahanKemarin < 0
          ? "penurunan"
          : "perubahan stabil";

    const arahRata7 =
      perubahanRata7 > 0
        ? "di atas"
        : perubahanRata7 < 0
          ? "di bawah"
          : "setara dengan";

    const tingkatFluktuasi =
      persentaseFluktuasi >= 5
        ? "tinggi"
        : persentaseFluktuasi >= 2
          ? "sedang"
          : "rendah";

    const rekomendasi = `Harga aktual ${selectedDetail.komoditas} pada ${formatTanggal(
      selectedDetail.tanggal
    )} tercatat Rp ${formatRupiah(hargaAktual)}.

Harga mengalami ${arahKemarin} sebesar ${Math.abs(perubahanKemarin).toFixed(
      1
    )}% dibandingkan hari sebelumnya dan berada ${arahRata7} rata-rata 7 hari terakhir sebesar ${Math.abs(
      perubahanRata7
    ).toFixed(1)}%.

Model ${bestPrediction.model} memberikan prediksi yang paling mendekati harga aktual dengan estimasi Rp ${formatRupiah(
      bestPrediction.value
    )}.

Fluktuasi harga selama 7 hari terakhir sebesar Rp ${formatRupiah(
      stdDevFinal
    )} atau sekitar ${persentaseFluktuasi.toFixed(
      2
    )}% dari rata-rata harga 7 hari terakhir.

Tingkat fluktuasi tersebut tergolong ${tingkatFluktuasi}, sehingga ${tingkatFluktuasi === "tinggi"
        ? "perlu dilakukan pemantauan intensif terhadap perubahan harga harian."
        : tingkatFluktuasi === "sedang"
          ? "masih diperlukan pemantauan harga harian."
          : "harga relatif stabil dan cukup dipantau secara rutin."
      }

Batas aman dinilai sebesar Rp ${formatRupiah(batasAman)} (Rata-rata + 1 Std Dev) dan batas waspada sebesar Rp ${formatRupiah(batasWaspada)} (Rata-rata + 2 Std Dev). Berdasarkan sebaran fluktuasi ini, status hari ini dikategorikan sebagai ${statusHarga}.`;

    return {
      hargaAktual,
      batasAman,
      status: statusHarga,
      predRf,
      predXgb,
      predLgbm,
      hargaKemarin,
      harga3Hari,
      harga7Hari,
      harga14Hari,
      rata7,
      rata14,
      fluktuasi7: stdDevFinal,
      persentaseFluktuasi,
      tren,
      rekomendasi,
    };
  }, [detailRows, selectedDetail, forecastDetail]);

  const chartData = useMemo(() => {
    if (!detailSummary) return [];

    return [
      { periode: "14 Hari Lalu", harga: Math.round(detailSummary.harga14Hari) },
      { periode: "7 Hari Lalu", harga: Math.round(detailSummary.harga7Hari) },
      { periode: "3 Hari Lalu", harga: Math.round(detailSummary.harga3Hari) },
      { periode: "Kemarin", harga: Math.round(detailSummary.hargaKemarin) },
      { periode: "Aktual", harga: Math.round(detailSummary.hargaAktual) },
      { periode: "Prediksi LGBM", harga: Math.round(detailSummary.predLgbm) },
    ];
  }, [detailSummary]);

  const handleExport = () => { };

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
          Memuat data harga pangan...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Daftar Harga Pangan Aktual
          </h2>
          <p className="text-slate-500">
            Menampilkan rata-rata harga aktual per komoditas per tanggal.
          </p>
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
            setItemsPerPage(50);
            setCurrentPage(1);
          }}
          className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
        >
          Reset Filter
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all ml-auto"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* --- TABEL 1: HARGA TERKINI INFO PANGAN JAKARTA --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              Harga Terkini Info Pangan Jakarta
            </h3>
            <p className="text-sm text-slate-500">
              Data terbaru hasil scraping dari sumber IPJ.
            </p>
          </div>

          <button
            onClick={handleUpdateIpj}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            Update IPJ
          </button>
        </div>

        {latestLoading ? (
          <div className="p-6 text-slate-500">Memuat harga terkini...</div>
        ) : latestPrices.length === 0 ? (
          <div className="p-6 text-slate-400">
            Belum ada data harga terkini. Klik Update IPJ untuk mengambil data
            terbaru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Komoditas</th>
                  <th className="px-6 py-4">Harga Terkini</th>
                  <th className="px-6 py-4">Harga Sebelumnya</th>
                  <th className="px-6 py-4">Perubahan (%)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Satuan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {latestIpjPrices.map((item, index) => (
                  <tr key={`${item.komoditas}-${index}`}>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.komoditas}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      Rp {formatRupiah(item.harga_terkini)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {item.harga_sebelumnya ? `Rp ${formatRupiah(item.harga_sebelumnya)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderPercentageBadge(item.perubahan_persen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(item.status_perubahan, item.perubahan_persen)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {item.unit || "Rupiah"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- TABEL 2: RATA-RATA HARGA AKTUAL PASAR --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">
                  <div className="flex items-center gap-2">
                    Komoditas <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Rata-rata Harga Aktual</th>
                <th className="px-6 py-4 font-semibold">Perubahan (%)</th>
                <th className="px-6 py-4 font-semibold">Jumlah Data Pasar</th>
                <th className="px-6 py-4 font-semibold">Satuan</th>
                <th className="px-6 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item: any, idx: number) => (
                <tr
                  key={`${item.tanggalKey}-${item.komoditas}`}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    #FPI-{100 + (currentPage - 1) * itemsPerPage + idx}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">
                      {item.komoditas}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {formatTanggal(item.tanggal)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">
                      Rp {formatRupiah(item.harga)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderPercentageBadge(item.perubahan_persen)}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.jumlah_data_pasar} data
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">Rupiah</td>

                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        setSelectedDetail(item);
                        const detail = await loadForecastDetail(
                          item.commodity_id,
                          item.tanggalKey
                        );
                        setForecastDetail(detail);
                      }}
                      className="text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-bold text-slate-800">{startData}</span>
            {" - "}
            <span className="font-bold text-slate-800">{endData}</span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800">
              {filteredData.length}
            </span>{" "}
            data
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-4 py-2 text-sm font-bold text-slate-700">
              Halaman {currentPage} dari {totalPages || 1}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedDetail && detailSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex justify-between items-start rounded-t-3xl">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  Detail Analisis Harga Pangan
                </h3>
                <p className="text-slate-500 mt-1">
                  {selectedDetail.komoditas} •{" "}
                  {formatTanggal(selectedDetail.tanggal)}
                </p>
              </div>

              <button
                onClick={() => setSelectedDetail(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 p-5 rounded-2xl">
                  <Activity className="text-emerald-600 mb-3" />
                  <p className="text-sm text-slate-500">Harga Aktual</p>
                  <h4 className="text-xl font-black text-slate-800">
                    Rp {formatRupiah(detailSummary.hargaAktual)}
                  </h4>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl">
                  <BarChart3 className="text-blue-600 mb-3" />
                  <p className="text-sm text-slate-500">Batas Aman (+1 SD)</p>
                  <h4 className="text-xl font-black text-slate-800">
                    Rp {formatRupiah(detailSummary.batasAman)}
                  </h4>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl">
                  <ShieldCheck className="text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">Status Stabilitas</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(
                      detailSummary.status
                    )}`}
                  >
                    {detailSummary.status}
                  </span>
                </div>

                <div className="bg-purple-50 p-5 rounded-2xl">
                  <Brain className="text-purple-600 mb-3" />
                  <p className="text-sm text-slate-500">Analisis Tren</p>
                  <h4 className="text-xl font-black text-slate-800">
                    {detailSummary.tren}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-6">
                  <h4 className="font-black text-slate-800 mb-4">
                    Riwayat Harga
                  </h4>

                  <div className="space-y-3">
                    {[
                      ["Harga 14 Hari Lalu", detailSummary.harga14Hari],
                      ["Harga 7 Hari Lalu", detailSummary.harga7Hari],
                      ["Harga 3 Hari Lalu", detailSummary.harga3Hari],
                      ["Harga Kemarin", detailSummary.hargaKemarin],
                      ["Rata-rata 7 Hari", detailSummary.rata7],
                      ["Rata-rata 14 Hari", detailSummary.rata14],
                      ["Fluktuasi 7 Hari", detailSummary.fluktuasi7],
                      [
                        "Persentase Fluktuasi",
                        `${detailSummary.persentaseFluktuasi.toFixed(2)} %`,
                      ],
                    ].map(([label, value]: any) => (
                      <div
                        key={label}
                        className="flex justify-between border-b border-slate-50 pb-2 text-sm"
                      >
                        <span className="text-slate-500">{label}</span>
                        <span className="font-bold text-slate-800">
                          {typeof value === "string"
                            ? value
                            : `Rp ${formatRupiah(value)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-6">
                  <h4 className="font-black text-slate-800 mb-4">
                    Prediksi 3 Model
                  </h4>

                  <div className="space-y-4">
                    {[
                      [
                        "Random Forest",
                        forecastDetail?.prediksi_random_forest,
                        "bg-orange-50/60 text-orange-700 border-l-4 border-orange-500",
                      ],
                      [
                        "XGBoost",
                        forecastDetail?.prediksi_xgboost,
                        "bg-blue-50/60 text-blue-700 border-l-4 border-blue-500",
                      ],
                      [
                        "LightGBM",
                        forecastDetail?.prediksi_lightgbm,
                        "bg-emerald-50/60 text-emerald-700 border-l-4 border-emerald-500",
                      ],
                    ].map(([model, value, colorClass]: any) => (
                      <div
                        key={model}
                        className={`rounded-xl p-4 ${colorClass}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{model}</span>
                          <span className="font-black text-lg">
                            {value != null
                              ? `Rp ${formatRupiah(value)}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6">
                <h4 className="font-black text-slate-800 mb-4">
                  Grafik Tren Harga
                </h4>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        dataKey="periode"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        tickFormatter={(value) =>
                          `Rp ${Number(value).toLocaleString("id-ID")}`
                        }
                      />

                      <Tooltip
                        formatter={(value: any) =>
                          `Rp ${Number(value).toLocaleString("id-ID")}`
                        }
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="harga"
                        name="Harga"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-emerald-900 text-white rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <Brain className="text-emerald-300 mt-1" size={28} />

                  <div>
                    <h4 className="font-black text-lg mb-2">
                      Analisis Harga
                    </h4>

                    <p className="text-emerald-100 leading-relaxed whitespace-pre-line">
                      {detailSummary.rekomendasi}
                    </p>

                    <p className="text-emerald-100/80 text-sm mt-3">
                      Analisis ini dibuat berdasarkan harga aktual, batas standar
                      deviasi, riwayat harga, fluktuasi 7 hari, serta hasil
                      prediksi dari Random Forest, XGBoost, dan LightGBM.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceList;