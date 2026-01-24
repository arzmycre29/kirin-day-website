import { Sparkles } from 'lucide-react';
const kirinMascot = "https://via.placeholder.com/150/F6E05E/1a2f47?text=Kirin+Day";

interface HeroSectionProps {
  onStreamClick: () => void;
}

export function HeroSection({ onStreamClick }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Clean Background with Subtle Pattern Overlay */}
      <div className="absolute inset-0 bg-[#1a2f47]" />

      {/* Subtle Striped Pattern Overlay - Low Opacity */}
      <div
        className="absolute inset-0 opacity-5"
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

      {/* Subtle Accent Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#90CDF4]/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F6E05E]/30 mb-12" style={{ background: 'rgba(246, 224, 94, 0.05)' }}>
          <Sparkles className="w-4 h-4 text-[#F6E05E]" />
          <span className="text-xs tracking-widest text-[#FFFCE0]/90 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            JAPANESE-STYLE IDOL GROUP • BANDUNG
          </span>
        </div>

        <h1 className="mb-8 tracking-tight">
          <div className="text-6xl md:text-8xl lg:text-9xl font-black text-[#90CDF4] mb-3" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
            TENKAICHI
          </div>
          <div className="text-5xl md:text-7xl lg:text-8xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
            MORIAGARI
          </div>
        </h1>

        <p className="text-xl md:text-2xl text-white mb-4 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          天下一盛り上がり
        </p>

        <p className="text-base text-white/70 mb-16 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Experience the ultimate high-energy performance from Bandung's premier Japanese-style local idol group
        </p>

        <button
          onClick={onStreamClick}
          className="group relative px-10 py-4 text-base font-black text-[#1a2f47] bg-[#F6E05E] rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F6E05E]/30"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          STREAM LATEST SINGLE
        </button>
      </div>
    </section>
  );
}