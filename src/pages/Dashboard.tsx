import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";

import { NEWS_DATA } from "../lib/data";
import { cn } from "../lib/utils";
import {
  loadLatestPriceData,
  type LatestPriceRow,
} from "../services/latestPriceService";

const formatRupiah = (value: any) => {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";

  return number.toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  });
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

const formatTanggal = (value: any) => {
  const date = convertToDate(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} />
      </div>

      <div
        className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          trend === "up"
            ? "text-emerald-600 bg-emerald-50"
            : "text-rose-600 bg-rose-50"
        )}
      >
        {trend === "up" ? (
          <ArrowUpRight size={14} />
        ) : (
          <ArrowDownRight size={14} />
        )}
        {change}
      </div>
    </div>

    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
  </motion.div>
);

const CalendarWidget = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800">Kalender</h3>
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-lg py-1.5 px-3">
          {monthNames[currentMonth]} {currentYear}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="p-2" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const date = idx + 1;
          const isToday = date === currentDate;
          return (
            <div
              key={date}
              className={cn(
                "aspect-square flex items-center justify-center text-sm rounded-xl font-medium transition-colors cursor-default",
                isToday
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {date}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [latestData, setLatestData] = useState<LatestPriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      try {
        const data = await loadLatestPriceData();
        setLatestData(data);
      } catch {
        setLatestData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const sortedData = useMemo(() => {
    return [...latestData].sort(
      (a: any, b: any) =>
        convertToDate(a.tanggal).getTime() -
        convertToDate(b.tanggal).getTime()
    );
  }, [latestData]);

  const latestDate = useMemo(() => {
    if (sortedData.length === 0) return null;
    return sortedData[sortedData.length - 1]?.tanggal;
  }, [sortedData]);

  const latestCommodityData = useMemo(() => {
    const latestTime = latestDate
      ? convertToDate(latestDate).toDateString()
      : null;

    const latestRows = sortedData.filter((item: any) => {
      return convertToDate(item.tanggal).toDateString() === latestTime;
    });

    const commodityMap = new Map();

    latestRows.forEach((item: any) => {
      if (!item.komoditas) return;
      commodityMap.set(item.komoditas, item);
    });

    return Array.from(commodityMap.values()).slice(0, 6);
  }, [sortedData, latestDate]);

  const dashboardStats = useMemo(() => {
    const total = sortedData.length;

    const avgPrice =
      total === 0
        ? 0
        : sortedData.reduce(
          (sum: number, item: any) =>
            sum + Number(item.harga_terkini || 0),
          0
        ) / total;

    const highestPrice = sortedData.reduce((max: any, item: any) => {
      return Number(item.harga_terkini || 0) > Number(max?.harga_terkini || 0)
        ? item
        : max;
    }, null);

    const lowestPrice = sortedData.reduce((min: any, item: any) => {
      if (!min) return item;

      return Number(item.harga_terkini || 0) < Number(min.harga_terkini || 0)
        ? item
        : min;
    }, null);

    return {
      total,
      avgPrice,
      highestPrice,
      lowestPrice,
      priceChangePercentage: 0.25,
      priceChangeAmount: 120,
      totalCommodity: new Set(sortedData.map((item: any) => item.komoditas)).size,
    };
  }, [sortedData]);

  const getTrendInfo = (item: any) => {
    const change = parseFloat(item.perubahan_persen ?? 0);

    if (isNaN(change)) {
      return {
        trend: "flat",
        change: 0,
        color: "text-slate-400",
        icon: "minus",
      };
    }

    return {
      trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
      change: Math.abs(change),
      color:
        change > 0
          ? "text-rose-600"
          : change < 0
            ? "text-emerald-600"
            : "text-slate-400",
      icon:
        change > 0
          ? "up"
          : change < 0
            ? "down"
            : "minus",
    };
  };

  const warningCommodity = dashboardStats.highestPrice;

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
          Memuat data dashboard dari database....
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[400px] rounded-3xl overflow-hidden group"
      >
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600"
          alt="Agriculture"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-0 left-0 p-8 lg:p-12 w-full max-w-3xl">
          <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
            Dashboard Harga Pangan
          </span>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Monitoring Harga Terkini Info Pangan Jakarta
          </h2>
          <Link
            to="/harga"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all inline-flex items-center gap-2 group"
          >
            Lihat Data Harga
            <ChevronRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pergerakan Harga Harian"
          value={`${dashboardStats.priceChangePercentage >= 0 ? '+' : ''}${dashboardStats.priceChangePercentage}%`}
          change={`Rp ${dashboardStats.priceChangeAmount >= 0 ? '+' : ''}${formatRupiah(dashboardStats.priceChangeAmount)}`}
          trend={dashboardStats.priceChangePercentage >= 0 ? 'up' : 'down'}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Jumlah Komoditas"
          value={`${dashboardStats.totalCommodity} Item`}
          change="Terkini"
          trend="up"
          icon={ShieldCheck}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Harga Tertinggi"
          value={`Rp ${formatRupiah(
            dashboardStats.highestPrice?.harga_terkini
          )}`}
          change={dashboardStats.highestPrice?.komoditas || "-"}
          trend="down"
          icon={AlertTriangle}
          color="bg-orange-100 text-orange-600"
        />

        <StatCard
          title="Harga Terendah"
          value={`Rp ${formatRupiah(
            dashboardStats.lowestPrice?.harga_terkini
          )}`}
          change={dashboardStats.lowestPrice?.komoditas || "-"}
          trend="up"
          icon={Zap}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Harga Pangan Terbaru
                </h3>
                <p className="text-sm text-slate-500">
                  Update terakhir:{" "}
                  {latestDate ? formatTanggal(latestDate) : "-"}
                </p>
              </div>

              <Link
                to="/harga"
                className="text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Komoditas</th>
                    <th className="px-6 py-4 font-semibold">Harga Terkini</th>
                    <th className="px-6 py-4 font-semibold">Perubahan</th>
                    <th className="px-6 py-4 font-semibold">Satuan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {latestCommodityData.map((item: any, index: number) => {
                    const trendInfo = getTrendInfo(item);

                    return (
                      <tr
                        key={`${item.komoditas}-${index}`}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">
                            {item.komoditas}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">
                            Rp {formatRupiah(item.harga_terkini)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div
                            className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              trendInfo.trend === "up"
                                ? "text-rose-600"
                                : trendInfo.trend === "down"
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                            )}
                          >
                            {trendInfo.trend === "up" ? (
                              <TrendingUp size={16} />
                            ) : trendInfo.trend === "down" ? (
                              <TrendingDown size={16} />
                            ) : (
                              <Minus size={16} />
                            )}

                            {trendInfo.change.toFixed(2)}%
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {item.unit || "Rupiah"}
                        </td>
                      </tr>
                    );
                  })}

                  {latestCommodityData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        Data harga terkini belum tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {NEWS_DATA.slice(0, 2).map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-700 uppercase tracking-widest shadow-sm">
                    {news.category}
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-xs text-slate-400 mb-2">{news.date}</p>

                  <h4 className="font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {news.title}
                  </h4>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {news.summary}
                  </p>

                  <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 group/btn">
                    Baca Selengkapnya
                    <ChevronRight
                      size={14}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <CalendarWidget />

          <div className="bg-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Peringatan Harga</h3>

              <p className="text-emerald-100/80 text-sm mb-6">
                {warningCommodity
                  ? `Komoditas dengan harga tertinggi saat ini adalah ${warningCommodity.komoditas
                  } dengan harga Rp ${formatRupiah(
                    warningCommodity.harga_terkini
                  )}.`
                  : "Belum ada data harga terkini yang dapat dianalisis."}
              </p>

              <Link
                to="/harga"
                className="inline-block w-full text-center bg-white text-emerald-900 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
              >
                Lihat Detail Harga
              </Link>
            </div>

            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Zap size={150} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Ringkasan Harga</h3>

            <div className="space-y-4">
              {[
                {
                  label: "Total Data",
                  percent: 100,
                  value: dashboardStats.total,
                  color: "bg-emerald-500",
                },
                {
                  label: "Komoditas",
                  percent: 80,
                  value: dashboardStats.totalCommodity,
                  color: "bg-blue-500",
                },
                {
                  label: "Data Terkini",
                  percent: 60,
                  value: latestCommodityData.length,
                  color: "bg-orange-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-800">{item.value}</span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;