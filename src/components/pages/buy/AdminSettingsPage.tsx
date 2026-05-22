import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, ToggleLeft, ToggleRight, 
  Eye, EyeOff, Calendar, MapPin, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import buyConfig from '../../../../config/buyConfig.js';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  
  // Settings states
  const [isOpen, setIsOpen] = useState(true);
  const [eventVisibility, setEventVisibility] = useState<Record<string, boolean>>({});
  const [events, setEvents] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auth session verify on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedPass = localStorage.getItem('admin_password');
      if (!savedPass) {
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
          navigate('/admin/login');
        } else {
          setPassword(savedPass);
          setIsLoading(false);
        }
      } catch (err) {
        // Graceful fallback for networks issues, trust local storage
        setPassword(savedPass);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch settings & Contentful events
  useEffect(() => {
    if (isLoading || !password) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // 1. Fetch settings
        const settingsRes = await fetch('/api/settings');
        let settings = { master_status: { is_open: true }, event_visibility: {} as Record<string, boolean> };
        if (settingsRes.ok) {
          settings = await settingsRes.json();
        }
        setIsOpen(settings.master_status?.is_open !== false);
        setEventVisibility(settings.event_visibility || {});

        // 2. Fetch events from Contentful
        try {
          const { client } = await import('../../../lib/contentful');
          const response = await client.getEntries({
            content_type: 'event',
            order: ['fields.date'],
          });
          const formattedEvents = response.items.map((item: any) => {
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
              location: item.fields.address || '',
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
        } catch (contentfulErr) {
          console.error("Contentful loading error on admin settings:", contentfulErr);
          const defaultEv = {
            id: 'default',
            title: buyConfig.eventInfo.name,
            date: buyConfig.eventInfo.date,
            venue: buyConfig.eventInfo.location
          };
          setEvents([defaultEv]);
        }
      } catch (err) {
        console.error("Error loading settings page data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isLoading, password]);

  const handleSave = async () => {
    if (!password) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({
          master_status: { is_open: isOpen },
          event_visibility: eventVisibility
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan.');
      }

      setMessage({ text: 'Pengaturan berhasil disimpan!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      setMessage({ text: err.message || 'Terjadi kesalahan saat menyimpan.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEventVisibility = (eventId: string) => {
    setEventVisibility(prev => ({
      ...prev,
      [eventId]: prev[eventId] === false ? true : false
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

      <div className="relative max-w-4xl mx-auto">
        {/* Back Link to Admin Panel */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> PANEL TRANSAKSI ADMIN
          </button>

          <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE ADMIN SESSION
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            PENGATURAN TOKO &amp; EVENT
          </h1>
          <div className="w-16 h-1 bg-[#F6E05E] mx-auto mt-3 mb-4" />
          <p className="text-white/70 max-w-md mx-auto text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Aktifkan/nonaktifkan pre-order secara global dan atur event mana saja yang ditampilkan di halaman pembelian.
          </p>
        </div>

        {loadingData ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#90CDF4] animate-spin" />
            <p className="font-bold text-white/50 animate-pulse">Memuat pengaturan dari database...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* ALERT NOTIFICATION */}
            {message && (
              <div className={`p-4 rounded-xl border-2 font-bold text-sm text-center shadow-lg transition-all ${
                message.type === 'success' 
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' 
                  : 'border-red-500 bg-red-950/40 text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* MASTER SHOP TOGGLE SECTION */}
            <div className="p-8 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-sm shadow-xl relative overflow-hidden">
              {/* Glow overlay */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all ${
                isOpen ? 'bg-emerald-500' : 'bg-red-500'
              }`} />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Status Operasional Shop (Pre-Order)
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Ketika status "Tutup", halaman pembelian (`/shop`) akan digantikan oleh layar overlay "Pre-Order Sedang Ditutup" agar pembeli tidak dapat membuat order baru.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg ${
                    isOpen 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {isOpen ? (
                    <>
                      <ToggleRight className="w-5 h-5" /> BUKA (OPEN)
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" /> TUTUP (CLOSED)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* EVENT VISIBILITY OVERRIDES LIST */}
            <div className="p-8 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Visibilitas Event di Form Checkout
              </h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Aktifkan atau sembunyikan event tertentu dari kartu pilihan event di halaman shop. Jika disembunyikan, event tidak dapat dipilih oleh pembeli.
              </p>

              {events.length === 0 ? (
                <div className="text-center py-8 text-white/30 border border-dashed border-white/10 rounded-xl">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs font-bold">Tidak ada event yang ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => {
                    const isVisible = eventVisibility[ev.id] !== false; // Visible by default
                    return (
                      <div 
                        key={ev.id}
                        onClick={() => toggleEventVisibility(ev.id)}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
                          isVisible 
                            ? 'border-[#90CDF4]/40 bg-[#90CDF4]/5 hover:border-[#90CDF4]'
                            : 'border-white/5 bg-white/2 opacity-50 hover:opacity-75 hover:border-white/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {ev.title}
                          </h4>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed truncate">
                            📅 {ev.date}
                          </p>
                          <p className="text-[10px] text-white/30 truncate">
                            📍 {ev.venue}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          {isVisible ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#90CDF4]/20 text-[#90CDF4] font-black text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              <Eye className="w-3.5 h-3.5" /> Tampil
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/40 font-black text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              <EyeOff className="w-3.5 h-3.5" /> Sembunyi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SAVE BUTTON DOCK */}
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
