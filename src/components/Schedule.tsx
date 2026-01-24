import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';

export function Schedule() {
  const events = [
    {
      date: 'Feb 14',
      year: '2026',
      day: 'FRI',
      title: 'Valentine Live Special',
      venue: 'Istana BEC - Main Hall',
      time: '19:00 WIB',
      ticketStatus: 'On Sale',
    },
    {
      date: 'Mar 8',
      year: '2026',
      day: 'SAT',
      title: 'Kirin Day 1st Anniversary',
      venue: 'Istana BEC - Grand Stage',
      time: '18:00 WIB',
      ticketStatus: 'Coming Soon',
    },
    {
      date: 'Apr 20',
      year: '2026',
      day: 'SUN',
      title: 'Spring Festival Performance',
      venue: 'Istana BEC - Open Air',
      time: '17:00 WIB',
      ticketStatus: 'Coming Soon',
    },
    {
      date: 'May 15',
      year: '2026',
      day: 'THU',
      title: 'Collaboration Night feat. Special Guests',
      venue: 'Istana BEC - Main Hall',
      time: '19:30 WIB',
      ticketStatus: 'Coming Soon',
    }
  ];

  return (
    <section id="schedule" className="py-32 px-6 bg-[#152238]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-[#90CDF4]" />
            <h2 className="text-4xl md:text-5xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              SCHEDULE
            </h2>
          </div>
          <div className="w-24 h-1 bg-[#F6E05E] mx-auto mb-4" />
          <p className="text-white/60 text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Upcoming Performances at Istana BEC
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event, index) => (
            <div 
              key={index}
              className="group relative rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-[#90CDF4]/30 hover:shadow-lg hover:shadow-[#90CDF4]/10"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Accent Top Border - Subtle */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#90CDF4] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="p-8">
                {/* Date Badge */}
                <div className="flex items-start gap-6 mb-6">
                  <div 
                    className="flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center border border-white/20"
                    style={{
                      background: 'rgba(144, 205, 244, 0.1)',
                    }}
                  >
                    <span className="text-xs font-bold text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.day}
                    </span>
                    <span className="text-xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.date.split(' ')[1]}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-[#90CDF4]" />
                        <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{event.venue}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Clock className="w-4 h-4 flex-shrink-0 text-[#90CDF4]" />
                        <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{event.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ticket Status */}
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#90CDF4]" />
                    <span 
                      className="text-sm font-bold"
                      style={{ 
                        color: event.ticketStatus === 'On Sale' ? '#90CDF4' : 'rgba(255, 255, 255, 0.5)',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    >
                      {event.ticketStatus}
                    </span>
                  </div>
                  
                  <button 
                    className="px-6 py-2 rounded-full text-xs font-black transition-all duration-300 hover:scale-105"
                    style={{
                      background: event.ticketStatus === 'On Sale' ? '#F6E05E' : 'rgba(255, 255, 255, 0.1)',
                      color: event.ticketStatus === 'On Sale' ? '#1a2f47' : 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    {event.ticketStatus === 'On Sale' ? 'GET TICKETS' : 'NOTIFY ME'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}