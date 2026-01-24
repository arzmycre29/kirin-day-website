import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface Track {
    id: string;
    title: string;
    artist: string;
    coverArt: string;
    audioUrl: string | null;
    duration: string;
}

interface AudioContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    progress: number; // 0-100
    currentTime: number; // seconds
    duration: number; // seconds
    volume: number; // 0-1
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    pause: () => void;
    seek: (percent: number) => void;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}

interface AudioProviderProps {
    children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.7);

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            if (audio.duration) {
                setCurrentTime(audio.currentTime);
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    const playTrack = (track: Track) => {
        if (!audioRef.current || !track.audioUrl) return;

        // If same track, just toggle play
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        // Load new track
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        setCurrentTrack(track);
        setProgress(0);
        setCurrentTime(0);

        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(err => {
            console.error('Playback failed:', err);
        });
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.error('Playback failed:', err);
            });
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const seek = (percent: number) => {
        if (!audioRef.current || !duration) return;
        const newTime = (percent / 100) * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress(percent);
    };

    const setVolume = (vol: number) => {
        if (audioRef.current) {
            audioRef.current.volume = vol;
            setVolumeState(vol);
        }
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            progress,
            currentTime,
            duration,
            volume,
            playTrack,
            togglePlay,
            pause,
            seek,
            setVolume,
        }}>
            {children}
        </AudioContext.Provider>
    );
}
