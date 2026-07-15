import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, AlertTriangle, TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const InteractivePredictionTable = ({
    paginatedData,
    formatRupiah,
    formatTanggal,
    currentPage,
    setCurrentPage,
    totalPages,
    startData,
    endData,
    totalFiltered
}: any) => {
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const selectedActual = selectedItem ? (selectedItem.harga_sebenarnya ?? selectedItem.harga_aktual) : 0;
    const selectedRfErr = selectedItem ? Math.abs(selectedActual - (selectedItem.prediksi_random_forest || 0)) : 0;
    const selectedXgbErr = selectedItem ? Math.abs(selectedActual - (selectedItem.prediksi_xgboost || 0)) : 0;
    const selectedLgbmErr = selectedItem ? Math.abs(selectedActual - (selectedItem.prediksi_lightgbm || 0)) : 0;
    const selectedMinErr = selectedItem ? Math.min(selectedRfErr, selectedXgbErr, selectedLgbmErr) : 0;

    const isSelectedRfBest = selectedItem && selectedMinErr === selectedRfErr;
    const isSelectedXgbBest = selectedItem && selectedMinErr === selectedXgbErr;
    const isSelectedLgbmBest = selectedItem && selectedMinErr === selectedLgbmErr;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                        Tabel Riwayat Prediksi Lengkap
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Klik pada baris komoditas mana saja untuk membuka panel rincian fitur AI dan statistik masa lalu.
                    </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold w-fit">
                    Mode Panel Interaktif
                </span>
            </div>

            <div className="overflow-x-auto scroll-smooth">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                            <th className="px-6 py-4 font-semibold">Tanggal</th>
                            <th className="px-6 py-4 font-semibold">Komoditas</th>
                            <th className="px-6 py-4 font-semibold">Harga Aktual</th>
                            <th className="px-6 py-4 font-semibold">Prediksi RF</th>
                            <th className="px-6 py-4 font-semibold">Prediksi XGB</th>
                            <th className="px-6 py-4 font-semibold">Prediksi LGBM</th>
                            <th className="px-6 py-4 font-semibold">Status EWS</th>
                            <th className="px-6 py-4 font-semibold text-right">Detail Fitur</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedData.map((item: any, idx: number) => {
                            const actual = item.harga_sebenarnya ?? item.harga_aktual;
                            const rfErr = Math.abs(actual - (item.prediksi_random_forest || 0));
                            const xgbErr = Math.abs(actual - (item.prediksi_xgboost || 0));
                            const lgbmErr = Math.abs(actual - (item.prediksi_lightgbm || 0));
                            const minErr = Math.min(rfErr, xgbErr, lgbmErr);

                            const isRfBest = minErr === rfErr;
                            const isXgbBest = minErr === xgbErr;
                            const isLgbmBest = minErr === lgbmErr;

                            return (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedItem(item)}
                                    className="hover:bg-emerald-50/50 transition-all cursor-pointer group"
                                >
                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        {formatTanggal(item.tanggal)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                                        {item.komoditas}
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900 whitespace-nowrap">
                                        Rp {formatRupiah(actual)}
                                    </td>
                                    <td className={`px-6 py-4 text-sm whitespace-nowrap ${isRfBest ? "font-bold text-emerald-600" : "text-slate-700"}`}>
                                        Rp {formatRupiah(item.prediksi_random_forest)}
                                    </td>
                                    <td className={`px-6 py-4 text-sm whitespace-nowrap ${isXgbBest ? "font-bold text-emerald-600" : "text-slate-700"}`}>
                                        Rp {formatRupiah(item.prediksi_xgboost)}
                                    </td>
                                    <td className={`px-6 py-4 text-sm whitespace-nowrap ${isLgbmBest ? "font-bold text-emerald-600" : "text-slate-700"}`}>
                                        Rp {formatRupiah(item.prediksi_lightgbm)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={
                                                item.status_stabilitas_dinamis === "Aman"
                                                    ? "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700"
                                                    : item.status_stabilitas_dinamis === "Waspada"
                                                        ? "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700"
                                                        : "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700"
                                            }
                                        >
                                            {item.status_stabilitas_dinamis || "Aman"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-600 text-slate-600 group-hover:text-white text-xs font-bold transition-all inline-block">
                                            Buka Detail &rarr;
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}

                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                    Tidak ada data yang sesuai dengan filter Anda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    Menampilkan <span className="font-bold text-slate-800">{startData}</span> - <span className="font-bold text-slate-800">{endData}</span> dari <span className="font-bold text-slate-800">{totalFiltered}</span> data
                </p>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <span className="px-4 py-2 text-sm font-bold text-slate-700">
                        Halaman {currentPage} dari {totalPages || 1}
                    </span>

                    <button
                        onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        />

                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-screen w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-100 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedItem.komoditas}</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Calendar size={14} /> {formatTanggal(selectedItem.tanggal)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Aktual</p>
                                        <p className="text-2xl font-black text-slate-800 mt-1">
                                            Rp {formatRupiah(selectedActual)}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Status EWS</p>
                                        <p className="text-xl font-black text-emerald-700 mt-1">
                                            {selectedItem.status_stabilitas_dinamis || "Aman"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Trophy size={18} className="text-amber-500" /> Perbandingan Hasil Prediksi AI
                                    </h4>
                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`font-semibold ${isSelectedRfBest ? "text-emerald-600 font-bold" : "text-slate-600"}`}>Random Forest</span>
                                            <span className={`font-bold ${isSelectedRfBest ? "text-emerald-600 font-black" : "text-slate-800"}`}>Rp {formatRupiah(selectedItem.prediksi_random_forest)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`font-semibold ${isSelectedXgbBest ? "text-emerald-600 font-bold" : "text-slate-600"}`}>XGBoost</span>
                                            <span className={`font-bold ${isSelectedXgbBest ? "text-emerald-600 font-black" : "text-slate-800"}`}>Rp {formatRupiah(selectedItem.prediksi_xgboost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`font-semibold ${isSelectedLgbmBest ? "text-emerald-600 font-bold" : "text-slate-600"}`}>LightGBM</span>
                                            <span className={`font-bold ${isSelectedLgbmBest ? "text-emerald-600 font-black" : "text-slate-800"}`}>Rp {formatRupiah(selectedItem.prediksi_lightgbm)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-blue-500" /> Variabel Rekayasa Fitur (Lag & Rolling)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <p className="text-xs text-slate-400 font-medium">Harga Kemarin (Lag 1)</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">Rp {formatRupiah(selectedItem.harga_kemarin)}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <p className="text-xs text-slate-400 font-medium">Harga 3 Hari Lalu (Lag 3)</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">Rp {formatRupiah(selectedItem.harga_3_hari_lalu)}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <p className="text-xs text-slate-400 font-medium">Harga 7 Hari Lalu (Lag 7)</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">Rp {formatRupiah(selectedItem.harga_7_hari_lalu)}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <p className="text-xs text-slate-400 font-medium">Harga 14 Hari Lalu (Lag 14)</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">Rp {formatRupiah(selectedItem.harga_14_hari_lalu)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-orange-500" /> Parameter Statistik & Ambang Batas
                                    </h4>
                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-sm border border-slate-100">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Rata-rata 7 Hari</span>
                                            <span className="font-bold text-slate-700">Rp {formatRupiah(selectedItem.rata_rata_7_hari)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Rata-rata 14 Hari</span>
                                            <span className="font-bold text-slate-700">Rp {formatRupiah(selectedItem.rata_rata_14_hari)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Batas Aman Dinamis (+1 SD)</span>
                                            <span className="font-bold text-slate-700">Rp {formatRupiah(selectedItem.batas_aman_dinamis)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-slate-200">
                                            <span className="text-slate-500 font-medium">Fluktuasi 7 Hari</span>
                                            <span className="font-bold text-orange-600">+{Number(selectedItem.fluktuasi_7_hari || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractivePredictionTable;