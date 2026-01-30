import { Calendar, MapPin, Clock, Ticket, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SchedulePageProps {
  targetId?: string | null;
}

export function SchedulePage({ targetId }: SchedulePageProps) {
  // State for events
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { client } = await import('../../lib/contentful');
        const response = await client.getEntries({
          content_type: 'event',
          order: ['fields.date'],
        });

        const formattedEvents = response.items.map((item: any) => {
          const dateObj = new Date(item.fields.date);
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

          // Extract attending members from reference field
          const attendingMembers = item.fields.attendingMembers?.map((member: any) => ({
            name: member.fields?.name || 'Unknown',
            photo: member.fields?.photo?.fields?.file?.url
              ? `https:${member.fields.photo.fields.file.url}`
              : null
          })) || [];

          return {
            id: item.sys.id, // ID needed for deep linking
            date: dateObj.getDate().toString(),
            month: monthNames[dateObj.getMonth()],
            year: dateObj.getFullYear().toString(),
            day: dayNames[dateObj.getDay()],
            title: item.fields.title,
            venue: item.fields.venue,
            address: item.fields.address,
            time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            duration: 'TBA',
            ticketStatus: item.fields.ticketStatus || 'Coming Soon',
            ticketPrice: item.fields.ticketPrice || 'TBA',
            ticketUrl: item.fields.ticketUrl || '',
            ticketEnabled: item.fields.ticketEnabled ?? true, // Default to true if not set
            attendingMembers,
            type: item.fields.type || 'Event'
          };
        });

        setEvents(formattedEvents);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule.");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Scroll to target on load/update
  useEffect(() => {
    if (targetId && !loading && events.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optional: Add highlight effect
          element.classList.add('ring-2', 'ring-[#F6E05E]');
          setTimeout(() => element.classList.remove('ring-2', 'ring-[#F6E05E]'), 2000);
        }
      }, 500); // Small delay to ensure rendering
    }
  }, [targetId, loading, events]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238] flex items-center justify-center">
        <div className="text-2xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          LOADING SCHEDULE...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-[#152238]">
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

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Calendar className="w-10 h-10 text-[#90CDF4]" />
            <h1 className="text-5xl md:text-6xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
              SCHEDULE
            </h1>
          </div>
          <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-6" />
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Upcoming Performances at Istana BEC • Don't miss out on our high-energy shows and special events
          </p>
        </div>

        {/* Events Grid */}
        <div className="space-y-8">
          {events.map((event, index) => (
            <div
              key={event.id || index}
              id={event.id}
              className="group relative rounded-2xl overflow-hidden border-2 border-white/10 transition-all duration-300 hover:border-[#90CDF4]/30 hover:shadow-2xl hover:shadow-[#90CDF4]/10 scroll-mt-32"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#90CDF4] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Date Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center border-2 border-[#90CDF4]"
                      style={{
                        background: 'rgba(144, 205, 244, 0.1)',
                      }}
                    >
                      <span className="text-xs font-bold text-white/60 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.day}
                      </span>
                      <span className="text-4xl font-black text-[#90CDF4] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.date}
                      </span>
                      <span className="text-sm font-bold text-white/80" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {event.month} {event.year}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="inline-block px-3 py-1 rounded-md bg-[#F6E05E]/10 border border-[#F6E05E]/20 text-xs font-bold text-[#F6E05E] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {event.type}
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 flex-shrink-0 text-[#90CDF4] mt-0.5" />
                        <div>
                          <p className="text-white/80 font-bold text-sm mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {event.venue}
                          </p>
                          <p className="text-white/50 text-xs" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {event.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 flex-shrink-0 text-[#90CDF4] mt-0.5" />
                        <div>
                          <p className="text-white/80 font-bold text-sm mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {event.time}
                          </p>
                          <p className="text-white/50 text-xs" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Duration: {event.duration}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Info */}
                    <div
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-white/10"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-5 h-5 text-[#90CDF4]" />
                          <div>
                            <span
                              className="text-sm font-bold block"
                              style={{
                                color: event.ticketStatus === 'On Sale' ? '#90CDF4' : 'rgba(255, 255, 255, 0.5)',
                                fontFamily: 'Montserrat, sans-serif'
                              }}
                            >
                              {event.ticketStatus}
                            </span>
                            <span className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {event.ticketPrice}
                            </span>
                          </div>
                        </div>

                        <div className="h-8 w-px bg-white/10" />

                        {/* Attending Members */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#90CDF4]" />
                            {event.attendingMembers && event.attendingMembers.length > 0 ? (
                              <div className="flex items-center">
                                {/* Member avatars - show up to 5 */}
                                <div className="flex -space-x-2">
                                  {event.attendingMembers.slice(0, 5).map((member: any, idx: number) => (
                                    member.photo ? (
                                      <img
                                        key={idx}
                                        src={member.photo}
                                        alt={member.name}
                                        className="w-7 h-7 rounded-full border-2 border-[#152238] object-cover"
                                        title={member.name}
                                      />
                                    ) : (
                                      <div
                                        key={idx}
                                        className="w-7 h-7 rounded-full border-2 border-[#152238] bg-[#90CDF4]/20 flex items-center justify-center text-xs text-white/60"
                                        title={member.name}
                                      >
                                        {member.name[0]}
                                      </div>
                                    )
                                  ))}
                                </div>
                                {/* Show +N if more than 5 */}
                                {event.attendingMembers.length > 5 && (
                                  <span className="text-xs text-white/50 ml-2 font-medium">
                                    +{event.attendingMembers.length - 5}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                TBA
                              </span>
                            )}
                          </div>
                          {/* Member names on separate line */}
                          {event.attendingMembers && event.attendingMembers.length > 0 && (
                            <p className="text-xs text-white/50 pl-7 truncate max-w-xs md:max-w-md" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {event.attendingMembers.map((m: any) => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ticket Button - Conditional */}
                      {event.ticketEnabled && (
                        <a
                          href={event.ticketUrl || '#'}
                          target={event.ticketUrl ? '_blank' : undefined}
                          rel={event.ticketUrl ? 'noopener noreferrer' : undefined}
                          className={`px-8 py-3 rounded-full text-sm font-black transition-all duration-300 hover:scale-105 ${event.ticketStatus === 'On Sale'
                            ? 'bg-[#F6E05E] text-[#1a2f47] hover:shadow-xl hover:shadow-[#F6E05E]/30'
                            : 'bg-white/10 text-white/60 border border-white/20'
                            }`}
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {event.ticketStatus === 'On Sale' ? 'GET TICKETS' : 'NOTIFY ME'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F6E05E] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
