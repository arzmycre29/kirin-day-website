import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CheckSquare, ArrowLeft, Loader2, RefreshCw, X, ShoppingBag, ExternalLink, ShieldCheck
} from 'lucide-react';

interface OrderItem {
  member_id?: string;
  member_name?: string;
  merch_id?: string;
  merch_name?: string;
  type?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  order_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_whatsapp: string;
  buyer_instagram: string;
  redeem_method: string;
  shipping_address: string | null;
  event_name?: string | null;
  cheki_items: OrderItem[];
  merch_items: OrderItem[];
  grand_total: number;
  notes: string | null;
  payment_method: string;
  payment_proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  is_redeemed?: boolean;
}

export function AdminCheckInPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check-in states
  const [checkinSearch, setCheckinSearch] = useState('');
  const [checkinEventFilter, setCheckinEventFilter] = useState('all');
  const [checkinOrders, setCheckinOrders] = useState<Order[]>([]);
  const [loadingCheckin, setLoadingCheckin] = useState(false);

  // Verify admin session on mount with 24h revocation
  useEffect(() => {
    const checkAuth = async () => {
      const savedPass = localStorage.getItem('admin_password');
      const savedTime = localStorage.getItem('admin_login_timestamp');

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
          setToken(savedPass);
          setIsLoading(false);
        }
      } catch (err) {
        setToken(savedPass);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Load check-in orders on mount once authenticated
  useEffect(() => {
    if (token) {
      fetchCheckinOrders('');
    }
  }, [token]);

  const fetchCheckinOrders = async (query = '') => {
    if (!token) return;
    setLoadingCheckin(true);
    try {
      const queryParams = new URLSearchParams({
        status: 'approved',
        search: query,
        page: '1',
        show_archived: 'true' // show both archived and active for checking in if needed
      });
      const res = await fetch(`/api/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data pesanan.');
      }
      setCheckinOrders(data.orders || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingCheckin(false);
    }
  };

  const handleToggleRedeem = async (orderId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/redeem`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_redeemed: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui status pengambilan.');
      }
      setCheckinOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, is_redeemed: !currentStatus } : o));
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal memperbarui status pengambilan.');
    }
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

  const filteredOrders = checkinOrders.filter(o => checkinEventFilter === 'all' || o.event_name === checkinEventFilter);

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-8 bg-[#1a2f47] text-white relative">
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

      <div className="max-w-7xl mx-auto w-full flex flex-col h-full relative">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors cursor-pointer mb-3"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <ArrowLeft className="w-4 h-4" /> DASBOR UTAMA
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-[#90CDF4] tracking-tight flex items-center gap-2.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <CheckSquare className="w-7 h-7 text-[#90CDF4]" /> MODE CHECK-IN PENGAMBILAN
            </h2>
            <p className="text-white/50 text-xs md:text-sm mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Verifikasi dan check-in pesanan approved langsung di booth event.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE BOOTH SESSION
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              fetchCheckinOrders(checkinSearch); 
            }} 
            className="flex flex-1 gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={checkinSearch}
                onChange={e => setCheckinSearch(e.target.value)}
                placeholder="Cari ID Pesanan, Nama, atau Email (Status Diterima)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-[#90CDF4] text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#90CDF4] text-[#1a2f47] font-black text-xs md:text-sm tracking-wide hover:bg-[#a0d8f7] transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Search className="w-4 h-4" /> Cari
            </button>
          </form>

          <div className="flex items-center gap-3">
            <select
              value={checkinEventFilter}
              onChange={e => setCheckinEventFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#152238] text-white outline-none focus:border-[#90CDF4] text-xs font-bold transition-all h-full"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <option value="all">SEMUA EVENT</option>
              {Array.from(new Set(checkinOrders.map(o => o.event_name).filter(Boolean))).map(evt => (
                <option key={evt} value={evt || ''}>{(evt || '').toUpperCase()}</option>
              ))}
            </select>
            <button
              onClick={() => fetchCheckinOrders(checkinSearch)}
              className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-all h-full flex items-center justify-center cursor-pointer"
              title="Refresh data check-in"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="border border-white/10 rounded-2xl bg-[#152238]/30 overflow-hidden shadow-xl flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1 font-sans">
            {loadingCheckin ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="w-10 h-10 text-[#90CDF4] animate-spin" />
                <p className="text-white/50 text-xs font-bold animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Memuat data pengambilan...
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Tidak ada data pesanan Diterima yang cocok.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#152238]/60 text-white/50 font-black text-xs tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <th className="py-4 px-5">ID / Pembeli</th>
                    <th className="py-4 px-4">Detail Pengambilan</th>
                    <th className="py-4 px-4">Item Pesanan</th>
                    <th className="py-4 px-4 text-center">Bukti Bayar</th>
                    <th className="py-4 px-5 text-center">Sudah Diambil?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((item) => {
                    return (
                      <tr 
                        key={item.order_id} 
                        className={`hover:bg-white/5 transition-colors ${item.is_redeemed ? 'bg-emerald-950/10' : ''}`}
                      >
                        <td className="py-4 px-5">
                          <p className="font-black text-white/90 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.order_id}
                          </p>
                          <p className="font-bold text-white text-xs leading-tight mt-0.5">{item.buyer_name}</p>
                          <div className="flex gap-2 mt-1 text-[11px]">
                            <a 
                              href={`https://wa.me/${item.buyer_whatsapp.replace('+', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#90CDF4] hover:underline"
                            >
                              WA: {item.buyer_whatsapp}
                            </a>
                            <span className="text-white/20">|</span>
                            <a 
                              href={`https://instagram.com/${item.buyer_instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#90CDF4] hover:underline"
                            >
                              IG: @{item.buyer_instagram}
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-white/70">
                          <span className="uppercase text-[10px] tracking-wider text-white/40 block">Metode: {item.redeem_method === 'event' ? 'Ambil di Event' : 'Kirim ke Rumah'}</span>
                          {item.redeem_method === 'event' ? (
                            <span className="text-[#F6E05E]">{item.event_name || 'Event Kirin Day'}</span>
                          ) : (
                            <span className="text-white/50 block truncate max-w-[200px]" title={item.shipping_address || ''}>
                              {item.shipping_address}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {item.cheki_items?.map((cheki, idx) => (
                              <span key={`ck-${idx}`} className="inline-block px-2 py-0.5 rounded-md bg-[#F6E05E]/10 border border-[#F6E05E]/30 text-[#F6E05E] text-[10px] font-bold">
                                Cheki {cheki.member_name} ({cheki.type}) x{cheki.quantity}
                              </span>
                            ))}
                            {item.merch_items?.map((merch, idx) => (
                              <span key={`mr-${idx}`} className="inline-block px-2 py-0.5 rounded-md bg-[#90CDF4]/10 border border-[#90CDF4]/30 text-[#90CDF4] text-[10px] font-bold">
                                {merch.merch_name} x{merch.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <a
                            href={item.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 border border-[#90CDF4]/20 text-[#90CDF4] text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Buka <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-2">
                            <input
                              type="checkbox"
                              checked={!!item.is_redeemed}
                              onChange={() => handleToggleRedeem(item.order_id, !!item.is_redeemed)}
                              className="w-6 h-6 rounded border-white/20 bg-white/5 text-[#90CDF4] focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer accent-[#90CDF4]"
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
