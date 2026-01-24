import { X, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Member {
  name: string;
  role: string;
  image: string;
  funFact: string;
  instagramHandle: string;
  twitterHandle: string;
  isSupport?: boolean;
  supportLabel?: string;
}

interface MemberModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberModal({ member, isOpen, onClose }: MemberModalProps) {
  if (!member) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Container - Constrained height with scrolling */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring', damping: 25 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-[#1E1E1E] border-2 border-[#F6E05E] rounded-2xl overflow-y-auto shadow-2xl shadow-[#F6E05E]/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Absolutely positioned within safe padding */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-30 w-12 h-12 flex items-center justify-center bg-[#F6E05E] hover:bg-[#F6E05E]/80 rounded-full transition-all duration-200 shadow-lg hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-[#1a2f47] font-bold" strokeWidth={3} />
              </button>

              {/* Modal Content */}
              <div className="flex flex-col md:flex-row">
                {/* Portrait Photo - Constrained height on mobile */}
                <div className="w-full md:w-1/2 h-[200px] max-h-[30vh] md:h-auto md:max-h-none md:min-h-[600px] relative bg-[#1a2f47] flex-shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1E1E1E] via-transparent to-transparent" />
                </div>

                {/* Biodata - Scrollable content area with safe padding */}
                <div className="w-full md:w-1/2 p-6 pb-8 md:p-12 flex flex-col min-h-0">
                  {/* Support Badge */}
                  {member.isSupport && member.supportLabel && (
                    <div 
                      className="inline-block px-4 py-2 rounded-lg border-2 border-[#90CDF4] mb-6 self-start"
                      style={{ background: 'rgba(144, 205, 244, 0.1)' }}
                    >
                      <span className="text-xs font-black text-[#90CDF4] tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {member.supportLabel}
                      </span>
                    </div>
                  )}

                  {/* Stage Name */}
                  <h2 
                    className="text-4xl md:text-5xl font-black text-[#90CDF4] mb-3"
                    style={{ 
                      fontFamily: 'Montserrat, sans-serif',
                      textShadow: '0 0 30px rgba(144, 205, 244, 0.3)'
                    }}
                  >
                    {member.name}
                  </h2>

                  {/* Decorative Line */}
                  <div className="w-20 h-1 bg-[#F6E05E] mb-6" />

                  {/* Role */}
                  <div className="mb-8">
                    <p className="text-sm text-white/50 uppercase tracking-wider mb-2 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Role
                    </p>
                    <p className="text-xl text-white font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {member.role}
                    </p>
                  </div>

                  {/* Fun Fact */}
                  <div className="mb-10">
                    <p className="text-sm text-white/50 uppercase tracking-wider mb-2 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Fun Fact
                    </p>
                    <p className="text-base text-white/80 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {member.funFact}
                    </p>
                  </div>

                  {/* Social Media */}
                  <div className="pb-4">
                    <p className="text-sm text-white/50 uppercase tracking-wider mb-4 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Connect
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Instagram */}
                      <a
                        href={`https://instagram.com/${member.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 border-2 border-[#90CDF4]/30 hover:border-[#90CDF4] rounded-lg transition-all duration-200 group"
                      >
                        <Instagram className="w-5 h-5 text-[#90CDF4] flex-shrink-0" />
                        <span className="text-sm font-bold text-[#90CDF4] truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          @{member.instagramHandle}
                        </span>
                      </a>

                      {/* X (Twitter) */}
                      <a
                        href={`https://x.com/${member.twitterHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 border-2 border-[#90CDF4]/30 hover:border-[#90CDF4] rounded-lg transition-all duration-200 group"
                      >
                        <svg 
                          className="w-5 h-5 text-[#90CDF4] flex-shrink-0" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-sm font-bold text-[#90CDF4] truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          @{member.twitterHandle}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F6E05E] to-transparent" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}