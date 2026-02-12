import { Sparkles, Play, Calendar, Music, Image as ImageIcon, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSkeleton } from '../PageSkeleton';
import { useAudio } from '../../context/AudioContext';
import { HeroSection } from '../HeroSection';

// Fallback image for mascot
const kirinMascot = "https://via.placeholder.com/150/F6E05E/1a2f47?text=Kirin+Day";

export function HomePage() {
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const [loading, setLoading] = useState(true);
  const [latestEvents, setLatestEvents] = useState<any[]>([]);
  const [latestTracks, setLatestTracks] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<any | null>(null);
  const [pageContent, setPageContent] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const { client } = await import('../../lib/contentful');

        // 1. Fetch Page Sections (Hero, Into text)
        const sectionsPromise = client.getEntries({ content_type: 'pageSection' });

        // 2. Fetch Top 3 Upcoming Events
        // Note: In a real app, we'd filter date >= today. For now, just order by date.
        const eventsPromise = client.getEntries({
          content_type: 'event',
          order: ['fields.date'],
          limit: 3
        });

        // 3. Fetch Top 2 Latest Tracks
        const tracksPromise = client.getEntries({
          content_type: 'track',
          order: ['-fields.releaseDate'],
          limit: 2
        });

        // 4. Fetch Gallery Images (limit 6)
        const galleryPromise = client.getEntries({
          content_type: 'galleryImage',
          limit: 6,
          order: ['-sys.createdAt']
        });

        // 5. Fetch Featured Video
        const videoPromise = client.getEntries({
          content_type: 'video',
          'fields.isFeatured': true,
          limit: 1
        });

        const [sectionsRes, eventsRes, tracksRes, galleryRes, videoRes] = await Promise.all([
          sectionsPromise, eventsPromise, tracksPromise, galleryPromise, videoPromise
        ]);

        // Process Page Sections
        const contentMap: Record<string, any> = {};
        sectionsRes.items.forEach((item: any) => {
          contentMap[item.fields.slug] = {
            title: item.fields.title,
            content: item.fields.content?.content?.[0]?.content?.[0]?.value || '', // Simplify Rich Text extraction
            image: item.fields.image?.fields?.file?.url
              ? (item.fields.image.fields.file.url.startsWith('//') ? 'https:' + item.fields.image.fields.file.url : item.fields.image.fields.file.url)
              : null
          };
        });
        setPageContent(contentMap);

        // Process Events
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        setLatestEvents(eventsRes.items.map((item: any) => {
          const d = new Date(item.fields.date);
          return {
            id: item.sys.id,
            date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
            title: item.fields.title,
            venue: item.fields.venue,
            status: item.fields.ticketStatus || 'Coming Soon'
          };
        }));

        // Process Tracks with full data for playback
        const longMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        setLatestTracks(tracksRes.items.map((item: any) => {
          const d = new Date(item.fields.releaseDate);
          let audioUrl: string | null = null;
          if (item.fields.audioFile?.fields?.file?.url) {
            const rawUrl = item.fields.audioFile.fields.file.url as string;
            audioUrl = rawUrl.startsWith('//') ? 'https:' + rawUrl : rawUrl;
          }
          return {
            id: item.sys.id,
            title: item.fields.title,
            artist: item.fields.artist || 'Kirin Day',
            type: item.fields.type || 'Single',
            date: `${longMonthNames[d.getMonth()]} ${d.getFullYear()}`,
            coverArt: item.fields.coverArt?.fields?.file?.url
              ? (item.fields.coverArt.fields.file.url.startsWith('//') ? 'https:' + item.fields.coverArt.fields.file.url : item.fields.coverArt.fields.file.url)
              : 'https://via.placeholder.com/400',
            audioUrl: audioUrl,
            duration: item.fields.duration || '0:00'
          };
        }));

        // Process Gallery
        setGalleryImages(galleryRes.items.map((item: any) => ({
          image: item.fields.image?.fields?.file?.url
            ? (item.fields.image.fields.file.url.startsWith('//') ? 'https:' + item.fields.image.fields.file.url : item.fields.image.fields.file.url)
            : 'https://via.placeholder.com/400'
        })));

        // Process Video
        if (videoRes.items.length > 0) {
          const vid = videoRes.items[0] as any;
          setFeaturedVideo({
            title: vid.fields.title,
            description: vid.fields.description || '',
            thumbnail: vid.fields.thumbnail?.fields?.file?.url
              ? (vid.fields.thumbnail.fields.file.url.startsWith('//') ? 'https:' + vid.fields.thumbnail.fields.file.url : vid.fields.thumbnail.fields.file.url)
              : 'https://via.placeholder.com/640x360',
            youtubeUrl: vid.fields.youtubeUrl
          });
        }

        setLoading(false);

      } catch (error) {
        console.error("Error loading homepage:", error);
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Deep Linking Click Handlers
  const handleEventClick = (eventId: string) => {
    navigate('/schedule?id=' + eventId);
  };

  const handleMusicClick = (trackId: string) => {
    navigate('/music?id=' + trackId);
  };

  const handlePlayClick = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    if (track.audioUrl) {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverArt: track.coverArt,
        audioUrl: track.audioUrl,
        duration: track.duration,
      });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Using Component */}
      <HeroSection onStreamClick={() => navigate('/music')} />

      {/* Introduction Section */}
      <section className="py-32 px-6 bg-[#1a2f47]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-[#90CDF4] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {pageContent['about-intro']?.title || 'TENKAICHI MORIAGARI'}
              </h2>
              <div className="w-24 h-1 bg-[#F6E05E] mb-8" />

              {pageContent['about-intro'] ? (
                <p className="text-white/80 text-lg leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {pageContent['about-intro'].content}
                </p>
              ) : (
                <>
                  <p className="text-white/80 text-lg leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Kirin Day is a Japanese-style local idol group based in Bandung, Indonesia. With the theme "Tenkaichi Moriagari" (天下一盛り上がり - Ultimate High Energy), we bring vibrant performances that celebrate the fusion of Japanese idol culture and Indonesian spirit.
                  </p>
                  <p className="text-white/60 leading-relaxed mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Our journey began in May 2023, and since our official debut in October 2023, we've been creating unforgettable moments with our fans at Istana BEC and beyond. Join us as we continue to spread joy and energy through our music and performances!
                  </p>
                </>
              )}

              <button
                onClick={() => navigate('/about')}
                className="px-8 py-3 rounded-full border-2 border-[#90CDF4] text-[#90CDF4] font-bold hover:bg-[#90CDF4]/10 transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                LEARN MORE ABOUT US
              </button>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="rounded-xl overflow-hidden border-4 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20">
                <img
                  src={pageContent['about-intro']?.image || "https://images.unsplash.com/photo-1729915342948-bf4dd5280ce7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMGlkb2wlMjBjb25jZXJ0fGVufDF8fHx8MTc2ODk4ODAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"}
                  alt="Kirin Day Members"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F6E05E]/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-32 px-6 bg-[#152238]">
        <div className="max-w-7xl mx-auto">
          {/* Latest Schedule */}
          <div className="mb-24">
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-[#90CDF4]" />
              <h3 className="text-3xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                LATEST SCHEDULE
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestEvents.length > 0 ? latestEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  onClick={() => handleEventClick(event.id)}
                  className="p-6 rounded-xl border border-white/10 hover:border-[#90CDF4]/30 transition-all duration-300 cursor-pointer hover:scale-105"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <div className="text-2xl font-black text-[#F6E05E] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {event.date}
                  </div>
                  <h4 className="text-lg font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {event.title}
                  </h4>
                  <p className="text-sm text-white/60 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {event.venue}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${event.status === 'On Sale' ? 'bg-[#F6E05E] text-[#1a2f47]' : 'bg-white/10 text-white/60'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {event.status}
                  </span>
                </div>
              )) : <div className="text-white/50 col-span-3 text-center">No upcoming events found.</div>}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/schedule')}
                className="px-8 py-3 rounded-full border-2 border-[#90CDF4] text-[#90CDF4] font-bold hover:bg-[#90CDF4]/10 transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                VIEW FULL SCHEDULE
              </button>
            </div>
          </div>

          {/* Featured Discography */}
          <div className="mb-24">
            <div className="flex items-center gap-3 mb-8">
              <Music className="w-8 h-8 text-[#90CDF4]" />
              <h3 className="text-3xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                FEATURED DISCOGRAPHY
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {latestTracks.length > 0 ? latestTracks.map((track, index) => (
                <div
                  key={track.id || index}
                  onClick={() => handleMusicClick(track.id)}
                  className="group p-6 md:p-8 rounded-xl border border-white/10 hover:border-[#90CDF4]/30 transition-all duration-300 cursor-pointer hover:scale-105"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Play Button */}
                    <button
                      onClick={(e) => handlePlayClick(e, track)}
                      className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#90CDF4]/20 border-2 border-[#90CDF4] flex items-center justify-center hover:scale-110 hover:bg-[#F6E05E] hover:border-[#F6E05E] transition-all duration-300"
                    >
                      <Play className="w-5 h-5 md:w-7 md:h-7 text-[#90CDF4] group-hover:text-[#1a2f47] ml-1" />
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="inline-block px-3 py-1 rounded-md bg-[#F6E05E]/10 border border-[#F6E05E]/20 text-xs font-bold text-[#F6E05E] mb-2 md:mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {track.type}
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {track.title}
                      </h4>
                      <p className="text-xs md:text-sm text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Kirin Day • {track.date}
                      </p>
                    </div>

                    {/* Cover Art */}
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-white/10 group-hover:border-[#90CDF4]/30 transition-all duration-300">
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
              )) : <div className="text-white/50 col-span-2 text-center">No recent releases found.</div>}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/music')}
                className="px-8 py-3 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black hover:scale-105 transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                EXPLORE ALL MUSIC
              </button>
            </div>
          </div>

          {/* Stage Gallery */}
          <div className="mb-24">
            <div className="flex items-center gap-3 mb-8">
              <ImageIcon className="w-8 h-8 text-[#90CDF4]" />
              <h3 className="text-3xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                STAGE GALLERY
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.length > 0 ? galleryImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#90CDF4]/50 transition-all duration-300"
                >
                  <img
                    src={img.image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2f47]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )) : <div className="text-white/50 text-center col-span-full">No gallery images found.</div>}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/media')}
                className="px-8 py-3 rounded-full border-2 border-[#90CDF4] text-[#90CDF4] font-bold hover:bg-[#90CDF4]/10 transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                VIEW FULL GALLERY
              </button>
            </div>
          </div>

          {/* Music Video Spotlight */}
          {featuredVideo && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Video className="w-8 h-8 text-[#90CDF4]" />
                <h3 className="text-3xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  MUSIC VIDEO SPOTLIGHT
                </h3>
              </div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#F6E05E]/30 shadow-2xl shadow-[#F6E05E]/20">
                <div className="relative aspect-video bg-[#1a2f47]">
                  <img
                    src={featuredVideo.thumbnail}
                    alt="Music Video"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#1a2f47]/40 flex items-center justify-center">
                    <a href={featuredVideo.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-full bg-[#F6E05E] flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-2xl shadow-[#F6E05E]/50">
                      <Play className="w-10 h-10 text-[#1a2f47] ml-1" />
                    </a>
                  </div>
                </div>
                <div className="p-6 bg-[#152238]/80 backdrop-blur-sm">
                  <h4 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {featuredVideo.title}
                  </h4>
                  <p className="text-sm text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {featuredVideo.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
