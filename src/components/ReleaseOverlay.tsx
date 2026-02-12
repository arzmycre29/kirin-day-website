import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'kirin_release_overlay_shown';

interface OverlayData {
    desktopPoster: string | null;
    mobilePoster: string | null;
}

export function ReleaseOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [posterData, setPosterData] = useState<OverlayData>({ desktopPoster: null, mobilePoster: null });
    const navigate = useNavigate();

    useEffect(() => {
        // Only show once per browser session
        if (sessionStorage.getItem(SESSION_KEY)) return;

        // Fetch poster from Contentful
        const fetchOverlay = async () => {
            try {
                const { client } = await import('../lib/contentful');
                const response = await client.getEntries({
                    content_type: 'releaseOverlay',
                    limit: 1,
                });

                if (response.items.length > 0) {
                    const item = response.items[0] as any;
                    const getUrl = (field: any) => {
                        const url = field?.fields?.file?.url;
                        return url ? (url.startsWith('//') ? 'https:' + url : url) : null;
                    };
                    setPosterData({
                        desktopPoster: getUrl(item.fields.desktopPoster),
                        mobilePoster: getUrl(item.fields.mobilePoster),
                    });
                }
            } catch (err) {
                console.warn('ReleaseOverlay: Contentful fetch failed, using placeholders', err);
            }

            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        };

        fetchOverlay();
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

    // Placeholder content for when no Contentful image is available
    const PosterPlaceholder = ({ mobile = false }: { mobile?: boolean }) => (
        <div
            className="w-full h-full flex flex-col items-center justify-center relative"
            style={{
                background: mobile
                    ? 'linear-gradient(180deg, #0f1a2a 0%, #1a2f47 25%, #152238 50%, #1a2f47 75%, #0f1a2a 100%)'
                    : 'linear-gradient(135deg, #0f1a2a 0%, #1a2f47 30%, #152238 60%, #1a2f47 100%)',
            }}
        >
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background: mobile
                        ? 'radial-gradient(ellipse at 50% 30%, rgba(144, 205, 244, 0.35) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(246, 224, 94, 0.15) 0%, transparent 50%)'
                        : 'radial-gradient(ellipse at 50% 40%, rgba(144, 205, 244, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(246, 224, 94, 0.15) 0%, transparent 50%)',
                }}
            />
            <div className="relative text-center px-6 md:px-8">
                <p className="text-[#F6E05E] text-xs md:text-base font-bold tracking-[0.3em] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ✦ NEW RELEASE ✦
                </p>
                <h2 className={`font-black text-[#90CDF4] mb-4 ${mobile ? 'text-4xl' : 'text-4xl md:text-6xl'}`} style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.4)' }}>
                    KIRIN DAY
                </h2>
                <div className={`${mobile ? 'w-20' : 'w-24'} h-1 bg-[#F6E05E] mx-auto mb-4`} />
                <p className={`font-bold text-white/90 ${mobile ? 'text-lg' : 'text-xl md:text-2xl'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    3rd Single Release
                </p>
            </div>
        </div>
    );

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

                    {/* Close Button — z-50 to stay above content */}
                    <motion.button
                        onClick={handleClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-300"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        aria-label="Close overlay"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    {/* Content Container */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-5 md:gap-8 max-w-4xl w-full"
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
                            {posterData.desktopPoster ? (
                                <img
                                    src={posterData.desktopPoster}
                                    alt="Kirin Day - 3rd Single Release"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <PosterPlaceholder />
                            )}
                        </div>

                        {/* Poster — Mobile (portrait) */}
                        <div
                            className="block md:hidden w-full max-w-xs mx-auto rounded-2xl overflow-hidden border-2 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20"
                            style={{ aspectRatio: '9/16', maxHeight: '65vh' }}
                        >
                            {posterData.mobilePoster ? (
                                <img
                                    src={posterData.mobilePoster}
                                    alt="Kirin Day - 3rd Single Release"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <PosterPlaceholder mobile />
                            )}
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            onClick={handleCTA}
                            className="flex items-center gap-3 px-8 py-3 md:px-10 md:py-4 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black text-base md:text-lg hover:scale-105 hover:shadow-xl hover:shadow-[#F6E05E]/30 transition-all duration-300"
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
