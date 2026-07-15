import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  Tag,
  LineChart,
  Sliders,
  Bell,
  User,
  Menu,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from "react-hot-toast";

import Dashboard from './pages/Dashboard';
import PricePrediction from './pages/PricePrediction';
import PriceList from './pages/Pricelist';
import NewsPaper from './pages/NewsPaper';
import UserPrediction from "./pages/UserPrediction";

const BackendStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:5000/health");
        if (res.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div
      className={cn(
        "hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300",
        isOnline
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100"
          : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
        )}
      ></span>
      {isOnline ? "Backend Active" : "Backend Offline"}
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, href, active }: { icon: any, label: string, href: string, active: boolean }) => (
  <Link to={href}>
    <motion.div
      whileHover={{ x: 5 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
      <span className="font-medium">{label}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </motion.div>
  </Link>
);

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean, toggle: () => void }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Newspaper, label: 'Berita Pangan', href: '/berita' },
    { icon: Tag, label: 'Harga Pangan', href: '/harga' },
    { icon: LineChart, label: 'Prediksi Harga', href: '/prediksi' },
    { icon: Sliders, label: "Simulasi Prediksi", href: "/prediksi-user" },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 transition-all duration-300 w-72 flex flex-col justify-between",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-30 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 p-1.5 overflow-hidden">
              <img src="/logoIpj.svg" alt="Info Pangan Jakarta" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Food Price</h1>
              <p className="text-xs text-emerald-600 font-semibold tracking-wider uppercase">Intelligence</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                active={location.pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

const RealTimeClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="hidden md:flex flex-col items-end mr-2">
      <span className="text-xs font-medium text-slate-400">{formatDate(time)}</span>
      <span className="text-sm font-bold text-emerald-600">{formatTime(time)} WIB</span>
    </div>
  );
};

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <button onClick={toggleSidebar} className="p-2 text-slate-500 lg:hidden">
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
        </div>

        <div className="flex items-center gap-3">
          <BackendStatus />
          <RealTimeClock />

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 border-2 border-white rounded-full"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 z-50"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-800 text-sm">Peringatan Sistem (EWS)</span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">Live Alarm</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 items-start p-2.5 rounded-xl bg-orange-50/60 border border-orange-100/60">
                      <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Fluktuasi Cabai Merah</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Terdeteksi melampaui batas aman (+1 SD). Status: Waspada.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Sinkronisasi IPJ Berhasil</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">45 komoditas diperbarui otomatis dari Info Pangan Jakarta.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-slate-100 mx-1"></div>

          <button className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <User size={18} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} />
        <Toaster
          position="top-right"
          reverseOrder={false}
        />

        <div className="flex-1 lg:ml-72 flex flex-col">
          <Navbar toggleSidebar={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/berita" element={<NewsPaper />} />
              <Route path="/prediksi" element={<PricePrediction />} />
              <Route path="/prediksi-user" element={<UserPrediction />} />
              <Route path="/harga" element={<PriceList />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>

          <footer className="py-6 px-8 border-t border-slate-100 text-center text-slate-400 text-sm">
            &copy; 2026 Food Price Intelligence. Sistem Prediksi & Klasifikasi Stabilitas Pangan Jakarta.
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;