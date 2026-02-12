import { Menu, X, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Fallback logo
const defaultLogo = "https://via.placeholder.com/150/F6E05E/1a2f47?text=Kirin+Day";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(3); // Mock cart count
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch logo from Contentful
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { client } = await import('../lib/contentful');
        const response = await client.getEntries({
          content_type: 'pageSection',
          'fields.slug': 'site-logo',
          limit: 1,
        });

        if (response.items.length > 0) {
          const item = response.items[0] as any;
          const imageUrl = item.fields.image?.fields?.file?.url;
          if (imageUrl) {
            setLogoUrl(imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
        // Keep default logo on error
      }
    };

    fetchLogo();
  }, []);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'MEMBERS', path: '/members' },
    { name: 'MUSIC', path: '/music' },
    { name: 'SCHEDULE', path: '/schedule' },
    { name: 'MEDIA', path: '/media' },
    { name: 'SHOP', path: '/shop' }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ background: 'rgba(26, 47, 71, 0.8)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => handleNavClick('/')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F6E05E]/10 p-0.5 transition-transform duration-300 group-hover:scale-110">
              <img src={logoUrl} alt="Kirin Day" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-xl font-black text-[#FFFCE0] tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              KIRIN DAY
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path)}
                className={`text-sm font-bold transition-colors duration-300 tracking-wide relative group ${isActive(link.path) ? 'text-[#90CDF4]' : 'text-[#FFFCE0]/80 hover:text-[#90CDF4]'
                  }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#F6E05E] transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
              </button>
            ))}

            {/* Shopping Cart Icon */}
            <button
              onClick={() => handleNavClick('/shop')}
              className="relative p-2 rounded-full bg-white/5 hover:bg-[#F6E05E]/10 border border-white/10 hover:border-[#F6E05E]/30 transition-all duration-300 group"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#FFFCE0]/80 group-hover:text-[#F6E05E] transition-colors" />
              {/* Yellow Badge */}
              {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F6E05E] border-2 border-[#1a2f47] flex items-center justify-center">
                  <span className="text-[10px] font-black text-[#1a2f47]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {cartCount}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#FFFCE0] hover:text-[#90CDF4] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path)}
                className={`block w-full text-left text-sm font-bold transition-colors py-2 ${isActive(link.path) ? 'text-[#90CDF4]' : 'text-[#FFFCE0]/80 hover:text-[#90CDF4]'
                  }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {link.name}
              </button>
            ))}

            {/* Mobile Cart */}
            <button
              onClick={() => handleNavClick('/shop')}
              className="flex items-center gap-3 w-full text-left text-sm font-bold text-[#FFFCE0]/80 hover:text-[#90CDF4] transition-colors py-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <ShoppingCart className="w-5 h-5" />
              CART ({cartCount})
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}