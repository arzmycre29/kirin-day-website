import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, FileText, CheckCircle2, XCircle, Clock, Copy, Check, 
  ExternalLink, MessageSquare, ShoppingBag, ArrowLeft, Loader2,
  Calendar, MapPin, User, Mail, Phone, Instagram, Wallet
} from 'lucide-react';
import buyConfig from '../../../../config/buyConfig.js';

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
  event_name?: string | null;
}

export function OrderStatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const queryId = searchParams.get('id') || '';
  const [orderIdInput, setOrderIdInput] = useState(queryId);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Fetch Contentful events on mount
  useEffect(() => {
    const fetchEvents = async () => {
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
        setEvents(formattedEvents);
      } catch (err) {
        console.error("Error fetching Contentful events in OrderStatusPage:", err);
      }
    };
    fetchEvents();
  }, []);

  // Find matching event from Contentful
  const matchedEvent = order ? events.find(ev => ev.title === order.event_name) : null;

  // Fetch order data when queryId changes
  useEffect(() => {
    if (!queryId) {
      setOrder(null);
      setError(null);
      return;
    }

    const fetchOrderStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/orders/status?id=${encodeURIComponent(queryId)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal memuat status pesanan.');
        }

        setOrder(data);
      } catch (err: any) {
        console.error("Fetch order error:", err);
        setError(err.message || 'Gagal terhubung ke server atau pesanan tidak ditemukan.');
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderStatus();
  }, [queryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    setSearchParams({ id: orderIdInput.trim() });
  };

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatRp = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (e) {
      return dateStr;
    }
  };

  // Predefined message for WhatsApp support
  const getWhatsAppSupportLink = () => {
    if (!order) return '';
    const adminWA = '628123456789'; // Default support phone number
    const text = encodeURIComponent(
      `Halo Admin Kirin Day,\nsaya ingin bertanya mengenai status pesanan saya dengan ID *${order.order_id}* atas nama *${order.buyer_name}*.\n\nStatus saat ini: *${order.status.toUpperCase()}*`
    );
    return `https://wa.me/${adminWA}?text=${text}`;
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 bg-[#1a2f47] text-white relative">
      {/* Background striped overlay */}
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
        {/* Navigation Link back to shop */}
        <div className="mb-6">
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Shop
          </Link>
        </div>

        {/* Header Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            STATUS PESANAN
          </h1>
          <div className="w-16 h-1 bg-[#F6E05E] mx-auto mt-3 mb-4" />
          <p className="text-white/70 max-w-md mx-auto text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Pantau proses verifikasi pembayaran pesanan Cheki &amp; Merchandise Anda secara real-time.
          </p>
        </div>

        {/* SEARCH BOX (If no order selected, or to search another) */}
        <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
                placeholder="Masukkan ID Pesanan Anda (e.g. CK-20260522-XXXX)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-white/10 bg-white/5 text-white outline-none focus:border-[#90CDF4] font-black transition-all"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !orderIdInput.trim()}
              className="px-6 py-3.5 rounded-xl bg-[#90CDF4] text-[#1a2f47] font-black tracking-wide text-sm hover:bg-[#a0d8f7] disabled:opacity-50 transition-all flex items-center justify-center gap-2 flex-shrink-0"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cek Status
            </button>
          </form>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-[#90CDF4] animate-spin" />
            <p className="font-bold text-white/60 animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Memuat detail pesanan Anda...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !isLoading && (
          <div className="p-8 rounded-2xl border-2 border-red-500/50 bg-red-950/40 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-red-200 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Pesanan Tidak Ditemukan
            </h3>
            <p className="text-white/70 max-w-md mx-auto text-sm leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {error}. Pastikan ID pesanan yang dimasukkan sudah benar sesuai yang tertera di email konfirmasi.
            </p>
            <button
              onClick={() => { setError(null); setOrderIdInput(''); }}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition-all"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* NO ID LANDING STATE */}
        {!queryId && !isLoading && !error && (
          <div className="p-12 rounded-2xl border border-white/5 bg-[#152238]/30 text-center">
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-black text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Belum ada ID Pesanan yang dicari
            </h3>
            <p className="text-white/50 max-w-sm mx-auto text-xs leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Masukkan ID Pesanan unik Anda pada kolom pencarian di atas untuk melihat detail pembayaran, status verifikasi, dan catatan pengiriman.
            </p>
          </div>
        )}

        {/* ORDER DETAILS PRESENTATION */}
        {order && !isLoading && !error && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 1. ORDER STATUS OVERVIEW BANNER */}
            <div className={`p-8 rounded-2xl border-2 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${
              order.status === 'approved' 
                ? 'border-emerald-500 bg-emerald-950/20' 
                : order.status === 'rejected'
                  ? 'border-red-500 bg-red-950/20'
                  : 'border-[#F6E05E] bg-[#F6E05E]/5'
            }`}>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xs uppercase tracking-widest font-black text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ID Pesanan:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.order_id}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                      title="Salin ID Pesanan"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/60 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dibuat pada: {formatDate(order.created_at)}</span>
                </div>
              </div>

              {/* Status Badge Accent */}
              <div className="flex-shrink-0">
                {order.status === 'approved' && (
                  <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black uppercase text-sm tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    DIVERIFIKASI
                  </div>
                )}
                {order.status === 'rejected' && (
                  <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-black uppercase text-sm tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <XCircle className="w-5 h-5 text-red-400" />
                    DITOLAK
                  </div>
                )}
                {order.status === 'pending' && (
                  <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#F6E05E]/15 border border-[#F6E05E]/30 text-[#F6E05E] font-black uppercase text-sm tracking-wider animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <Clock className="w-5 h-5 text-[#F6E05E]" />
                    MENUNGGU VERIFIKASI
                  </div>
                )}
              </div>
            </div>

            {/* 2. REJECTION DETAIL ALERTS */}
            {order.status === 'rejected' && (
              <div className="p-6 rounded-2xl border-2 border-red-500 bg-red-950/40 text-red-200">
                <h4 className="text-md font-black text-red-300 mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <AlertTriangle className="w-5 h-5 text-red-400" /> Alasan Penolakan Pesanan:
                </h4>
                <p className="text-sm font-medium leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {order.admin_notes || 'Tidak ada catatan tambahan dari admin. Kemungkinan bukti pembayaran tidak terbaca atau nominal tidak sesuai.'}
                </p>
                <div className="mt-4 pt-4 border-t border-red-500/30 text-xs text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Silakan buat pesanan baru dengan bukti pembayaran yang valid, atau hubungi admin lewat kontak support di bawah.
                </div>
              </div>
            )}

            {/* 3. VISUAL STATUS STEPPER */}
            <div className="p-8 rounded-2xl border border-white/10 bg-[#152238]/40 backdrop-blur-sm">
              <h3 className="text-lg font-black text-[#90CDF4] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                PROSES VALIDASI
              </h3>
              
              {/* Stepper container */}
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">
                
                {/* Horizontal connector line for desktop */}
                <div className="absolute left-6 right-6 top-[22px] h-[3px] bg-white/10 -z-10 hidden md:block" />
                
                {/* Step 1: Created */}
                <div className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-[#1a2f47] font-bold shadow-lg shadow-emerald-500/10">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div className="text-left md:text-center">
                    <h4 className="text-sm font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Pesanan Dibuat
                    </h4>
                    <p className="text-[11px] text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Telah tersimpan di sistem
                    </p>
                  </div>
                </div>

                {/* Step 2: Verification */}
                <div className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-4 border-[#1a2f47] font-bold shadow-lg transition-all ${
                    order.status === 'approved'
                      ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                      : order.status === 'rejected'
                        ? 'bg-red-500 text-white shadow-red-500/10'
                        : 'bg-[#F6E05E] text-[#1a2f47] animate-pulse shadow-[#F6E05E]/10'
                  }`}>
                    {order.status === 'approved' ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : order.status === 'rejected' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left md:text-center">
                    <h4 className="text-sm font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Verifikasi Pembayaran
                    </h4>
                    <p className="text-[11px] text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.status === 'approved' 
                        ? 'Bukti bayar disetujui' 
                        : order.status === 'rejected' 
                          ? 'Bukti bayar ditolak' 
                          : `Estimasi verifikasi < ${buyConfig.verificationSLAHours} jam`}
                    </p>
                  </div>
                </div>

                {/* Step 3: Redeem / Ready */}
                <div className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-4 border-[#1a2f47] font-bold shadow-lg transition-all ${
                    order.status === 'approved'
                      ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                      : order.status === 'rejected'
                        ? 'bg-white/5 text-white/20'
                        : 'bg-white/5 text-white/20'
                  }`}>
                    {order.status === 'approved' ? (
                      <ShoppingBag className="w-5 h-5" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 opacity-40" />
                    )}
                  </div>
                  <div className="text-left md:text-center">
                    <h4 className={`text-sm font-black ${order.status === 'approved' ? 'text-white' : 'text-white/40'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.redeem_method === 'event' ? 'Ambil di Event' : 'Pengiriman Paket'}
                    </h4>
                    <p className="text-[11px] text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.status === 'approved'
                        ? (order.redeem_method === 'event' ? 'Siap diambil di Event!' : 'Sedang/siap diproses kurir')
                        : 'Menunggu pembayaran diverifikasi'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. BUYER INFO & REDEEM INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Profile details */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50">
                <h4 className="text-sm font-black text-[#90CDF4] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <User className="w-4 h-4" /> Data Identitas
                </h4>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50 font-bold">Nama:</span>
                    <span className="font-bold text-white">{order.buyer_name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50 font-bold">WhatsApp:</span>
                    <span className="font-bold text-white">{order.buyer_whatsapp}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50 font-bold">Instagram:</span>
                    <span className="font-bold text-[#90CDF4]">@{order.buyer_instagram}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-white/50 font-bold">Email:</span>
                    <span className="font-bold text-white/80">{order.buyer_email}</span>
                  </div>
                </div>
              </div>

              {/* Delivery / Event Pickup Details */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50">
                <h4 className="text-sm font-black text-[#90CDF4] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {order.redeem_method === 'event' ? <MapPin className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  Metode Pengambilan
                </h4>
                {order.redeem_method === 'event' ? (
                  <div className="space-y-3 text-sm">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="font-black text-[#F6E05E] text-xs mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {matchedEvent ? matchedEvent.title.toUpperCase() : (order.event_name ? order.event_name.toUpperCase() : buyConfig.eventInfo.name.toUpperCase())}
                      </p>
                      <p className="text-xs text-white/80 font-bold">
                        {matchedEvent ? matchedEvent.date : buyConfig.eventInfo.date}
                      </p>
                      <p className="text-[11px] text-white/50 mt-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#90CDF4]" />
                        {matchedEvent ? `${matchedEvent.venue}${matchedEvent.location ? `, ${matchedEvent.location}` : ''}` : buyConfig.eventInfo.location}
                      </p>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-bold">
                      Tunjukkan ID Pesanan *{order.order_id}* serta email konfirmasi ke booth merchandise Kirin Day di lokasi event.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="font-black text-[#90CDF4] text-xs mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ALAMAT PENGIRIMAN:
                      </p>
                      <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap font-bold">
                        {order.shipping_address}
                      </p>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-bold">
                      Paket akan dikemas dan dikirimkan oleh logistik manajemen Kirin Day setelah verifikasi pembayaran berhasil.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* 5. SHOPPING ITEMS SUMMARY */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50">
              <h4 className="text-sm font-black text-[#90CDF4] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <ShoppingBag className="w-4 h-4" /> Rincian Item Belanjaan
              </h4>

              <div className="space-y-4">
                {/* Cheki list */}
                {order.cheki_items && order.cheki_items.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Cheki Cards
                    </p>
                    {order.cheki_items.map((item, idx) => (
                      <div key={`cheki-${idx}`} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 text-sm">
                        <div>
                          <p className="font-bold text-white">{item.member_name}</p>
                          <p className="text-xs text-[#90CDF4] font-black uppercase tracking-wider">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white/90">x{item.quantity}</p>
                          <p className="text-xs text-white/40">{formatRp(item.unit_price)} / pcs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Merch list */}
                {order.merch_items && order.merch_items.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-white/5">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Merchandise
                    </p>
                    {order.merch_items.map((item, idx) => (
                      <div key={`merch-${idx}`} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 text-sm">
                        <p className="font-bold text-white max-w-[70%] line-clamp-1">{item.merch_name}</p>
                        <div className="text-right">
                          <p className="font-bold text-white/90">x{item.quantity}</p>
                          <p className="text-xs text-white/40">{formatRp(item.unit_price)} / pcs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes if exists */}
                {order.notes && (
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 mt-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Catatan Pembeli:
                    </p>
                    <p className="text-xs text-white/80 italic font-bold">"{order.notes}"</p>
                  </div>
                )}

                {/* GRAND TOTAL */}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-base font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    GRAND TOTAL:
                  </span>
                  <span className="text-2xl font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {formatRp(order.grand_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. PAYMENT PROOF & METHOD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-[#90CDF4] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <Wallet className="w-4 h-4" /> Metode Pembayaran
                  </h4>
                  <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-sm font-bold flex items-center justify-between">
                    <span>Metode:</span>
                    <span className="uppercase text-[#F6E05E] font-black tracking-wider">
                      {order.payment_method}
                    </span>
                  </div>
                </div>

                {/* HELP / SUPPORT BOX */}
                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                  <p className="text-xs text-white/50 leading-relaxed font-bold">
                    Butuh bantuan atau ingin mengonfirmasi langsung transaksi Anda? Hubungi admin resmi Kirin Day.
                  </p>
                  <a
                    href={getWhatsAppSupportLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-[#25D366] text-white font-black text-xs md:text-sm tracking-wide hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <MessageSquare className="w-4 h-4" /> Hubungi Admin via WhatsApp
                  </a>
                </div>
              </div>

              {/* Payment Proof Preview */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50">
                <h4 className="text-sm font-black text-[#90CDF4] uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <FileText className="w-4 h-4" /> Bukti Pembayaran
                </h4>
                
                <div className="relative rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-video flex items-center justify-center">
                  {order.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center p-4">
                      <FileText className="w-12 h-12 text-[#90CDF4] mx-auto mb-2" />
                      <p className="text-xs font-bold text-white/80">Dokumen Bukti Transfer (PDF)</p>
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-[#F6E05E] uppercase tracking-wider hover:underline"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Buka PDF Baru <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <>
                      <img
                        src={order.payment_proof_url}
                        alt="Bukti Pembayaran"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={order.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-[#90CDF4] text-[#1a2f47] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform scale-95 hover:scale-100"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          Buka Gambar <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
