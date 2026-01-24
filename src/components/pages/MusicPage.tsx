import { Play, Pause, Music, ExternalLink, Heart, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  releaseDate: string;
  type: string;
  coverArt: string;
  lyrics: string;
  audioUrl: string | null;
}

interface MusicPageProps {
  targetId?: string | null;
}

export function MusicPage({ targetId }: MusicPageProps) {
  const { currentTrack, isPlaying, progress, playTrack } = useAudio();
  const [selectedTrack, setSelectedTrack] = useState<number>(0);

  // State for tracks
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { client } = await import('../../lib/contentful');
        const response = await client.getEntries({
          content_type: 'track',
          order: ['-fields.releaseDate'], // Newest first
        });

        const formattedTracks: Track[] = response.items.map((item: any) => {
          const dateObj = new Date(item.fields.releaseDate);
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

          // Get audio file URL from Contentful asset
          let audioUrl: string | null = null;
          if (item.fields.audioFile?.fields?.file?.url) {
            const rawUrl = item.fields.audioFile.fields.file.url as string;
            audioUrl = rawUrl.startsWith('//') ? 'https:' + rawUrl : rawUrl;
          }

          return {
            id: item.sys.id,
            title: item.fields.title || 'Untitled',
            artist: item.fields.artist || 'Kirin Day',
            duration: item.fields.duration || '0:00',
            releaseDate: `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
            type: item.fields.type || 'Single',
            coverArt: item.fields.coverArt?.fields?.file?.url
              ? (item.fields.coverArt.fields.file.url.startsWith('//') ? 'https:' + item.fields.coverArt.fields.file.url : item.fields.coverArt.fields.file.url)
              : 'https://via.placeholder.com/400',
            // Use lyricsSong (Long Text) field instead of lyrics (Rich Text)
            lyrics: item.fields.lyricsSong || 'Lyrics not available.',
            audioUrl: audioUrl,
          };
        });

        setTracks(formattedTracks);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching music:", err);
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Handle Deep Linking
  useEffect(() => {
    if (targetId && !loading && tracks.length > 0) {
      const index = tracks.findIndex(t => t.id === targetId);
      if (index !== -1) {
        setSelectedTrack(index);
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optional: Highlight effect
            element.classList.add('border-[#F6E05E]');
            setTimeout(() => element.classList.remove('border-[#F6E05E]'), 2000);
          }
        }, 500);
      }
    }
  }, [targetId, loading, tracks]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 bg-[#1a2f47] flex items-center justify-center">
        <div className="text-2xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          LOADING DISCOGRAPHY...
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 bg-[#1a2f47] flex items-center justify-center">
        <div className="text-xl text-white/70">No releases found yet.</div>
      </div>
    );
  }

  const handlePlayTrack = (track: Track, index: number) => {
    if (!track.audioUrl) {
      alert('Audio file not available for this track.');
      return;
    }
    setSelectedTrack(index);
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverArt: track.coverArt,
      audioUrl: track.audioUrl,
      duration: track.duration,
    });
  };

  // Check if a track is currently playing
  const isTrackPlaying = (trackId: string) => {
    return currentTrack?.id === trackId && isPlaying;
  };

  // Get progress for a specific track (only show progress if it's the current track)
  const getTrackProgress = (trackId: string) => {
    return currentTrack?.id === trackId ? progress : 0;
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-[#1a2f47]">
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

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Music className="w-10 h-10 text-[#90CDF4]" />
            <h1 className="text-5xl md:text-6xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.3)' }}>
              DISCOGRAPHY
            </h1>
          </div>
          <div className="w-32 h-1 bg-[#F6E05E] mx-auto mb-6" />
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Our Musical Journey • From debut to latest releases, explore the songs that define Kirin Day
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Track List */}
          <div className="lg:col-span-2 space-y-4">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                id={track.id}
                onClick={() => setSelectedTrack(index)}
                className={`group relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer scroll-mt-32 ${selectedTrack === index
                  ? 'border-[#90CDF4]/50 shadow-lg shadow-[#90CDF4]/20'
                  : 'border-white/10 hover:border-[#90CDF4]/30'
                  }`}
                style={{
                  background: selectedTrack === index
                    ? 'rgba(144, 205, 244, 0.05)'
                    : 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div className="flex items-center gap-5">
                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTrack(track, index);
                    }}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 ${track.audioUrl
                      ? 'bg-white/5 border-white/20 hover:border-[#F6E05E]/50'
                      : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    disabled={!track.audioUrl}
                  >
                    {isTrackPlaying(track.id) ? (
                      <Pause className="w-6 h-6 text-[#F6E05E]" />
                    ) : (
                      <Play className="w-6 h-6 text-white/80 ml-0.5" />
                    )}
                  </button>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {track.title}
                        </h3>
                        <p className="text-sm text-white/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {track.artist}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="inline-block px-3 py-1 rounded-md text-xs font-bold mb-1 border"
                          style={{
                            background: track.type.includes('Latest') || track.type.includes('Title')
                              ? 'rgba(246, 224, 94, 0.1)'
                              : 'rgba(144, 205, 244, 0.1)',
                            color: track.type.includes('Latest') || track.type.includes('Title')
                              ? '#F6E05E'
                              : '#90CDF4',
                            borderColor: track.type.includes('Latest') || track.type.includes('Title')
                              ? 'rgba(246, 224, 94, 0.2)'
                              : 'rgba(144, 205, 244, 0.2)',
                            fontFamily: 'Montserrat, sans-serif'
                          }}
                        >
                          {track.type}
                        </div>
                        <p className="text-xs text-white/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {track.releaseDate}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar - Synced with global audio state */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F6E05E] rounded-full transition-all duration-100"
                          style={{
                            width: `${getTrackProgress(track.id)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/40 flex-shrink-0 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {track.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lyrics Panel */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-32 p-8 rounded-2xl border-2 border-white/10"
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
            >
              {/* Cover Art */}
              <div className="relative rounded-xl overflow-hidden mb-6 border-2 border-[#F6E05E]/30 shadow-lg shadow-[#F6E05E]/20">
                <img
                  src={tracks[selectedTrack].coverArt}
                  alt={tracks[selectedTrack].title}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2f47]/80 to-transparent" />
                {/* Play overlay */}
                {tracks[selectedTrack].audioUrl && (
                  <button
                    onClick={() => handlePlayTrack(tracks[selectedTrack], selectedTrack)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#F6E05E] flex items-center justify-center hover:scale-110 transition-transform">
                      {isTrackPlaying(tracks[selectedTrack].id) ? (
                        <Pause className="w-8 h-8 text-[#1a2f47]" />
                      ) : (
                        <Play className="w-8 h-8 text-[#1a2f47] ml-1" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Track Details */}
              <h4 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tracks[selectedTrack].title}
              </h4>
              <p className="text-sm text-white/60 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {tracks[selectedTrack].artist}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all">
                  <Heart className="w-5 h-5 text-white/60 mx-auto" />
                </button>
                <button className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 hover:border-[#90CDF4]/30 transition-all">
                  <Share2 className="w-5 h-5 text-white/60 mx-auto" />
                </button>
              </div>

              {/* Lyrics - Scrollable */}
              <div>
                <h5 className="text-sm font-black text-[#90CDF4] mb-4 tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  LYRICS
                </h5>
                <div
                  className="p-4 rounded-lg border border-white/10 h-80 overflow-y-auto custom-scrollbar"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <p className="text-sm text-white/80 leading-loose whitespace-pre-line" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {tracks[selectedTrack].lyrics}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Links */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-black text-white mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            LISTEN ON YOUR FAVORITE PLATFORM
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://open.spotify.com/intl-id/artist/6IAoSbqPle4G88iVyRjjs4?si=KAAjjndrS-mPVBvWih4_6g" target="_blank" rel="noopener noreferrer" className="group px-8 py-4 rounded-full font-black transition-all duration-300 hover:scale-105 border-2 border-[#F6E05E] hover:bg-[#F6E05E]/10 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif', color: '#F6E05E' }}>
              <Music className="w-5 h-5" />
              SPOTIFY
              <ExternalLink className="w-4 h-4" />
            </a>
            <a href="https://music.apple.com/id/artist/kirin-day/1712927155" target="_blank" rel="noopener noreferrer" className="group px-8 py-4 rounded-full font-black transition-all duration-300 hover:scale-105 border-2 border-[#90CDF4] hover:bg-[#90CDF4]/10 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif', color: '#90CDF4' }}>
              <Music className="w-5 h-5" />
              APPLE MUSIC
              <ExternalLink className="w-4 h-4" />
            </a>
            <a href="https://music.youtube.com/channel/UC-8FRDfVsfw9-VPDh1yhcWg" target="_blank" rel="noopener noreferrer" className="group px-8 py-4 rounded-full font-black transition-all duration-300 hover:scale-105 border-2 border-white/30 hover:bg-white/10 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif', color: 'white' }}>
              <Music className="w-5 h-5" />
              YOUTUBE MUSIC
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
