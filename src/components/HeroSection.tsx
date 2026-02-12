import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroMember {
  name: string;
  photo: string;
  order: number;
  mobileCropPosition: string; // e.g., "top", "center", "20%", "30%"
  memberColor: string; // HEX color for member's signature color
}

interface HeroSectionProps {
  onStreamClick: () => void;
}

export function HeroSection({ onStreamClick }: HeroSectionProps) {
  const [members, setMembers] = useState<HeroMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHeroMembers = async () => {
      try {
        const { client } = await import('../lib/contentful');
        const response = await client.getEntries({
          content_type: 'heroMember',
          order: ['fields.order']
        });

        const formattedMembers: HeroMember[] = response.items.map((item: any) => ({
          name: item.fields.name || 'Member',
          photo: item.fields.photo?.fields?.file?.url
            ? (item.fields.photo.fields.file.url.startsWith('//') ? 'https:' + item.fields.photo.fields.file.url : item.fields.photo.fields.file.url)
            : 'https://via.placeholder.com/400x800',
          order: item.fields.order || 0,
          mobileCropPosition: item.fields.mobileCropPosition || '30%', // Default to 30% from top
          memberColor: item.fields.memberColor || '#3b82f6' // Default blue
        }));

        setMembers(formattedMembers);
      } catch (error) {
        console.error("Error fetching hero members:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setIsVisible(true), 200);
      }
    };

    fetchHeroMembers();
  }, []);

  return (
    <section id="home" className="relative w-full overflow-hidden" style={{ height: '100vh', minHeight: '600px' }}>
      {/* Background fallback */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Member Photo Columns - pt-20 on mobile for navbar */}
      <div className="absolute inset-0 flex flex-col md:flex-row pt-20 md:pt-0">
        {loading ? (
          <div className="flex-1" />
        ) : members.length > 0 ? (
          members.map((member, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={member.name + index}
                className="relative flex-1 overflow-hidden cursor-pointer md:h-full h-[35vh]"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150}ms`
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => navigate('/members?name=' + encodeURIComponent(member.name))}
              >
                {/* Member Photo */}
                <img
                  src={member.photo}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
                  style={{
                    objectPosition: `center ${member.mobileCropPosition}`,
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    filter: isHovered ? 'brightness(1)' : 'brightness(0.85)'
                  }}
                />

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: isHovered
                      ? 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%, transparent 100%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                  }}
                />

                {/* Desktop only: Color overlay - fades on hover */}
                <div
                  className="absolute inset-0 hidden md:block transition-opacity duration-500 ease-out z-10"
                  style={{
                    backgroundColor: member.memberColor + '80',
                    opacity: isHovered ? 0 : 1
                  }}
                />

                {/* Desktop only: Vertical name - fades on hover */}
                <div
                  className="absolute inset-0 hidden md:flex items-center justify-center transition-opacity duration-500 ease-out z-20"
                  style={{ opacity: isHovered ? 0 : 1 }}
                >
                  <span
                    className="text-white text-2xl lg:text-4xl font-black tracking-[0.3em] uppercase"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      textShadow: '0 2px 15px rgba(0,0,0,0.5)'
                    }}
                  >
                    {member.name}
                  </span>
                </div>

                {/* Member name badge on hover - desktop only */}
                <div
                  className="absolute top-24 left-0 right-0 text-center hidden md:block transition-all duration-300 z-30"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(-16px)'
                  }}
                >
                  <span
                    className="text-white text-xs font-bold tracking-widest uppercase px-4 py-2 
                    bg-black/50 backdrop-blur-md rounded-full border border-white/20"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {member.name}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 bg-gradient-to-b from-[#1a2f47] to-[#0a0a0a]" />
        )}
      </div>

      {/* Top gradient for navbar */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />

      {/* Bottom Content - using flex to center vertically at bottom */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end">
        {/* Gradient background */}
        <div
          className="pointer-events-auto"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)',
            paddingTop: '120px'
          }}
        >
          {/* Text container with margin from bottom */}
          <div
            className="text-center px-4"
            style={{
              paddingBottom: '120px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 1s cubic-bezier(0.4, 0, 0.2, 1) ${(members.length || 1) * 150 + 300}ms`
            }}
          >
            {/* Tagline */}
            <p className="text-[10px] md:text-xs text-white/50 tracking-[0.25em] uppercase mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Japanese-Style Idol Group • Bandung
            </p>

            {/* Main Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)'
              }}>
              KIRIN DAY
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-lg lg:text-xl text-[#F6E05E] font-bold mb-1"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 15px rgba(0,0,0,0.8)'
              }}>
              TENKAICHI MORIAGARI
            </p>
            {/* Japanese text */}
            <p className="text-xs md:text-sm text-white/70 mb-6 md:mb-8 tracking-wider"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}>
              天下一盛り上がり
            </p>

            {/* CTA Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStreamClick();
              }}
              className="px-6 py-2.5 md:px-8 md:py-3 text-xs md:text-sm font-black text-[#1a2f47] bg-[#F6E05E] rounded-full 
                transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#F6E05E]/40
                shadow-md shadow-black/30 cursor-pointer relative z-50"
              style={{ fontFamily: 'Montserrat, sans-serif', pointerEvents: 'auto' }}
            >
              STREAM LATEST SINGLE
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}