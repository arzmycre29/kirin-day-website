import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CheckSquare, ArrowLeft, Loader2, RefreshCw, X, ShoppingBag, ExternalLink, ShieldCheck, Scan, Camera, AlertTriangle, Check, Download
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

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

  // QR Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    order?: Order;
  }>({ status: 'idle', message: '' });

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-viewport";

  // Audio synthesizer for success/fail feedback
  const playSound = (type: 'success' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc1.stop(ctx.currentTime + 0.08);
        
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.25);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime); // C3 low buzz
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.error("Audio beep error:", e);
    }
  };

  const startScanner = async (cameraId: string) => {
    try {
      setScannerError(null);
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 176, height: 176 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        () => {
          // ignore scan errors
        }
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setScannerError('Gagal memulai kamera: ' + (err.message || err));
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
      html5QrCodeRef.current = null;
    }
  };

  const handleQrDecoded = async (orderId: string) => {
    if (scanResult.status === 'processing') return;
    
    // Stop scanning immediately on detection
    await stopScanner();

    setScanResult({
      status: 'processing',
      message: 'Membaca tiket QR...'
    });

    try {
      // 1. Search locally
      let matchedOrder = checkinOrders.find(o => o.order_id.toLowerCase() === orderId.trim().toLowerCase());
      
      if (!matchedOrder) {
        // 2. Fetch from database if not found locally
        const res = await fetch(`/api/orders/status?id=${encodeURIComponent(orderId.trim())}`);
        if (!res.ok) {
          throw new Error('Tiket tidak ditemukan di database. Pastikan QR Code valid.');
        }
        const orderData = await res.json();
        matchedOrder = orderData;
      }

      if (!matchedOrder) {
        throw new Error('Tiket tidak ditemukan.');
      }

      // Check status
      if (matchedOrder.status !== 'approved') {
        playSound('error');
        setScanResult({
          status: 'error',
          message: `Tiket tidak valid. Pesanan berstatus: ${matchedOrder.status.toUpperCase()}`,
          order: matchedOrder
        });
        return;
      }

      // Check if already redeemed
      if (matchedOrder.is_redeemed) {
        playSound('error');
        setScanResult({
          status: 'error',
          message: 'Tiket pesanan ini sudah pernah diambil / di-check-in sebelumnya!',
          order: matchedOrder
        });
        return;
      }

      // 3. Mark as redeemed on backend
      const redeemRes = await fetch(`/api/orders/${matchedOrder.order_id}/redeem`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_redeemed: true })
      });

      const redeemData = await redeemRes.json();
      if (!redeemRes.ok) {
        throw new Error(redeemData.error || 'Gagal menyimpan status check-in ke server.');
      }

      // Success! Play sound & update state
      playSound('success');
      
      setCheckinOrders(prev => {
        const exists = prev.some(o => o.order_id === matchedOrder.order_id);
        if (exists) {
          return prev.map(o => o.order_id === matchedOrder.order_id ? { ...o, is_redeemed: true } : o);
        } else {
          return [{ ...matchedOrder, is_redeemed: true }, ...prev];
        }
      });

      setScanResult({
        status: 'success',
        message: 'Check-in Berhasil! Silakan serahkan barang belanjaan pembeli.',
        order: { ...matchedOrder, is_redeemed: true }
      });

    } catch (err: any) {
      playSound('error');
      setScanResult({
        status: 'error',
        message: err.message || 'Terjadi kesalahan sistem saat check-in.'
      });
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    setSelectedCameraId(camId);
    startScanner(camId);
  };

  // Fetch cameras when scanner opens
  useEffect(() => {
    if (!isScannerOpen) {
      stopScanner();
      return;
    }

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          startScanner(defaultCamId);
        } else {
          setScannerError('Kamera tidak ditemukan. Harap pastikan perangkat memiliki kamera aktif.');
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setScannerError('Gagal mengakses kamera. Harap izinkan akses kamera di browser.');
      }
    };

    setTimeout(initScanner, 100);

    return () => {
      stopScanner();
    };
  }, [isScannerOpen]);

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
        show_archived: 'false',
        limit: '1000'
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

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    // Sort orders by event name so they are grouped by event
    const sorted = [...filteredOrders].sort((a, b) => {
      const eventA = a.event_name || '';
      const eventB = b.event_name || '';
      return eventA.localeCompare(eventB);
    });

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'ID Pesanan,Nama Pembeli,WhatsApp,Instagram,Event,Metode Pengambilan,Status Pengambilan,Item Cheki,Item Merchandise,Catatan Pembeli,Waktu Check-in\n';

    sorted.forEach(order => {
      const escape = (val: string | null | undefined) => {
        if (!val) return '';
        return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      const chekiStr = order.cheki_items?.map(c => `Cheki ${c.member_name} (${c.type}) x${c.quantity}`).join(' | ') || '';
      const merchStr = order.merch_items?.map(m => `${m.merch_name} x${m.quantity}`).join(' | ') || '';
      
      const checkinTime = order.is_redeemed ? new Date(order.updated_at).toLocaleString('id-ID') + ' WIB' : '-';

      csvContent += [
        escape(order.order_id),
        escape(order.buyer_name),
        escape(order.buyer_whatsapp),
        escape(order.buyer_instagram),
        escape(order.event_name || 'Event Kirin Day'),
        escape(order.redeem_method === 'event' ? 'Ambil di Event' : 'Kirim Paket'),
        escape(order.is_redeemed ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'),
        escape(chekiStr),
        escape(merchStr),
        escape(order.notes),
        escape(checkinTime)
      ].join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Dynamic filename based on selected event
    const eventSlug = checkinEventFilter === 'all' 
      ? 'semua_event' 
      : checkinEventFilter.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('download', `rekap_checkin_${eventSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                setScanResult({ status: 'idle', message: '' });
                setIsScannerOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F6E05E] to-amber-500 hover:from-yellow-400 hover:to-amber-600 text-[#1a2f47] font-black text-xs md:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 h-full"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Scan className="w-4 h-4" /> Pindai Tiket QR
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="px-5 py-2.5 rounded-xl border border-[#90CDF4]/30 hover:border-[#90CDF4] bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 text-[#90CDF4] font-black text-xs md:text-sm tracking-wide transition-all h-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Ekspor rekap check-in ke file CSV"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Download className="w-4 h-4" /> Ekspor Rekap CSV
            </button>

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
                          <p className="font-black text-white text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.buyer_name}
                          </p>
                          <p className="font-bold text-[#90CDF4] text-xs leading-tight mt-0.5">{item.order_id}</p>
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

      {/* QR CODE SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#152238] p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
              <h3 className="text-base font-black text-[#90CDF4] flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Scan className="w-5 h-5" /> SCAN TIKET PEMBELI
              </h3>
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Select dropdown (only show if multiple cameras found) */}
            {cameras.length > 1 && scanResult.status === 'idle' && (
              <div className="mb-4">
                <label className="text-[10px] text-white/40 font-black uppercase tracking-wider block mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Pilih Kamera
                </label>
                <select 
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#1a2f47] text-xs font-bold outline-none text-white focus:border-[#90CDF4]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {cameras.map(cam => (
                    <option key={cam.id} value={cam.id}>{cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Error Message from scanner init */}
            {scannerError && scanResult.status === 'idle' && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-200 text-xs font-bold text-center mb-4 flex items-center gap-2 justify-center">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{scannerError}</span>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center">
              {scanResult.status === 'idle' ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full aspect-square rounded-2xl bg-black overflow-hidden border-2 border-white/10 flex items-center justify-center shadow-inner">
                    {/* Viewport container */}
                    <div id={scannerContainerId} className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&>div]:!w-full [&>div]:!h-full [&>div]:!max-w-none [&_video]:!max-w-none" />
                    
                    {/* Scan reticle animation overlay */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-[#90CDF4]/30 pointer-events-none rounded-xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#90CDF4]" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#90CDF4]" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#90CDF4]" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#90CDF4]" />
                      
                      {/* Laser scanner animation line */}
                      <div className="w-full h-0.5 bg-[#90CDF4] shadow-md shadow-[#90CDF4]/50 absolute top-0 animate-scannerLaser" />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 font-bold text-center mt-4 uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <Camera className="w-3.5 h-3.5 text-[#90CDF4] animate-pulse" /> Arahkan kamera ke QR Code pembeli
                  </p>
                </div>
              ) : scanResult.status === 'processing' ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-12 h-12 text-[#90CDF4] animate-spin" />
                  <p className="text-sm font-bold text-white/60 animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {scanResult.message}
                  </p>
                </div>
              ) : scanResult.status === 'success' && scanResult.order ? (
                // SUCCESS SCREEN - ITEM LIST REVIEW
                <div className="w-full flex flex-col overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <h4 className="text-lg font-black text-emerald-400 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      CHECK-IN BERHASIL
                    </h4>
                    <p className="text-xs text-white/50 mt-1">
                      ID Pesanan: <strong className="text-[#90CDF4] tracking-wider font-mono select-all uppercase">{scanResult.order.order_id}</strong>
                    </p>
                  </div>

                  {/* Buyer details card */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/2 mb-4 text-xs font-bold text-white/70 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/40">Nama Pembeli:</span>
                      <span className="text-white">{scanResult.order.buyer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Instagram / WA:</span>
                      <span>@{scanResult.order.buyer_instagram} ({scanResult.order.buyer_whatsapp})</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-white/5">
                      <span className="text-white/40">Metode Pengambilan:</span>
                      <span className="text-[#F6E05E]">{scanResult.order.redeem_method === 'event' ? `Booth (${scanResult.order.event_name || 'Event'})` : 'Kirim Paket'}</span>
                    </div>
                  </div>

                  {/* Items to handover checklist */}
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-wider block" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Item Belanjaan Yang Harus Diserahkan:
                    </label>

                    {/* Cheki checklist */}
                    {scanResult.order.cheki_items && scanResult.order.cheki_items.length > 0 && (
                      <div className="space-y-1.5">
                        {scanResult.order.cheki_items.map((item, idx) => (
                          <label key={`chk-ck-${idx}`} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#F6E05E]/5 text-sm cursor-pointer select-none hover:bg-[#F6E05E]/10 transition-colors">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 accent-emerald-500 focus:ring-0 focus:outline-none" />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-white">Cheki {item.member_name}</span>
                              <span className="text-[10px] bg-[#F6E05E]/15 text-[#F6E05E] border border-[#F6E05E]/20 px-2 py-0.5 rounded ml-2 font-black uppercase tracking-wider">{item.type}</span>
                            </div>
                            <span className="font-black text-[#F6E05E] text-base">x{item.quantity}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Merch checklist */}
                    {scanResult.order.merch_items && scanResult.order.merch_items.length > 0 && (
                      <div className="space-y-1.5">
                        {scanResult.order.merch_items.map((item, idx) => (
                          <label key={`chk-mc-${idx}`} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#90CDF4]/5 text-sm cursor-pointer select-none hover:bg-[#90CDF4]/10 transition-colors">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 accent-emerald-500 focus:ring-0 focus:outline-none" />
                            <span className="font-bold text-white flex-1 truncate">{item.merch_name}</span>
                            <span className="font-black text-[#90CDF4] text-base">x{item.quantity}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={async () => {
                      setScanResult({ status: 'idle', message: '' });
                      // Re-trigger scanning
                      setTimeout(() => startScanner(selectedCameraId), 100);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#90CDF4] to-[#4299E1] hover:from-[#63B3ED] hover:to-[#3182CE] text-[#1a2f47] font-black text-xs md:text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Scan Tiket Selanjutnya
                  </button>
                </div>
              ) : (
                // ERROR SCREEN
                <div className="py-8 text-center flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-black text-red-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    CHECK-IN GAGAL
                  </h4>
                  <p className="text-sm font-semibold text-white/70 max-w-sm mx-auto leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {scanResult.message}
                  </p>

                  {scanResult.order && (
                    <div className="w-full p-4 rounded-xl border border-white/5 bg-white/2 mb-6 text-left text-xs font-bold text-white/60 space-y-2">
                      <div className="flex justify-between">
                        <span>ID Pesanan:</span>
                        <span className="text-[#90CDF4] tracking-wider font-mono font-black uppercase">{scanResult.order.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nama Pembeli:</span>
                        <span className="text-white">{scanResult.order.buyer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status Pengambilan:</span>
                        <span className="text-red-400">{scanResult.order.is_redeemed ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={async () => {
                        setScanResult({ status: 'idle', message: '' });
                        setTimeout(() => startScanner(selectedCameraId), 100);
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-xs md:text-sm tracking-wider uppercase transition-all cursor-pointer"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Coba Lagi
                    </button>
                    <button
                      onClick={() => setIsScannerOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs md:text-sm tracking-wider uppercase transition-all cursor-pointer"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
