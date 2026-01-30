import { useState, useEffect } from 'react';

interface HeroMember {
  name: string;
  photo: string;
  order: number;
}

interface HeroSectionProps {
  onStreamClick: () => void;
}

export function HeroSection({ onStreamClick }: HeroSectionProps) {
  const [members, setMembers] = useState<HeroMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

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
          order: item.fields.order || 0
        }));

        setMembers(formattedMembers);
        setLoading(false);

        // Trigger entrance animation after data loads
        setTimeout(() => setIsVisible(true), 100);
      } catch (error) {
        console.error("Error fetching hero members:", error);
        setLoading(false);
        setIsVisible(true);
      }
    };

    fetchHeroMembers();
  }, []);

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background fallback */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Member Photo Columns - Desktop: side by side, Mobile: stacked */}
      <div className="absolute inset-0 flex flex-col md:flex-row">
        {loading ? (
          // Loading skeleton
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white/50 text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Loading...
            </div>
          </div>
        ) : members.length > 0 ? (
          members.map((member, index) => (
            <div
              key={member.name + index}
              className={`
                relative flex-1 overflow-hidden cursor-pointer group
                md:h-full h-[50vh]
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
              `}
              style={{
                transitionDelay: `${index * 150}ms`
              }}
            >
              {/* Member Photo */}
              <img
                src={member.photo}
                alt={member.name}
                className="absolute inset-0 w-full h-full object-cover object-top
                  transition-all duration-500 ease-out
                  group-hover:scale-110 group-hover:brightness-110
                  filter brightness-90"
              />

              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 
                group-hover:from-black/40 transition-all duration-500" />

              {/* Member name on hover - desktop only */}
              <div className="absolute bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 
                transition-opacity duration-300 hidden md:block">
                <span className="text-white text-sm font-bold tracking-widest uppercase px-4 py-2 
                  bg-black/30 backdrop-blur-sm rounded-full"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {member.name}
                </span>
              </div>
            </div>
          ))
        ) : (
          // Fallback when no members - show solid background
          <div className="flex-1 bg-[#1a2f47]" />
        )}
      </div>

      {/* Bottom Overlay with Text - always visible */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 z-20 pb-16 md:pb-20 pt-32
          bg-gradient-to-t from-black via-black/80 to-transparent
          transition-all duration-1000 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
        `}
        style={{ transitionDelay: `${(members.length || 1) * 150 + 200}ms` }}
      >
        <div className="text-center px-6">
          {/* Tagline */}
          <p className="text-sm md:text-base text-white/70 mb-3 tracking-widest uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Japanese-Style Idol Group • Bandung
          </p>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
            KIRIN DAY
          </h1>

          {/* Subtitle/Slogan */}
          <p className="text-lg md:text-2xl text-[#90CDF4] font-bold mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
            TENKAICHI MORIAGARI
          </p>
          <p className="text-base md:text-lg text-white/60 mb-8"
            style={{ fontFamily: 'Montserrat, sans-serif' }}>
            天下一盛り上がり
          </p>

          {/* CTA Button */}
          <button
            onClick={onStreamClick}
            className="px-8 py-3 md:px-10 md:py-4 text-sm md:text-base font-black text-[#1a2f47] bg-[#F6E05E] rounded-full 
              transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F6E05E]/30"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            STREAM LATEST SINGLE
          </button>
        </div>
      </div>

      {/* Top gradient for navbar visibility */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
    </section>
  );
}