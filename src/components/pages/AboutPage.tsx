import { Calendar, Star } from 'lucide-react';

export function AboutPage() {
  const events = [
    {
      date: '13 May 2023',
      title: 'Formation',
      description: 'Kirin Day was formed with a vision to bring Japanese idol culture to Bandung. Seven talented performers came together to create a group that would spread joy and high energy through music and performances.',
      icon: Star,
      details: 'The name "Kirin Day" symbolizes both the mythical creature representing prosperity and good fortune, and our commitment to making every day special for our fans.'
    },
    {
      date: '22 October 2023',
      title: 'Official Debut',
      description: 'Our official debut performance at Istana BEC marked the beginning of an incredible journey. With the theme "Tenkaichi Moriagari", we brought unprecedented energy to the stage.',
      icon: Calendar,
      details: 'Over 500 fans attended our debut show, creating an unforgettable atmosphere. This milestone established Kirin Day as a rising force in the Indonesian idol scene.'
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 bg-[#1a2f47]">
      {/* Striped Pattern Overlay */}
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

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#90CDF4] mb-4 md:mb-6" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
            OUR JOURNEY
          </h1>
          <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-4 md:mb-6" />
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed px-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            From formation to fame, discover the milestones that shaped Kirin Day into Bandung's premier Japanese-style idol group
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line - Hidden on mobile, shown on md+ */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#90CDF4]/50 via-[#90CDF4]/30 to-[#90CDF4]/50" />

          {/* Mobile Timeline Line - Left aligned on mobile */}
          <div className="block md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#90CDF4]/50 via-[#90CDF4]/30 to-[#90CDF4]/50" />

          {/* Timeline Events */}
          <div className="space-y-12 md:space-y-40">
            {events.map((event, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-start md:items-start gap-6 md:gap-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Mobile Layout - Single Column */}
                <div className="flex md:hidden w-full pl-20">
                  <div className="w-full">
                    {/* Date Badge - Above content on mobile */}
                    <div
                      className="inline-block px-4 py-2 rounded-full mb-4 border-2 border-[#F6E05E]"
                      style={{ background: 'rgba(246, 224, 94, 0.1)' }}
                    >
                      <span className="text-xs tracking-widest text-[#F6E05E] font-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.date}
                      </span>
                    </div>

                    {/* Content Card */}
                    <div
                      className="p-6 rounded-xl border-2 border-white/10 transition-all duration-300 hover:border-[#90CDF4]/40 hover:shadow-2xl hover:shadow-[#90CDF4]/10"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.title}
                      </h3>

                      <p className="text-base text-white/80 leading-relaxed mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.description}
                      </p>

                      <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.details}
                      </p>

                      {/* Decorative Corner */}
                      <div className="mt-4 flex justify-start">
                        <div className="w-16 h-1 bg-gradient-to-r from-[#90CDF4] to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Icon - Left side on mobile */}
                <div className="absolute left-0 md:relative md:left-auto flex md:hidden z-10 flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#90CDF4] bg-[#1a2f47] shadow-lg shadow-[#90CDF4]/30"
                  >
                    <event.icon className="w-7 h-7 text-[#90CDF4]" />
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-full bg-[#90CDF4]/20 blur-xl" />
                </div>

                {/* Desktop Layout - Dual Timeline */}
                {/* Content Card */}
                <div className={`hidden md:block flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div
                    className="inline-block p-10 rounded-2xl border-2 border-white/10 transition-all duration-300 hover:border-[#90CDF4]/40 hover:shadow-2xl hover:shadow-[#90CDF4]/10"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    {/* Date Badge */}
                    <div
                      className="inline-block px-5 py-2 rounded-full mb-6 border-2 border-[#F6E05E]"
                      style={{ background: 'rgba(246, 224, 94, 0.1)' }}
                    >
                      <span className="text-sm tracking-widest text-[#F6E05E] font-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.date}
                      </span>
                    </div>

                    <h3 className="text-3xl font-black text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.title}
                    </h3>

                    <p className="text-lg text-white/80 leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.description}
                    </p>

                    <p className="text-base text-white/60 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.details}
                    </p>

                    {/* Decorative Corner */}
                    <div className={`mt-6 flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="w-16 h-1 bg-gradient-to-r from-[#90CDF4] to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Center Icon - Desktop only */}
                <div className="hidden md:block relative z-10 flex-shrink-0">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-[#90CDF4] bg-[#1a2f47] shadow-lg shadow-[#90CDF4]/30"
                  >
                    <event.icon className="w-9 h-9 text-[#90CDF4]" />
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-full bg-[#90CDF4]/20 blur-xl" />
                </div>

                {/* Spacer - Desktop only */}
                <div className="hidden md:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}