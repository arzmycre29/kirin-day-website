import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useState } from 'react';

export function FloatingMusicPlayer() {
    const { currentTrack, isPlaying, progress, currentTime, duration, volume, togglePlay, seek, setVolume, stopTrack } = useAudio();
    const [showVolume, setShowVolume] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Don't render if no track is loaded
    if (!currentTrack) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        seek(Math.max(0, Math.min(100, percent)));
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-14 h-14 rounded-full bg-[#F6E05E] shadow-lg shadow-[#F6E05E]/30 flex items-center justify-center hover:scale-110 transition-transform"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 text-[#1a2f47]" onClick={(e) => { e.stopPropagation(); togglePlay(); }} />
                    ) : (
                        <Play className="w-6 h-6 text-[#1a2f47] ml-0.5" onClick={(e) => { e.stopPropagation(); togglePlay(); }} />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-white/10" style={{ background: 'rgba(15, 26, 42, 0.95)' }}>
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                    {/* Cover Art */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={currentTrack.coverArt} alt={currentTrack.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Track Info */}
                    <div className="flex-shrink-0 min-w-0 w-32 md:w-48">
                        <h4 className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {currentTrack.title}
                        </h4>
                        <p className="text-xs text-white/60 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {currentTrack.artist}
                        </p>
                    </div>

                    {/* Play Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-[#F6E05E] flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-[#1a2f47]" />
                            ) : (
                                <Play className="w-5 h-5 text-[#1a2f47] ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs text-white/60 w-10 text-right" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {formatTime(currentTime)}
                        </span>
                        <div
                            className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group"
                            onClick={handleProgressClick}
                        >
                            <div
                                className="h-full bg-[#F6E05E] rounded-full relative transition-all"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F6E05E] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                            </div>
                        </div>
                        <span className="text-xs text-white/60 w-10" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {formatTime(duration)}
                        </span>
                    </div>

                    {/* Volume Control */}
                    <div className="hidden md:flex items-center gap-2 relative">
                        <button
                            onClick={() => setShowVolume(!showVolume)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            {volume === 0 ? (
                                <VolumeX className="w-5 h-5 text-white/60" />
                            ) : (
                                <Volume2 className="w-5 h-5 text-white/60" />
                            )}
                        </button>
                        {showVolume && (
                            <div className="absolute bottom-full right-0 mb-2 p-3 rounded-lg bg-[#0f1a2a] border border-white/10">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-24 accent-[#F6E05E]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={stopTrack}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/40 hover:text-white/60" />
                    </button>
                </div>
            </div>
        </div>
    );
}
