export const FOOD_COMMODITIES = [
  { id: 1, name: 'Beras Medium', price: 14500, change: 2.5, status: 'Aman', trend: 'up' },
  { id: 2, name: 'Cabai Merah Keriting', price: 45000, change: -5.2, status: 'Waspada', trend: 'down' },
  { id: 3, name: 'Bawang Merah', price: 32000, change: 1.2, status: 'Aman', trend: 'up' },
  { id: 4, name: 'Minyak Goreng', price: 18000, change: 0, status: 'Aman', trend: 'stable' },
  { id: 5, name: 'Telur Ayam Ras', price: 28500, change: 3.8, status: 'Intervensi', trend: 'up' },
  { id: 6, name: 'Daging Sapi', price: 135000, change: 0.5, status: 'Aman', trend: 'up' },
];

export const NEWS_DATA = [
  {
    id: 1,
    title: 'Pemerintah Jamin Stok Beras Aman Menjelang Ramadhan',
    category: 'Kebijakan',
    date: '24 Mei 2024',
    summary: 'Menteri Pertanian memastikan bahwa cadangan beras nasional mencukupi untuk kebutuhan masyarakat hingga tiga bulan ke depan.',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    title: 'Harga Cabai Melonjak Akibat Cuaca Ekstrem di Sentra Produksi',
    category: 'Pasar',
    date: '23 Mei 2024',
    summary: 'Curah hujan yang tinggi di wilayah Jawa Tengah menyebabkan gagal panen di beberapa lahan petani cabai.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    title: 'Inovasi Teknologi AI untuk Prediksi Ketahanan Pangan Nasional',
    category: 'Teknologi',
    date: '22 Mei 2024',
    summary: 'Sistem baru dikembangkan untuk memantau distribusi pangan secara real-time menggunakan machine learning.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
  },
];

export const PRICE_TREND_DATA = [
  { month: 'Jan', price: 12000 },
  { month: 'Feb', price: 12500 },
  { month: 'Mar', price: 13200 },
  { month: 'Apr', price: 13000 },
  { month: 'May', price: 14500 },
  { month: 'Jun', price: 14800 },
];

export const PREDICTION_DATA = [
  { date: '2024-06-01', actual: 14500, predicted: 14600 },
  { date: '2024-06-02', actual: 14550, predicted: 14650 },
  { date: '2024-06-03', actual: 14600, predicted: 14700 },
  { date: '2024-06-04', actual: null, predicted: 14850 },
  { date: '2024-06-05', actual: null, predicted: 14900 },
  { date: '2024-06-06', actual: null, predicted: 15100 },
  { date: '2024-06-07', actual: null, predicted: 15250 },
];
