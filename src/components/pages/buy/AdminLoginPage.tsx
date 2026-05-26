import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    const checkLogin = async () => {
      const savedPass = localStorage.getItem('admin_password');
      const savedTime = localStorage.getItem('admin_login_timestamp');

      // Check if session has expired (24 hours)
      if (savedTime && Date.now() - parseInt(savedTime, 10) > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_login_timestamp');
        return;
      }

      if (savedPass) {
        setIsLoading(true);
        try {
          const res = await fetch('/api/orders?page=1', {
            headers: {
              'Authorization': `Bearer ${savedPass}`
            }
          });
          if (res.ok) {
            navigate('/admin');
          } else {
            localStorage.removeItem('admin_password');
            localStorage.removeItem('admin_login_timestamp');
          }
        } catch (e) {
          // offline or error, let them try logging in manually
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkLogin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // Test the password against the admin API
      const res = await fetch('/api/orders?page=1', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kata sandi yang Anda masukkan salah.');
      }

      // If success, store in localStorage and redirect
      localStorage.setItem('admin_password', password);
      localStorage.setItem('admin_login_timestamp', Date.now().toString());
      navigate('/admin');

    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || 'Gagal masuk. Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 flex items-center justify-center bg-[#1a2f47] text-white relative">
      {/* Background patterns */}
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

      <div className="relative w-full max-w-md bg-[#152238]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/shop')}
          className="absolute -top-12 left-0 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#90CDF4] hover:text-white transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Shop
        </button>

        {/* Brand/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#90CDF4]/15 border border-[#90CDF4]/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#90CDF4]" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            ADMIN PORTAL
          </h1>
          <p className="text-white/50 text-xs mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Akses dashboard verifikasi pesanan Kirin Day
          </p>
        </div>

        {/* Alert Error Box */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/50 bg-red-950/30 text-red-200 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-white/70 uppercase tracking-widest mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              KATA SANDI ADMIN
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-white/10 bg-white/5 text-white outline-none focus:border-[#90CDF4] transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[#90CDF4] hover:bg-[#a0d8f7] text-[#1a2f47] font-black uppercase text-sm tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#90CDF4]/15"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              'MASUK PORTAL'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
