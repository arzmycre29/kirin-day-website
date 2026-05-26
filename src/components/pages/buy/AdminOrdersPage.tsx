import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Eye, CheckCircle2, XCircle, LogOut, Loader2, Calendar, 
  User, Mail, Phone, Instagram, FileText, ChevronLeft, ChevronRight, 
  MapPin, ShoppingBag, Wallet, AlertTriangle, ExternalLink, RefreshCw,
  Download, Trash2, X, CheckSquare, Settings
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

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  
  // Orders and Pagination
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // State variables for loaders and messages
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isPurgeLoading, setIsPurgeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Check-in dashboard states
  const [isCheckinMode, setIsCheckinMode] = useState(false);
  const [checkinSearch, setCheckinSearch] = useState('');
  const [checkinEventFilter, setCheckinEventFilter] = useState('all');
  const [checkinOrders, setCheckinOrders] = useState<Order[]>([]);
  const [loadingCheckin, setLoadingCheckin] = useState(false);

  // 1. Verify admin session on mount with 24h revocation
  useEffect(() => {
    const savedPass = localStorage.getItem('admin_password');
    const savedTime = localStorage.getItem('admin_login_timestamp');

    if (!savedPass || !savedTime || (Date.now() - parseInt(savedTime, 10) > 24 * 60 * 60 * 1000)) {
      localStorage.removeItem('admin_password');
      localStorage.removeItem('admin_login_timestamp');
      navigate('/admin/login');
      return;
    }
    setToken(savedPass);
  }, [navigate]);

  // 2. Fetch orders when token, page, statusFilter, searchQuery, or showArchived changes
  useEffect(() => {
    if (!token) return;
    
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          status: statusFilter,
          search: searchQuery,
          show_archived: String(showArchived)
        });

        const res = await fetch(`/api/orders?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem('admin_password');
          navigate('/admin/login');
          return;
        }

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mengambil data pesanan.');
        }

        setOrders(data.orders || []);
        setTotalOrders(data.total || 0);
        setTotalPages(data.totalPages || 1);

      } catch (err: any) {
        console.error("Fetch orders error:", err);
        setError(err.message || 'Gagal terhubung ke server backend.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [token, page, statusFilter, searchQuery, showArchived, navigate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleDownloadBackup = async (includeArchived = false) => {
    if (!token) return;
    setIsBackupLoading(true);
    setActionMessage(null);
    try {
      const queryParams = includeArchived ? '?include_archived=true' : '';
      const res = await fetch(`/api/orders/backup-zip${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_login_timestamp');
        navigate('/admin/login');
        return;
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mendownload backup.');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = includeArchived ? `KirinDay_BulkBackup_Shop_${dateStr}.zip` : `KirinDay_Backup_Shop_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setActionMessage({ type: 'success', text: includeArchived ? 'Bulk backup data pesanan (.zip) berhasil diunduh.' : 'Backup data pesanan (.zip) berhasil diunduh.' });
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengunduh backup (.zip).' });
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handlePurgeProofs = async () => {
    if (!token) return;
    
    const confirm1 = window.confirm(
      "PERINGATAN: Opsi ini akan menghapus semua file bukti pembayaran (JPG/PNG/PDF) untuk pesanan yang berstatus 'Diterima' (Approved) atau 'Ditolak' (Rejected) dari penyimpanan Supabase Storage.\\n\\n" +
      "Pastikan Anda telah mendownload backup ZIP terlebih dahulu!\\n\\n" +
      "Apakah Anda ingin melanjutkan?"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "KONFIRMASI TERAKHIR: Tindakan ini tidak dapat dibatalkan. Berkas fisik bukti pembayaran akan terhapus selamanya, sedangkan riwayat database tetap aman.\\n\\n" +
      "Lanjutkan pembersihan?"
    );
    if (!confirm2) return;

    setIsPurgeLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/orders/purge-proofs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membersihkan bukti pembayaran.');
      }

      setActionMessage({ 
        type: 'success', 
        text: `${data.purgedCount} berkas bukti pembayaran lama berhasil dibersihkan dari penyimpanan.` 
      });

      refreshOrders();
      if (selectedOrder) {
        if (['approved', 'rejected'].includes(selectedOrder.status)) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            payment_proof_url: `https://via.placeholder.com/150/1a2f47/90CDF4?text=Bukti+Telah+Diarsip`
          } : null);
        }
      }

    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Gagal membersihkan bukti pembayaran.' });
    } finally {
      setIsPurgeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    localStorage.removeItem('admin_login_timestamp');
    navigate('/admin/login');
  };

  // 3. Status Action Handler (Approve)
  const handleApproveOrder = async (orderId: string) => {
    if (!token) return;
    if (!window.confirm(`Apakah Anda yakin ingin menyetujui pesanan ${orderId}?`)) return;

    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved'
        })
      });

      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui pesanan.');

      setActionMessage({ type: 'success', text: `Pesanan ${orderId} telah berhasil diverifikasi dan disetujui!` });
      
      // Update selected order view
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'approved' } : null);
      }

      // Refresh orders list
      refreshOrders();

    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengubah status pesanan.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Status Action Handler (Reject)
  const handleRejectOrderSubmit = async () => {
    if (!token || !selectedOrder) return;
    if (!rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.order_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'rejected',
          admin_notes: rejectReason.trim()
        })
      });

      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menolak pesanan.');

      setActionMessage({ type: 'success', text: `Pesanan ${selectedOrder.order_id} berhasil ditolak dengan alasan: "${rejectReason.trim()}".` });
      
      // Update selected order view
      setSelectedOrder(prev => prev ? { ...prev, status: 'rejected', admin_notes: rejectReason.trim() } : null);
      
      // Reset rejection modal
      setIsRejectModalOpen(false);
      setRejectReason('');

      // Refresh list
      refreshOrders();

    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Gagal menolak pesanan.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        status: statusFilter,
        search: searchQuery,
        show_archived: String(showArchived)
      });
      const res = await fetch(`/api/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data pesanan.');
      }
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCheckinMode && token) {
      fetchCheckinOrders('');
    }
  }, [isCheckinMode, token]);

  const fetchCheckinOrders = async (query = '') => {
    if (!token) return;
    setLoadingCheckin(true);
    try {
      const queryParams = new URLSearchParams({
        status: 'approved',
        search: query,
        page: '1'
      });
      const res = await fetch(`/api/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_password');
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data pesanan check-in.');
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
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, is_redeemed: !currentStatus } : o));
      setCheckinOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, is_redeemed: !currentStatus } : o));
      setSelectedOrder(prev => prev && prev.order_id === orderId ? { ...prev, is_redeemed: !currentStatus } : prev);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal memperbarui status pengambilan.');
    }
  };

  const formatRp = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-8 bg-[#1a2f47] text-white">
      {/* Back to Dashboard Link */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors cursor-pointer"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <ChevronLeft className="w-4 h-4" /> DASBOR UTAMA ADMIN
        </button>
      </div>

      {/* Top Banner Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="mb-2.5">
            <span className="text-[10px] font-black tracking-[0.2em] px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded uppercase">
              Admin Mode
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#90CDF4] tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            PANEL VERIFIKASI PESANAN
          </h1>
          <p className="text-white/50 text-xs md:text-sm mt-1.5 leading-relaxed max-w-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Konfirmasi bukti transfer bank &amp; kelola status pengambilan pesanan pembeli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/check-in')}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500 text-emerald-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Masuk ke mode check-in pencarian cepat untuk pengambilan cheki/merchandise di booth event"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Mode Check-in
          </button>

          <button
            onClick={() => navigate('/admin/event-po-setting')}
            className="px-3.5 py-2 rounded-xl border border-[#90CDF4]/20 bg-[#90CDF4]/5 hover:bg-[#90CDF4]/15 hover:border-[#90CDF4] text-[#90CDF4] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Kelola visibilitas event dan toggle buka/tutup toko pre-order"
          >
            <Settings className="w-3.5 h-3.5" />
            Pengaturan PO
          </button>

          <button
            onClick={() => handleDownloadBackup(false)}
            disabled={isBackupLoading}
            className="px-3.5 py-2 rounded-xl border border-[#90CDF4]/20 bg-[#90CDF4]/5 hover:bg-[#90CDF4]/15 hover:border-[#90CDF4] text-[#90CDF4] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Unduh rekap CSV dan bukti bayar pesanan aktif ke dalam file ZIP"
          >
            {isBackupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
            Backup Aktif
          </button>

          <button
            onClick={() => handleDownloadBackup(true)}
            disabled={isBackupLoading}
            className="px-3.5 py-2 rounded-xl border border-[#90CDF4]/20 bg-[#90CDF4]/5 hover:bg-[#90CDF4]/15 hover:border-[#90CDF4] text-[#90CDF4] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Unduh rekap CSV dan bukti bayar seluruh pesanan (termasuk arsip) ke dalam file ZIP"
          >
            {isBackupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
            Bulk Backup
          </button>

          <button
            onClick={handlePurgeProofs}
            disabled={isPurgeLoading}
            className="px-3.5 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500 text-amber-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Hapus gambar bukti pembayaran dari pesanan yang sudah disetujui/ditolak untuk menghemat penyimpanan"
          >
            {isPurgeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} 
            Bersihkan Bukti
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-white/10 hover:border-red-400 hover:bg-red-950/20 text-white/70 hover:text-red-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Panel
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT: Orders List & Pagination (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Notification toasts (inline) */}
          {actionMessage && (
            <div className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 ${
              actionMessage.type === 'success' ? 'border-emerald-500 bg-emerald-950/20 text-emerald-200' : 'border-red-500 bg-red-950/20 text-red-200'
            }`}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                <span>{actionMessage.text}</span>
              </div>
              <button 
                onClick={() => setActionMessage(null)}
                className="text-xs font-black uppercase hover:underline"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Search, Filter, Refresh controls */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm space-y-4">
            
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Cari ID Pesanan, Nama, atau Email..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-[#90CDF4] text-sm transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#90CDF4] text-[#1a2f47] font-black text-xs md:text-sm tracking-wide hover:bg-[#a0d8f7] transition-all"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Cari
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {/* Status Segmented Tabs */}
              <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/20 overflow-hidden">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'approved', label: 'Diterima' },
                  { id: 'rejected', label: 'Ditolak' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusFilterChange(tab.id)}
                    className={`px-4 py-1.5 text-xs font-black rounded transition-all ${
                      statusFilter === tab.id
                        ? 'bg-[#90CDF4] text-[#1a2f47] shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {tab.label.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Stats & Manual Refresh */}
              <div className="flex items-center gap-4 text-xs text-white/50">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => {
                      setShowArchived(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#90CDF4] accent-[#90CDF4] cursor-pointer"
                  />
                  <span className="font-bold text-white/70 hover:text-white transition-colors">Tampilkan Arsip</span>
                </label>
                <span className="text-white/20">|</span>
                <span className="font-bold">Total: {totalOrders} Pesanan</span>
                <button
                  onClick={refreshOrders}
                  className="p-1.5 rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                  title="Refresh data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="border border-white/10 rounded-2xl bg-[#152238]/30 overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-[#90CDF4] animate-spin" />
                <p className="text-white/50 text-xs font-bold animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Memuat data pesanan...
                </p>
              </div>
            ) : error ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-4 bg-red-950/20 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-12 h-12 text-red-400" />
                <div>
                  <h3 className="text-lg font-bold text-red-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>Gagal Memuat Pesanan</h3>
                  <p className="text-xs text-red-300/80 mt-2 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => refreshOrders()}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center">
                <ShoppingBag className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Tidak ada data pesanan ditemukan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#152238]/60 text-white/50 font-black text-xs tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      <th className="py-4 px-5">ID Pesanan</th>
                      <th className="py-4 px-4">Pembeli</th>
                      <th className="py-4 px-4">Metode</th>
                      <th className="py-4 px-4 text-right">Total</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((item) => {
                      const isPending = item.status === 'pending';
                      const isApproved = item.status === 'approved';
                      const isRejected = item.status === 'rejected';

                      return (
                        <tr 
                          key={item.order_id} 
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            selectedOrder?.order_id === item.order_id ? 'bg-[#90CDF4]/5 border-l-4 border-l-[#90CDF4]' : ''
                          }`}
                          onClick={() => setSelectedOrder(item)}
                        >
                          <td className="py-4 px-5 font-black text-white/90" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.order_id}
                            <div className="text-[10px] text-white/30 font-medium mt-1">
                              {formatDate(item.created_at)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-white leading-tight">{item.buyer_name}</p>
                            <p className="text-xs text-white/40 font-medium">@{item.buyer_instagram}</p>
                          </td>
                          <td className="py-4 px-4 text-xs font-black uppercase tracking-wider text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.redeem_method}
                            {item.event_name && (
                              <div className="text-[10px] text-white/30 font-semibold lowercase tracking-normal mt-0.5 normal-case truncate max-w-[120px]" title={item.event_name}>
                                {item.event_name}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {formatRp(item.grand_total)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {isPending && (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded-full bg-[#F6E05E]/15 border border-[#F6E05E]/30 text-[#F6E05E] uppercase tracking-wider">
                                Menunggu
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                                Diterima
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded-full bg-red-500/15 border border-red-500/30 text-red-400 uppercase tracking-wider">
                                Ditolak
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); }}
                              className="p-2 rounded bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 border border-[#90CDF4]/20 text-[#90CDF4] hover:text-white transition-all"
                              title="Lihat Detail Bukti Pembayaran"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#152238]/40 border-t border-white/5 flex items-center justify-between gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3.5 py-2 rounded bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-bold text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3.5 py-2 rounded bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail View (Panel Sidebar / Mobile Modal) */}
        <div className={`
          fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm 
          lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:block lg:col-span-1
          ${selectedOrder ? 'flex' : 'hidden lg:block'}
        `}>
          <div className="w-full max-w-lg lg:max-w-none p-6 rounded-2xl border border-white/10 bg-[#152238] lg:bg-[#152238]/50 backdrop-blur-md shadow-2xl relative max-h-[90vh] lg:max-h-[calc(100vh-160px)] overflow-y-auto">
            {/* Close button for mobile */}
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#90CDF4] uppercase tracking-wider mb-6 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <FileText className="w-5 h-5" /> Detail Pembayaran
            </h3>

            {!selectedOrder ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                <User className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-xs font-bold max-w-[180px] mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Pilih salah satu baris pesanan di tabel kiri untuk memuat rincian pembeli dan bukti bayar.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* ID Header Status */}
                <div className="p-4 rounded-xl bg-black/25 border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>ID Pesanan</span>
                    <span className="text-[10px] font-bold text-white/60">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <p className="text-lg font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{selectedOrder.order_id}</p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    {selectedOrder.status === 'pending' && (
                      <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded bg-[#F6E05E]/15 border border-[#F6E05E]/30 text-[#F6E05E] uppercase tracking-wider animate-pulse">
                        Menunggu Verifikasi
                      </span>
                    )}
                    {selectedOrder.status === 'approved' && (
                      <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                        Telah Disetujui
                      </span>
                    )}
                    {selectedOrder.status === 'rejected' && (
                      <span className="inline-block px-2.5 py-1 text-[9px] font-black rounded bg-red-500/15 border border-red-500/30 text-red-400 uppercase tracking-wider">
                        Ditolak / Gagal
                      </span>
                    )}
                  </div>
                </div>

                {/* Identity Info */}
                <div className="space-y-3.5 text-xs">
                  <h4 className="text-white/40 uppercase font-black tracking-widest text-[10px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Identitas Buyer</h4>
                  
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
                    <User className="w-3.5 h-3.5 text-[#90CDF4] flex-shrink-0" />
                    <span className="font-bold text-white truncate">{selectedOrder.buyer_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
                    <Phone className="w-3.5 h-3.5 text-[#90CDF4] flex-shrink-0" />
                    <a href={`https://wa.me/${selectedOrder.buyer_whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#90CDF4] hover:underline flex items-center gap-1">
                      {selectedOrder.buyer_whatsapp} <ExternalLink className="w-3 h-3 text-white/30" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
                    <Instagram className="w-3.5 h-3.5 text-[#90CDF4] flex-shrink-0" />
                    <a href={`https://instagram.com/${selectedOrder.buyer_instagram}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#90CDF4] hover:underline flex items-center gap-1">
                      @{selectedOrder.buyer_instagram} <ExternalLink className="w-3 h-3 text-white/30" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5 py-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#90CDF4] flex-shrink-0" />
                    <span className="font-bold text-white/70 truncate">{selectedOrder.buyer_email}</span>
                  </div>
                </div>

                {/* Shipping info or event info */}
                <div className="p-3.5 rounded-xl bg-black/15 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {selectedOrder.redeem_method === 'event' ? <MapPin className="w-4 h-4 text-[#F6E05E]" /> : <ShoppingBag className="w-4 h-4 text-[#F6E05E]" />}
                    <span className="font-black uppercase text-[10px] tracking-wider text-white/70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Metode: {selectedOrder.redeem_method.toUpperCase()}
                    </span>
                  </div>
                  {selectedOrder.redeem_method === 'event' ? (
                    <p className="text-[11px] text-white/50 leading-relaxed font-bold">
                      Ambil di Booth Event Kirin Day
                    </p>
                  ) : (
                    <div className="pt-1.5 text-white/80 leading-relaxed font-bold">
                      <p className="text-[10px] text-white/30 font-black uppercase mb-1">Alamat Paket:</p>
                      <p className="whitespace-pre-wrap">{selectedOrder.shipping_address}</p>
                    </div>
                  )}
                  {selectedOrder.event_name && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#90CDF4]" />
                      <span className="font-bold text-white/70">Event: {selectedOrder.event_name}</span>
                    </div>
                  )}
                  {selectedOrder.status === 'approved' && (
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white/50">Status Pengambil:</span>
                        {selectedOrder.is_redeemed ? (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            Sudah Diambil
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                            Belum Diambil
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRedeem(selectedOrder.order_id, !!selectedOrder.is_redeemed)}
                        className="px-2 py-1 rounded bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 border border-[#90CDF4]/30 text-[#90CDF4] text-[9px] font-bold uppercase transition-all"
                      >
                        Ubah
                      </button>
                    </div>
                  )}
                </div>

                {/* Items Summaries */}
                <div className="space-y-2 text-xs max-h-40 overflow-y-auto pr-1">
                  <h4 className="text-white/40 uppercase font-black tracking-widest text-[10px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Barang Belanja</h4>
                  
                  {selectedOrder.cheki_items?.map((cheki, idx) => (
                    <div key={`det-cheki-${idx}`} className="flex justify-between py-1 border-b border-white/5">
                      <span className="font-medium text-white/80 truncate">Cheki {cheki.member_name} ({cheki.type})</span>
                      <span className="font-bold text-white/90 whitespace-nowrap">x{cheki.quantity}</span>
                    </div>
                  ))}

                  {selectedOrder.merch_items?.map((m, idx) => (
                    <div key={`det-merch-${idx}`} className="flex justify-between py-1 border-b border-white/5">
                      <span className="font-medium text-white/80 truncate">{m.merch_name}</span>
                      <span className="font-bold text-white/90 whitespace-nowrap">x{m.quantity}</span>
                    </div>
                  ))}

                  {selectedOrder.notes && (
                    <div className="p-2.5 rounded bg-white/5 text-[11px] text-white/70 italic mt-2">
                      " {selectedOrder.notes} "
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center py-3 border-t border-b border-white/10">
                  <span className="text-xs font-black text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>GRAND TOTAL:</span>
                  <span className="text-lg font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{formatRp(selectedOrder.grand_total)}</span>
                </div>

                {/* Bank / QRIS proof preview */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 uppercase font-black tracking-widest text-[10px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Bukti Pembayaran</span>
                    <span className="text-xs font-black uppercase text-[#F6E05E]">{selectedOrder.payment_method}</span>
                  </div>
                  
                  <div className="relative rounded-xl border border-white/10 bg-black/35 overflow-hidden aspect-video flex items-center justify-center">
                    {selectedOrder.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="text-center p-4">
                        <FileText className="w-10 h-10 text-[#90CDF4] mx-auto mb-1.5" />
                        <p className="text-[11px] font-bold text-white/80">Dokumen PDF</p>
                        <a
                          href={selectedOrder.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-[#F6E05E] uppercase tracking-wider hover:underline"
                        >
                          Buka Tab Baru <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    ) : (
                      <>
                        <img
                          src={selectedOrder.payment_proof_url}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={selectedOrder.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-[#90CDF4] text-[#1a2f47] text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                          >
                            Perbesar <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Rejection Note Details */}
                {selectedOrder.status === 'rejected' && (
                  <div className="p-3.5 rounded-xl border border-red-500/50 bg-red-950/20 text-xs text-red-200">
                    <p className="font-black text-red-300 uppercase tracking-wide text-[10px] mb-1">Catatan Penolakan Admin:</p>
                    <p className="font-semibold leading-relaxed">"{selectedOrder.admin_notes || 'Alasan penolakan tidak tertera.'}"</p>
                  </div>
                )}

                {/* Approve/Reject Action Buttons */}
                {selectedOrder.status === 'pending' && (
                  <div className="pt-4 grid grid-cols-2 gap-3 border-t border-white/5">
                    {/* Reject button */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => setIsRejectModalOpen(true)}
                      className="py-3 rounded-xl border border-red-500/30 bg-red-950/25 text-red-400 hover:bg-red-500 hover:text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <XCircle className="w-4 h-4" /> Tolak Bukti
                    </button>

                    {/* Approve button */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleApproveOrder(selectedOrder.order_id)}
                      className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Setujui Order
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

      {/* REJECTION REASON DIALOG MODAL (PORTAL OVERLAY) */}
      {isRejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#152238] border border-white/10 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
              <h3 className="text-md font-black text-red-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <AlertTriangle className="w-5 h-5 text-red-500" /> TOLAK PESANAN
              </h3>
              <button 
                onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
                className="text-white/40 hover:text-white text-xs font-black uppercase"
              >
                Batal
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-white/70 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menolak pesanan *{selectedOrder.order_id}*? Pembeli akan dikirimi email berisi detail penolakan ini.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-white/55 uppercase tracking-widest mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Alasan Penolakan <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Masukkan alasan penolakan secara mendetail (e.g. Bukti transfer palsu, nominal pembayaran kurang, gambar bukti terpotong)."
                  rows={4}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-black/20 text-white outline-none focus:border-red-400 text-xs font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isActionLoading || !rejectReason.trim()}
                  onClick={handleRejectOrderSubmit}
                  className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-1.5"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Konfirmasi Tolak
                </button>
              </div>
            </div>

          </div>
        </div>
      )}



    </div>
  );
}
