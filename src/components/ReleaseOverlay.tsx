import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'kirin_release_overlay_shown';

export function ReleaseOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Only show once per browser session
        if (!sessionStorage.getItem(SESSION_KEY)) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem(SESSION_KEY, 'true');
        document.body.style.overflow = '';
    };

    const handleCTA = () => {
        handleClose();
        navigate('/schedule');
    };

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
                    style={{ zIndex: 2147483647 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Close Button */}
                    <motion.button
                        onClick={handleClose}
                        className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        aria-label="Close overlay"
                    >
                        <X className="w-6 h-6" />
                    </motion.button>

                    {/* Content Container */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-6 md:gap-8 max-w-4xl w-full"
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Poster — Desktop (landscape) */}
                        <div
                            className="hidden md:block w-full rounded-2xl overflow-hidden border-2 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20"
                            style={{ aspectRatio: '16/9' }}
                        >
                            {/* 
                TODO: Replace with Contentful image
                Desktop poster (landscape): <img src={desktopPosterUrl} alt="..." className="w-full h-full object-cover" />
              */}
                            <div
                                className="w-full h-full flex flex-col items-center justify-center relative"
                                style={{
                                    background: 'linear-gradient(135deg, #0f1a2a 0%, #1a2f47 30%, #152238 60%, #1a2f47 100%)',
                                }}
                            >
                                {/* Decorative glow */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: 'radial-gradient(ellipse at 50% 40%, rgba(144, 205, 244, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(246, 224, 94, 0.15) 0%, transparent 50%)',
                                    }}
                                />
                                <div className="relative text-center px-8">
                                    <p className="text-[#F6E05E] text-sm md:text-base font-bold tracking-[0.3em] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        ✦ NEW RELEASE ✦
                                    </p>
                                    <h2 className="text-4xl md:text-6xl font-black text-[#90CDF4] mb-4" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.4)' }}>
                                        KIRIN DAY
                                    </h2>
                                    <div className="w-24 h-1 bg-[#F6E05E] mx-auto mb-4" />
                                    <p className="text-xl md:text-2xl font-bold text-white/90" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        3rd Single Release
                                    </p>
                                    <p className="text-sm text-white/50 mt-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        Poster placeholder — akan diganti dari Contentful
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Poster — Mobile (portrait) */}
                        <div
                            className="block md:hidden w-full max-w-sm rounded-2xl overflow-hidden border-2 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20"
                            style={{ aspectRatio: '9/16' }}
                        >
                            {/* 
                TODO: Replace with Contentful image
                Mobile poster (portrait): <img src={mobilePosterUrl} alt="..." className="w-full h-full object-cover" />
              */}
                            <div
                                className="w-full h-full flex flex-col items-center justify-center relative"
                                style={{
                                    background: 'linear-gradient(180deg, #0f1a2a 0%, #1a2f47 25%, #152238 50%, #1a2f47 75%, #0f1a2a 100%)',
                                }}
                            >
                                {/* Decorative glow */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: 'radial-gradient(ellipse at 50% 30%, rgba(144, 205, 244, 0.35) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(246, 224, 94, 0.15) 0%, transparent 50%)',
                                    }}
                                />
                                <div className="relative text-center px-6">
                                    <p className="text-[#F6E05E] text-xs font-bold tracking-[0.3em] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        ✦ NEW RELEASE ✦
                                    </p>
                                    <h2 className="text-4xl font-black text-[#90CDF4] mb-4" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.4)' }}>
                                        KIRIN DAY
                                    </h2>
                                    <div className="w-20 h-1 bg-[#F6E05E] mx-auto mb-4" />
                                    <p className="text-lg font-bold text-white/90" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        3rd Single Release
                                    </p>
                                    <p className="text-xs text-white/50 mt-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        Poster placeholder
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            onClick={handleCTA}
                            className="flex items-center gap-3 px-10 py-4 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black text-lg hover:scale-105 hover:shadow-xl hover:shadow-[#F6E05E]/30 transition-all duration-300"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <Ticket className="w-5 h-5" />
                            LIHAT EVENT
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
