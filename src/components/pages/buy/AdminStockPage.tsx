import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Layers, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import buyConfig from '../../../../config/buyConfig.js';

export function AdminStockPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Content data
  const [events, setEvents] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);

  // Settings states
  const [eventQuotas, setEventQuotas] = useState<Record<string, number | string>>({});
  const [stockOverrides, setStockOverrides] = useState<Record<string, number | string>>({});

  // Verify admin session on mount (24h revocation)
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

  // Fetch settings & Contentful data
  useEffect(() => {
    if (isLoading || !token) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // 1. Fetch settings
        const settingsRes = await fetch('/api/settings');
        let settings = { event_cheki_quotas: {}, merch_stock_overrides: {} };
        if (settingsRes.ok) {
          settings = await settingsRes.json();
        }
        setEventQuotas(settings.event_cheki_quotas || {});
        setStockOverrides(settings.merch_stock_overrides || {});

        // 2. Fetch Contentful data (Events & Products)
        try {
          const { client } = await import('../../../lib/contentful');
          
          // Events
          const eventsResponse = await client.getEntries({
            content_type: 'event',
            order: ['fields.date'],
          });
          const formattedEvents = eventsResponse.items.map((item: any) => {
            const rawDate = item.fields.date;
            let dateStr = 'TBA';
            if (rawDate) {
              const d = new Date(rawDate);
              dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
            return {
              id: item.sys.id,
              title: item.fields.title || 'Untitled Event',
              date: dateStr,
              venue: item.fields.venue || 'TBA',
              rawDate
            };
          });

          const defaultEv = {
            id: 'default',
            title: buyConfig.eventInfo.name,
            date: buyConfig.eventInfo.date,
            venue: buyConfig.eventInfo.location
          };
          setEvents([defaultEv, ...formattedEvents]);

          // Products
          const productsResponse = await client.getEntries({
            content_type: 'product',
            order: ['fields.name'],
          });
          const formattedMerch = productsResponse.items
            .filter((item: any) => item.fields.category !== 'Cheki')
            .map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name || 'Untitled Product',
              price: item.fields.price || 0,
              stock: item.fields.inStock !== false ? 50 : 0
            }));
          
          if (formattedMerch.length > 0) {
            setMerch(formattedMerch);
          } else {
            setMerch(buyConfig.merch);
          }

        } catch (contentfulErr) {
          console.error("Contentful loading error on admin stock:", contentfulErr);
          const defaultEv = {
            id: 'default',
            title: buyConfig.eventInfo.name,
            date: buyConfig.eventInfo.date,
            venue: buyConfig.eventInfo.location
          };
          setEvents([defaultEv]);
          setMerch(buyConfig.merch);
        }
      } catch (err) {
        console.error("Error loading stock overrides page:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isLoading, token]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_cheki_quotas: eventQuotas,
          merch_stock_overrides: stockOverrides
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan.');
      }

      setMessage({ text: 'Pengaturan kuota dan stok berhasil disimpan!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      setMessage({ text: err.message || 'Terjadi kesalahan saat menyimpan.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuotaChange = (eventTitle: string, value: string) => {
    setEventQuotas(prev => ({
      ...prev,
      [eventTitle]: value === '' ? '' : parseInt(value, 10) || 0
    }));
  };

  const handleStockOverrideChange = (merchId: string, value: string) => {
    setStockOverrides(prev => ({
      ...prev,
      [merchId]: value === '' ? '' : parseInt(value, 10) || 0
    }));
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

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 bg-[#1a2f47] text-white relative">
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

      <div className="relative max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> DASBOR UTAMA
          </button>

          <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE SESSION
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            MANAJEMEN STOK &amp; KUOTA
          </h1>
          <div className="w-16 h-1 bg-[#F6E05E] mx-auto mt-3 mb-4" />
          <p className="text-white/70 max-w-md mx-auto text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Atur kuota penjualan Cheki per event serta lakukan override stok fisik Merchandise Kirin Day.
          </p>
        </div>

        {loadingData ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#90CDF4] animate-spin" />
            <p className="font-bold text-white/50 animate-pulse">Memuat data dari database...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {message && (
              <div className={`p-4 rounded-xl border-2 font-bold text-sm text-center shadow-lg transition-all ${
                message.type === 'success' 
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' 
                  : 'border-red-500 bg-red-950/40 text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* EVENT CHEKI QUOTA SETTINGS */}
            <div className="p-8 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Kuota Cheki per Event
              </h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Batasi jumlah total lembar Cheki yang dapat dipesan untuk event ini. Tulis <b>0</b> atau <b>kosongkan</b> untuk menonaktifkan batas kuota (unlimited).
              </p>

              {events.length === 0 ? (
                <div className="text-center py-8 text-white/30 border border-dashed border-white/10 rounded-xl">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs font-bold">Tidak ada event yang ditemukan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((ev) => {
                    const value = eventQuotas[ev.title] !== undefined ? eventQuotas[ev.title] : '';
                    return (
                      <div 
                        key={ev.id}
                        className="p-4 rounded-xl border border-white/5 bg-white/2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {ev.title}
                          </h4>
                          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                            📅 {ev.date}
                          </p>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-3">
                          <span className="text-xs text-white/50 font-bold">Kuota Cheki:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Unlimited"
                            value={value}
                            onChange={(e) => handleQuotaChange(ev.title, e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-center font-bold outline-none focus:border-[#90CDF4] text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MERCHANDISE STOCK MANUAL OVERRIDES */}
            <div className="p-8 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Stok Manual Override Merchandise
              </h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Override jumlah stok untuk barang-barang merchandise. Data override ini akan menggantikan sisa stok bawaan yang diimpor dari Contentful. Tulis <b>kosong</b> jika ingin menggunakan stok bawaan.
              </p>

              {merch.length === 0 ? (
                <div className="text-center py-8 text-white/30 border border-dashed border-white/10 rounded-xl">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs font-bold">Tidak ada merchandise yang ditemukan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {merch.map((item) => {
                    const value = stockOverrides[item.id] !== undefined ? stockOverrides[item.id] : '';
                    return (
                      <div 
                        key={item.id}
                        className="p-4 rounded-xl border border-white/5 bg-white/2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.name}
                          </h4>
                          <p className="text-xs text-white/40 mt-0.5">
                            Stok Bawaan: {item.stock} • Harga: Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-3">
                          <span className="text-xs text-white/50 font-bold">Override Stok:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Bawaan"
                            value={value}
                            onChange={(e) => handleStockOverrideChange(item.id, e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-center font-bold outline-none focus:border-[#90CDF4] text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#90CDF4] to-[#4299E1] hover:from-[#63B3ED] hover:to-[#3182CE] text-[#1a2f47] font-black text-sm tracking-wide transition-all shadow-lg hover:shadow-cyan-500/10 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Simpan Pengaturan
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
