import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'kirin_release_overlay_shown';
const AUTO_SLIDE_INTERVAL = 7000;

interface Banner {
    title: string;
    desktopImage: string | null;
    mobileImage: string | null;
    linkUrl: string;
    order: number;
}

export function ReleaseOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 left, 1 right
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStartX = useRef(0);

    // Fetch banners from Contentful
    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY)) return;

        const fetchBanners = async () => {
            try {
                const { client } = await import('../lib/contentful');
                const response = await client.getEntries({
                    content_type: 'overlayBanner',
                    order: ['fields.order'],
                });

                if (response.items.length > 0) {
                    const formatted: Banner[] = response.items.map((item: any) => {
                        const getUrl = (field: any) => {
                            const url = field?.fields?.file?.url;
                            return url ? (url.startsWith('//') ? 'https:' + url : url) : null;
                        };
                        return {
                            title: item.fields.title || 'Banner',
                            desktopImage: getUrl(item.fields.desktopImage),
                            mobileImage: getUrl(item.fields.mobileImage),
                            linkUrl: item.fields.linkUrl || '/',
                            order: item.fields.order || 0,
                        };
                    });
                    setBanners(formatted);
                }
            } catch (err) {
                console.warn('ReleaseOverlay: Contentful fetch failed', err);
            }

            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        };

        fetchBanners();
    }, []);

    // Auto-slide timer
    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (banners.length > 1) {
            timerRef.current = setInterval(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % banners.length);
            }, AUTO_SLIDE_INTERVAL);
        }
    }, [banners.length]);

    useEffect(() => {
        if (isVisible) resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isVisible, resetTimer]);

    const goTo = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        resetTimer();
    };

    const goNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        resetTimer();
    };

    const goPrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
        resetTimer();
    };

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem(SESSION_KEY, 'true');
        document.body.style.overflow = '';
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleBannerClick = (linkUrl: string) => {
        handleClose();
        if (linkUrl.startsWith('http')) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
        } else {
            navigate(linkUrl);
        }
    };

    // Swipe handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        dragStartX.current = e.clientX;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const diff = e.clientX - dragStartX.current;
        if (Math.abs(diff) > 60) {
            if (diff < 0) goNext();
            else goPrev();
        }
    };

    // Slide animation variants
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    const currentBanner = banners[currentIndex];

    // Placeholder when no Contentful data
    const PlaceholderBanner = ({ mobile = false }: { mobile?: boolean }) => (
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
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(144, 205, 244, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(246, 224, 94, 0.15) 0%, transparent 50%)',
                }}
            />
            <div className="relative text-center px-6 md:px-8">
                <p className="text-[#F6E05E] text-xs md:text-base font-bold tracking-[0.3em] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ✦ KIRIN DAY ✦
                </p>
                <h2 className={`font-black text-[#90CDF4] mb-4 ${mobile ? 'text-3xl' : 'text-4xl md:text-6xl'}`} style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '0 0 40px rgba(144, 205, 244, 0.4)' }}>
                    Coming Soon
                </h2>
                <p className="text-sm text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Tambahkan banner di Contentful (overlayBanner)
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

                    {/* Close Button */}
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
                        className="relative z-10 flex flex-col items-center gap-4 max-w-4xl w-full"
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Carousel Area */}
                        <div
                            className="relative w-full overflow-hidden rounded-2xl border-2 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20 cursor-pointer select-none"
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                        >
                            {/* Desktop Banner (landscape) */}
                            <div className="hidden md:block" style={{ aspectRatio: '16/9' }}>
                                <AnimatePresence initial={false} custom={direction} mode="wait">
                                    <motion.div
                                        key={currentIndex}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="w-full h-full absolute inset-0"
                                        onClick={() => currentBanner && handleBannerClick(currentBanner.linkUrl)}
                                    >
                                        {currentBanner?.desktopImage ? (
                                            <img
                                                src={currentBanner.desktopImage}
                                                alt={currentBanner.title}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <PlaceholderBanner />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Mobile Banner (portrait) */}
                            <div className="block md:hidden" style={{ aspectRatio: '9/16', maxHeight: '65vh' }}>
                                <AnimatePresence initial={false} custom={direction} mode="wait">
                                    <motion.div
                                        key={currentIndex}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="w-full h-full absolute inset-0"
                                        onClick={() => currentBanner && handleBannerClick(currentBanner.linkUrl)}
                                    >
                                        {currentBanner?.mobileImage ? (
                                            <img
                                                src={currentBanner.mobileImage}
                                                alt={currentBanner.title}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <PlaceholderBanner mobile />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Arrows (desktop only, 2+ banners) */}
                            {banners.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-all"
                                        aria-label="Previous banner"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-all"
                                        aria-label="Next banner"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dot Indicators (2+ banners) */}
                        {banners.length > 1 && (
                            <div className="flex items-center gap-2">
                                {banners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => goTo(idx)}
                                        className={`rounded-full transition-all duration-300 ${idx === currentIndex
                                                ? 'w-8 h-2.5 bg-[#F6E05E]'
                                                : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
                                            }`}
                                        aria-label={`Go to banner ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
