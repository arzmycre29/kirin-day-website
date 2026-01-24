import { Calendar, Star } from 'lucide-react';

export function Timeline() {
  const events = [
    {
      date: 'May 2023',
      title: 'Formation',
      description: 'Kirin Day was formed with a vision to bring Japanese idol culture to Bandung',
      icon: Star,
    },
    {
      date: 'Oct 2023',
      title: 'Debut',
      description: 'Official debut performance at Istana BEC, marking the beginning of our journey',
      icon: Calendar,
    }
  ];

  return (
    <section id="about" className="py-32 px-6 bg-[#1a2f47]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-[#90CDF4] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            OUR JOURNEY
          </h2>
          <div className="w-24 h-1 bg-[#F6E05E] mx-auto" />
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-[#90CDF4]/50 via-[#90CDF4]/30 to-[#90CDF4]/50" />
          
          {/* Timeline Events */}
          <div className="space-y-32">
            {events.map((event, index) => (
              <div 
                key={index}
                className={`flex items-center gap-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Content Card */}
                <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div 
                    className="inline-block p-8 rounded-xl border border-white/10 transition-all duration-300 hover:border-[#90CDF4]/30"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div className="text-xs tracking-widest mb-3 text-[#F6E05E] font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.date}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.description}
                    </p>
                  </div>
                </div>
                
                {/* Center Icon */}
                <div 
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#90CDF4] bg-[#1a2f47]"
                >
                  <event.icon className="w-6 h-6 text-[#90CDF4]" />
                </div>
                
                {/* Spacer */}
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}