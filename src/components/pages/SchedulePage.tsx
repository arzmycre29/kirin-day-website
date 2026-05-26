import { Calendar, MapPin, Clock, Ticket, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageSkeleton } from '../PageSkeleton';

export function SchedulePage() {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  // State for events
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const totalDays = getDaysInMonth(year, month);
  const startDayOfWeek = getFirstDayOfMonth(year, month);

  const monthNamesIndo = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (cellDate: Date | null) => {
    if (!cellDate) return [];
    return events.filter(ev => {
      if (!ev.dateObj) return false;
      return (
        ev.dateObj.getFullYear() === cellDate.getFullYear() &&
        ev.dateObj.getMonth() === cellDate.getMonth() &&
        ev.dateObj.getDate() === cellDate.getDate()
      );
    });
  };

  // Generate calendar cells
  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, date: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dDate = new Date(year, month, d);
    cells.push({ day: d, date: dDate });
  }

  const weekdays = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

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
            ticketEnabled: item.fields.ticketEnabled ?? true, // Default to true if not set
            attendingMembers,
            type: item.fields.type || 'Event',
            dateObj
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
    return <PageSkeleton variant="list" />;
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

        {/* Calendar View */}
        <div className="mb-16 p-6 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-md shadow-xl relative overflow-hidden">
          {/* Ambient background glow inside calendar */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#90CDF4]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#F6E05E]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-lg font-black tracking-wider text-[#90CDF4] flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <Calendar className="w-5 h-5" /> EVENT CALENDAR
            </h2>

            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-[#90CDF4]" />
              </button>
              
              <span className="text-sm font-black text-white w-32 text-center tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {monthNamesIndo[month]} {year}
              </span>

              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4 text-[#90CDF4]" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="relative z-10">
            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-white/40 tracking-wider">
              {weekdays.map(day => (
                <div key={day} className="py-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {cells.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                const hasEvents = dayEvents.length > 0;
                
                // Check if cell represents today
                const isToday = cell.date && 
                  new Date().getDate() === cell.date.getDate() &&
                  new Date().getMonth() === cell.date.getMonth() &&
                  new Date().getFullYear() === cell.date.getFullYear();

                const handleCellClick = () => {
                  if (hasEvents) {
                    const firstEventId = dayEvents[0].id;
                    const element = document.getElementById(firstEventId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.classList.add('ring-4', 'ring-[#F6E05E]/50');
                      setTimeout(() => element.classList.remove('ring-4', 'ring-[#F6E05E]/50'), 2000);
                    }
                  }
                };

                return (
                  <div
                    key={idx}
                    onClick={handleCellClick}
                    className={`
                      aspect-square rounded-xl p-1.5 flex flex-col justify-between items-center transition-all relative border select-none
                      ${cell.day === null ? 'border-transparent bg-transparent' : ''}
                      ${cell.day !== null && !hasEvents ? 'border-white/5 bg-white/2 hover:border-white/20' : ''}
                      ${hasEvents ? 'border-[#90CDF4]/40 bg-[#90CDF4]/10 hover:bg-[#90CDF4]/20 hover:border-[#90CDF4] cursor-pointer shadow-lg shadow-[#90CDF4]/5 group' : ''}
                      ${isToday ? 'ring-2 ring-white/30 border-white/20' : ''}
                    `}
                  >
                    {cell.day !== null && (
                      <>
                        {/* Day Number */}
                        <span className={`text-sm font-black ${hasEvents ? 'text-[#90CDF4] scale-105' : 'text-white/60'} ${isToday ? 'text-white' : ''}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {cell.day}
                        </span>

                        {/* Event indicator (dots/badges) */}
                        {hasEvents && (
                          <div className="flex flex-col items-center gap-1 w-full pb-0.5">
                            {/* Glow Dot */}
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F6E05E] shadow-sm shadow-[#F6E05E]/50" />
                            
                            {/* Hover Event Title Tooltip */}
                            <div className="absolute bottom-full mb-2 bg-black/90 border border-white/10 text-[9px] font-black uppercase tracking-wider text-white px-2 py-1 rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 max-w-[150px] truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {dayEvents.map(ev => ev.title).join(', ')}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
