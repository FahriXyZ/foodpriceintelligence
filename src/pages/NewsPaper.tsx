import { motion } from "framer-motion";
import {
  Newspaper,
  CalendarDays,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const newsData = [
  {
    id: 1,
    category: "Harga Pangan",
    title:
      "Harga Cabai Rawit Mengalami Kenaikan Signifikan di Beberapa Wilayah",
    summary:
      "Kenaikan harga dipicu oleh penurunan pasokan akibat cuaca ekstrem yang memengaruhi distribusi pangan.",
    date: "20 Mei 2026",
    image:
      "https://plus.unsplash.com/premium_photo-1675864033264-cb9db758422d?q=80&w=1200&auto=format&fit=crop",
    status: "Waspada",
  },
  {
    id: 2,
    category: "Stabilitas Pangan",
    title:
      "Pemerintah Tingkatkan Cadangan Beras Nasional untuk Menjaga Stabilitas",
    summary:
      "Langkah strategis dilakukan untuk memastikan harga tetap terkendali menjelang musim kemarau.",
    date: "19 Mei 2026",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    status: "Aman",
  },
  {
    id: 3,
    category: "Prediksi AI",
    title:
      "Model AI Mendeteksi Potensi Lonjakan Harga Bawang Merah Bulan Depan",
    summary:
      "Analisis berbasis machine learning menunjukkan pola kenaikan harga akibat distribusi yang melambat.",
    date: "18 Mei 2026",
    image:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    status: "Prediksi",
  },
  {
    id: 4,
    category: "Distribusi",
    title:
      "Optimalisasi Jalur Distribusi Pangan untuk Menekan Fluktuasi Harga",
    summary:
      "Digitalisasi rantai pasok menjadi fokus utama dalam menjaga kestabilan harga pangan nasional.",
    date: "17 Mei 2026",
    image:
      "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80",
    status: "Aman",
  },
  {
  id: 5,
  category: "Cuaca",
  title:
    "BMKG Prediksi Curah Hujan Tinggi Dapat Pengaruhi Distribusi Sayuran",
  summary:
    "Distribusi komoditas hortikultura diperkirakan mengalami keterlambatan akibat intensitas hujan tinggi di beberapa daerah produksi.",
  date: "16 Mei 2026",
  image:
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  status: "Waspada",
},
{
  id: 6,
  category: "Produksi",
  title:
    "Produksi Jagung Nasional Mengalami Peningkatan pada Kuartal Kedua",
  summary:
    "Kementerian Pertanian melaporkan peningkatan hasil panen jagung nasional berkat optimalisasi lahan dan distribusi pupuk.",
  date: "15 Mei 2026",
  image:
    "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
  status: "Aman",
},
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Aman":
      return {
        icon: ShieldCheck,
        className: "bg-emerald-100 text-emerald-700",
      };

    case "Waspada":
      return {
        icon: AlertTriangle,
        className: "bg-orange-100 text-orange-700",
      };

    default:
      return {
        icon: TrendingUp,
        className: "bg-blue-100 text-blue-700",
      };
  }
};

const NewsPaper = () => {
  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[360px] rounded-3xl overflow-hidden group"
      >
        <img
          src="https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1600&q=80"
          alt="Berita Pangan"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-0 left-0 p-8 lg:p-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest mb-5">
            <Newspaper size={14} />
            Berita Pangan Nasional
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Informasi Harga dan Stabilitas Pangan Terkini
          </h1>

          <p className="text-slate-200 text-lg leading-relaxed">
            Pantau perkembangan harga pangan, prediksi AI, dan kebijakan terbaru
            dalam satu dashboard berita modern.
          </p>
        </div>
      </motion.section>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Berita Terbaru
          </h2>

          <p className="text-slate-500 mt-1">
            Update informasi pangan dan stabilitas harga nasional.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold">
          <TrendingUp size={16} />
          Live Update
        </div>
      </div>

      {/* Main News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 relative h-full min-h-[620px] rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group self-start"
        >
          <img
            src={newsData[0].image}
            alt={newsData[0].title}
            className="absolute inset-0 w-full h-full object-cover object-cente group-hover:scale-105 transition-transform duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 p-8 lg:p-10 z-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                {newsData[0].category}
              </span>

              <div className="flex items-center gap-1 text-white/80 text-sm">
                <CalendarDays size={14} />
                {newsData[0].date}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white leading-tight mb-4 max-w-2xl">
              {newsData[0].title}
            </h2>

            <p className="text-slate-200 max-w-2xl mb-6">
              {newsData[0].summary}
            </p>

            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all">
              Baca Selengkapnya
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {newsData.slice(1, 3).map((news, index) => {
            const status = getStatusStyle(news.status);
            const Icon = status.icon;

            return (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 left-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${status.className}`}
                    >
                      <Icon size={12} />
                      {news.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <CalendarDays size={13} />
                    {news.date}
                  </div>

                  <h3 className="font-bold text-slate-800 leading-snug mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {news.title}
                  </h3>

                  <p className="text-sm text-slate-500 line-clamp-3 mb-5">
                    {news.summary}
                  </p>

                  <button className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                    Baca Berita
                    <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Grid News */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            Artikel Lainnya
          </h3>

          <span className="text-sm text-slate-400">
            {newsData.length} artikel tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {newsData.map((news, index) => {
            const status = getStatusStyle(news.status);
            const Icon = status.icon;

            return (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      {news.category}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${status.className}`}
                    >
                      <Icon size={11} />
                      {news.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <CalendarDays size={13} />
                    {news.date}
                  </div>

                  <h3 className="font-bold text-slate-800 leading-snug mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {news.title}
                  </h3>

                  <p className="text-sm text-slate-500 line-clamp-3 mb-5">
                    {news.summary}
                  </p>

                  <button className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 group/btn">
                    Baca Selengkapnya
                    <ChevronRight
                      size={15}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NewsPaper;
