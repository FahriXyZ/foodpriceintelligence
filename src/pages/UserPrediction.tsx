import { useState, useEffect, useMemo } from "react";
import {
    Calendar as CalendarIcon,
    Package,
    Loader2,
    AlertCircle,
    TrendingUp,
    Brain,
    ShieldCheck,
    BarChart3,
    History
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const UserPrediction = () => {
    const [selectedCommodity, setSelectedCommodity] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [commodities, setCommodities] = useState<string[]>([]);

    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split("T")[0];

    const formatRupiah = (value: any) => {
        const number = Number(value);
        if (Number.isNaN(number)) return "-";
        return number.toLocaleString("id-ID", {
            maximumFractionDigits: 0,
        });
    };

    const formatTanggal = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const formatTanggalPendek = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
    };

    useEffect(() => {
        const fetchCommodities = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/get-commodities`);
                if (response.ok) {
                    const data = await response.json();
                    setCommodities(data.commodities || []);
                } else {
                    setCommodities(["Beras IR. I (IR 64)", "Cabai Merah Keriting", "Bawang Merah", "Daging Ayam Ras", "Telur Ayam Ras"]);
                }
            } catch (err) {
                setCommodities(["Beras IR. I (IR 64)", "Cabai Merah Keriting", "Bawang Merah", "Daging Ayam Ras", "Telur Ayam Ras"]);
            }
        };
        fetchCommodities();
    }, []);

    const handlePredict = async () => {
        if (!selectedCommodity || !selectedDate) {
            setError("Silakan pilih komoditas dan tanggal terlebih dahulu.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/predict-custom`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    komoditas: selectedCommodity,
                    tanggal: selectedDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal melakukan simulasi multi-step. Pastikan model tersedia.");
                return;
            }

            setResult(data);
        } catch (err) {
            setError("Backend tidak terhubung. Pastikan Flask berjalan di port 5000.");
        } finally {
            setLoading(false);
        }
    };

    // Ekstraksi data target (hari terakhir dari simulasi) untuk Card UI
    const targetPrediction = useMemo(() => {
        if (!result) return null;

        // Mendukung format respons baru (array) atau *fallback* format lama
        if (result.future_predictions && result.future_predictions.length > 0) {
            return result.future_predictions[result.future_predictions.length - 1];
        }

        return {
            tanggal: result.tanggal,
            rf: result.prediksi_random_forest,
            xgb: result.prediksi_xgboost,
            lgbm: result.prediksi_lightgbm,
            batas_aman: result.batas_aman,
            batas_waspada: result.batas_waspada,
            status_stabilitas: result.status_stabilitas
        };
    }, [result]);

    const chartData = useMemo(() => {
        if (!result || !result.historical_data) return [];

        // 1. Plot Data Historis
        const history = result.historical_data.map((item: any) => ({
            tanggalRaw: item.tanggal,
            tanggal: formatTanggalPendek(item.tanggal),
            HargaAktual: item.harga,
        }));

        // 2. Plot Data Proyeksi Masa Depan (Garis Lanjutan)
        if (result.future_predictions && result.future_predictions.length > 0) {
            result.future_predictions.forEach((pred: any) => {
                const ensemblePred = (pred.rf + pred.xgb + pred.lgbm) / 3;
                history.push({
                    tanggalRaw: pred.tanggal,
                    tanggal: `Pred: ${formatTanggalPendek(pred.tanggal)}`,
                    Prediksi: Math.round(ensemblePred),
                });
            });
        } else {
            // *Fallback* jika backend masih mengirim struktur single-step lama
            const ensemblePred = (result.prediksi_random_forest + result.prediksi_xgboost + result.prediksi_lightgbm) / 3;
            history.push({
                tanggalRaw: result.tanggal,
                tanggal: `Pred: ${formatTanggalPendek(result.tanggal)}`,
                Prediksi: Math.round(ensemblePred),
            });
        }

        return history;
    }, [result]);

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    Simulasi Prediksi Kustom
                </h2>
                <p className="text-slate-500">
                    Pilih komoditas dan target tanggal di masa depan. Sistem akan melakukan simulasi iteratif hari demi hari untuk mencapai proyeksi harga tersebut.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-1 h-fit">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Brain className="text-emerald-600" size={20} />
                        Parameter Prediksi
                    </h3>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <Package size={16} className="text-slate-400" />
                                Pilih Komoditas
                            </label>
                            <select
                                value={selectedCommodity}
                                onChange={(e) => setSelectedCommodity(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="" disabled>-- Pilih Komoditas --</option>
                                {commodities.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <CalendarIcon size={16} className="text-slate-400" />
                                Target Tanggal Proyeksi
                            </label>
                            <input
                                type="date"
                                min={minDate}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                            />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                *Sistem akan menghitung ulang variabel dinamis pada setiap jeda hari hingga mencapai tanggal target.
                            </p>
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={loading || !selectedCommodity || !selectedDate}
                            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Menjalankan Iterasi...
                                </>
                            ) : (
                                <>
                                    <TrendingUp size={18} />
                                    Jalankan Simulasi
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {error && (
                        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 flex gap-3 items-start">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold">{error}</p>
                        </div>
                    )}

                    {!result && !error && !loading && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                                <BarChart3 className="text-slate-300" size={48} />
                            </div>
                            <h3 className="font-bold text-slate-700 text-lg mb-2">Belum Ada Simulasi</h3>
                            <p className="text-slate-500 max-w-sm">
                                Silakan pilih komoditas dan tanggal pada panel di sebelah kiri untuk melihat proyeksi pergerakan harga di masa depan.
                            </p>
                        </div>
                    )}

                    {result && targetPrediction && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-emerald-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                                <div className="relative z-10">
                                    <span className="bg-emerald-800 text-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                                        Titik Akhir Simulasi
                                    </span>
                                    <h3 className="text-3xl font-black mb-1">{result.komoditas || result.nama_komoditas}</h3>
                                    <p className="text-emerald-100/80 flex items-center gap-2">
                                        <CalendarIcon size={16} />
                                        {formatTanggal(targetPrediction.tanggal)}
                                    </p>
                                </div>
                                <div className="absolute -right-6 -bottom-6 opacity-10">
                                    <Brain size={160} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-sm font-bold text-slate-500 mb-1">Random Forest</p>
                                    <h4 className="text-2xl font-black text-slate-800">
                                        Rp {formatRupiah(targetPrediction.rf)}
                                    </h4>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-sm font-bold text-slate-500 mb-1">XGBoost</p>
                                    <h4 className="text-2xl font-black text-slate-800">
                                        Rp {formatRupiah(targetPrediction.xgb)}
                                    </h4>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-b-4 border-b-emerald-500">
                                    <p className="text-sm font-bold text-emerald-600 mb-1">LightGBM</p>
                                    <h4 className="text-2xl font-black text-slate-800">
                                        Rp {formatRupiah(targetPrediction.lgbm)}
                                    </h4>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <History className="text-slate-400" size={20} />
                                    Trajektori Proyeksi Harga
                                </h4>

                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="tanggal"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                                tickFormatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="HargaAktual"
                                                name="Harga Historis"
                                                stroke="#94a3b8"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: "#cbd5e1" }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="Prediksi"
                                                name="Prediksi Multi-Step"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                strokeDasharray="5 5"
                                                dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <ShieldCheck className="text-slate-400" size={20} />
                                    Analisis Stabilitas Pasar pada Tanggal Target
                                </h4>

                                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Ambang Batas Aman Dinamis</p>
                                        <p className="font-bold text-slate-700">Rp {formatRupiah(targetPrediction.batas_aman)}</p>
                                    </div>
                                    <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                                    <div>
                                        <p className="text-sm text-slate-500">Ambang Batas Waspada Dinamis</p>
                                        <p className="font-bold text-slate-700">Rp {formatRupiah(targetPrediction.batas_waspada)}</p>
                                    </div>
                                    <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                                    <div className="text-right md:text-left">
                                        <p className="text-sm text-slate-500 mb-1">Proyeksi Status</p>
                                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${targetPrediction.status_stabilitas === 'Aman' ? 'bg-emerald-100 text-emerald-700' :
                                            targetPrediction.status_stabilitas === 'Waspada' ? 'bg-orange-100 text-orange-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                            {targetPrediction.status_stabilitas}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPrediction;