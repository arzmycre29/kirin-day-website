import { Instagram, Twitter, Youtube, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  // Footer links with path mappings - About Us removed
  const footerLinks = [
    { name: 'Members', path: '/members' },
    { name: 'Discography', path: '/music' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Shop', path: '/shop' }
  ];

  const handleLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-20 px-6 bg-[#0f1a2a] border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-black mb-3 text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              KIRIN DAY
            </h3>
            <p className="text-white/70 text-sm mb-3 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Bandung's First Japanese-Style Local Idol Group
            </p>
            <p className="text-white/50 text-xs" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              天下一盛り上がり
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleLinkClick(link.path)}
                    className="text-white/60 hover:text-[#90CDF4] transition-colors text-sm text-left"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Get in Touch
            </h4>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin className="w-4 h-4 text-[#90CDF4]" />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Bandung, Indonesia</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Mail className="w-4 h-4 text-[#90CDF4]" />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>info@kirinday.id</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/kirinday.idol/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-white/70 hover:text-[#90CDF4]" />
              </a>
              <a
                href="https://x.com/kirindayidol"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-white/70 hover:text-[#90CDF4]" />
              </a>
              <a
                href="https://www.youtube.com/@KirinDay_idol"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4 text-white/70 hover:text-[#90CDF4]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            © 2026 Kirin Day. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
