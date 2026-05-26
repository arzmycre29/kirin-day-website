import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, CheckSquare, Settings, Layers, LogOut, ShieldCheck, Loader2, Activity 
} from 'lucide-react';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const savedPass = localStorage.getItem('admin_password');
      const savedTime = localStorage.getItem('admin_login_timestamp');

      // Check if session has expired (24 hours)
      if (!savedPass || !savedTime || (Date.now() - parseInt(savedTime, 10) > 24 * 60 * 60 * 1000)) {
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_login_timestamp');
        navigate('/admin/login');
        return;
      }

      try {
        const res = await fetch('/api/orders?page=1', {
          headers: {
            'Authorization': `Bearer ${savedPass}`
          }
        });
        if (!res.ok) {
          localStorage.removeItem('admin_password');
          localStorage.removeItem('admin_login_timestamp');
          navigate('/admin/login');
        } else {
          const data = await res.json();
          setTotalOrders(data.total || 0);
          setIsLoading(false);
        }
      } catch (err) {
        // network issue but trust local storage
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    localStorage.removeItem('admin_login_timestamp');
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2f47] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#90CDF4] animate-spin mx-auto mb-4" />
          <p className="font-bold text-white/60 animate-pulse">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Kelola Transaksi',
      description: 'Verifikasi bukti transfer pembayaran, setujui/tolak pesanan, unduh rekap data backup (.zip), serta arsip data.',
      icon: ShoppingBag,
      color: 'from-blue-500 to-indigo-600',
      badge: totalOrders !== null ? `${totalOrders} orders` : 'Orders',
      path: '/admin/orders',
    },
    {
      title: 'Mode Check-in Booth',
      description: 'Pencarian cepat pesanan untuk pengambilan Cheki & Merchandise secara langsung di booth event venue.',
      icon: CheckSquare,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Booth Mode',
      path: '/admin/check-in',
    },
    {
      title: 'Pengaturan PO & Event',
      description: 'Atur status buka/tutup pre-order Cheki dan Merchandise secara independen, serta sembunyikan/tampilkan event.',
      icon: Settings,
      color: 'from-amber-500 to-orange-600',
      badge: 'Jadwal & Visibilitas',
      path: '/admin/event-po-setting',
    },
    {
      title: 'Manajemen Stok & Kuota',
      description: 'Override kuota Cheki per event untuk mencegah over-selling, serta atur jumlah stok manual Merchandise.',
      icon: Layers,
      color: 'from-purple-500 to-pink-600',
      badge: 'Stok & Limit',
      path: '/admin/stock-setting',
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 bg-[#1a2f47] text-white relative">
      {/* Background patterned mesh */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(246, 224, 94, 0.1) 10px,
            rgba(246, 224, 94, 0.1) 20px
          )`
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-white/10">
          <div>
            <div className="mb-2.5">
              <span className="text-[10px] font-black tracking-[0.2em] px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded uppercase">
                ADMIN PORTAL
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#90CDF4] tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              DASBOR UTAMA ADMIN
            </h1>
            <p className="text-white/50 text-xs md:text-sm mt-1.5 leading-relaxed max-w-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Selamat datang di portal manajemen Kirin Day. Pilih sub-page di bawah untuk mengelola operasional website.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE SESSION
            </span>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-white/10 hover:border-red-400 hover:bg-red-950/20 text-white/70 hover:text-red-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.path)}
                className="group relative p-8 rounded-2xl border border-white/10 bg-[#152238]/40 hover:bg-[#152238]/70 hover:border-[#90CDF4]/40 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between"
              >
                {/* Glow Overlay */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${item.color}`} />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded bg-white/5 text-[#90CDF4] border border-white/5 group-hover:border-[#90CDF4]/20 transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-[#90CDF4] transition-colors mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-bold text-[#90CDF4] group-hover:text-white transition-colors">
                  <Activity className="w-4 h-4" /> Masuk ke Halaman &rarr;
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
