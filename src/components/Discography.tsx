import { Play, Pause, Music } from 'lucide-react';
import { useState } from 'react';

export function Discography() {
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);

  const tracks = [
    {
      title: 'Tenkaichi Moriagari',
      artist: 'Kirin Day',
      duration: '3:45',
      releaseDate: 'Jan 2026',
      type: 'Single',
    },
    {
      title: 'Bandung Kirameki',
      artist: 'Kirin Day',
      duration: '4:12',
      releaseDate: 'Oct 2023',
      type: 'Debut Single',
    },
    {
      title: 'Yume no Hajimari',
      artist: 'Kirin Day',
      duration: '3:58',
      releaseDate: 'May 2024',
      type: 'Single',
    },
    {
      title: 'Kizuna Forever',
      artist: 'Kirin Day feat. Bubu',
      duration: '4:30',
      releaseDate: 'Aug 2024',
      type: 'Collaboration',
    },
    {
      title: 'Mirai e no Chikai',
      artist: 'Kirin Day',
      duration: '3:22',
      releaseDate: 'Dec 2024',
      type: 'Single',
    }
  ];

  const togglePlay = (index: number) => {
    setPlayingTrack(playingTrack === index ? null : index);
  };

  return (
    <section id="music" className="py-32 px-6 bg-[#1a2f47]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-8 h-8 text-[#90CDF4]" />
            <h2 className="text-4xl md:text-5xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              DISCOGRAPHY
            </h2>
          </div>
          <div className="w-24 h-1 bg-[#F6E05E] mx-auto mb-4" />
          <p className="text-white/60 text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Our Musical Journey
          </p>
        </div>
        
        <div className="space-y-4">
          {tracks.map((track, index) => (
            <div 
              key={index}
              className="group relative p-6 rounded-lg border border-white/10 transition-all duration-300 hover:border-[#90CDF4]/30"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div className="flex items-center gap-5">
                {/* Play Button */}
                <button
                  onClick={() => togglePlay(index)}
                  className="relative w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/20 hover:border-[#90CDF4]/50 transition-all duration-300 hover:scale-110"
                >
                  {playingTrack === index ? (
                    <Pause className="w-5 h-5 text-[#90CDF4]" />
                  ) : (
                    <Play className="w-5 h-5 text-white/80 ml-0.5" />
                  )}
                </button>
                
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {track.title}
                      </h3>
                      <p className="text-sm text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {track.artist}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div 
                        className="inline-block px-2.5 py-1 rounded-md text-xs font-bold mb-1 border"
                        style={{ 
                          background: 'rgba(144, 205, 244, 0.1)',
                          color: '#90CDF4',
                          borderColor: 'rgba(144, 205, 244, 0.2)',
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
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#90CDF4] rounded-full transition-all duration-300"
                        style={{
                          width: playingTrack === index ? '45%' : '0%',
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
        
        {/* Spotify Link */}
        <div className="mt-16 text-center">
          <button 
            className="px-10 py-4 rounded-full font-black text-[#1a2f47] bg-[#F6E05E] hover:bg-[#F6E05E]/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#F6E05E]/20"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            LISTEN ON SPOTIFY
          </button>
        </div>
      </div>
    </section>
  );
}