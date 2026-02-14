import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'kirin_release_overlay_shown';
const AUTO_SLIDE_INTERVAL = 7000;
const SWIPE_THRESHOLD = 50;

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
    const [direction, setDirection] = useState(0);
    const navigate = useNavigate();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const isDragging = useRef(false);

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
                    // Only show overlay if there are banners
                    setIsVisible(true);
                    document.body.style.overflow = 'hidden';
                }
                // If no banners → don't show overlay at all
            } catch (err) {
                console.warn('ReleaseOverlay: Contentful fetch failed', err);
                // Don't show overlay if fetch fails
            }
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
        if (isVisible && banners.length > 1) resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isVisible, resetTimer, banners.length]);

    const goTo = useCallback((index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        resetTimer();
    }, [currentIndex, resetTimer]);

    const goNext = useCallback(() => {
        if (banners.length <= 1) return;
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        resetTimer();
    }, [banners.length, resetTimer]);

    const goPrev = useCallback(() => {
        if (banners.length <= 1) return;
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
        resetTimer();
    }, [banners.length, resetTimer]);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem(SESSION_KEY, 'true');
        document.body.style.overflow = '';
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleBannerClick = () => {
        if (isDragging.current) return; // Don't navigate if was swiping
        const banner = banners[currentIndex];
        if (!banner) return;
        handleClose();
        if (banner.linkUrl.startsWith('http')) {
            window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
        } else {
            navigate(banner.linkUrl);
        }
    };

    // Touch/swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
        isDragging.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
        if (Math.abs(touchEndX.current - touchStartX.current) > 10) {
            isDragging.current = true;
        }
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) goNext(); // Swipe left → next
            else goPrev(); // Swipe right → prev
        }
        // Reset drag flag after a short delay so click handler can check it
        setTimeout(() => { isDragging.current = false; }, 50);
    };

    // Mouse drag handlers (for desktop)
    const handleMouseDown = (e: React.MouseEvent) => {
        touchStartX.current = e.clientX;
        touchEndX.current = e.clientX;
        isDragging.current = false;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        touchEndX.current = e.clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            isDragging.current = true;
            if (diff > 0) goNext();
            else goPrev();
        }
        setTimeout(() => { isDragging.current = false; }, 50);
    };

    // Pure slide animation — no fade, slides like connected panels
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
        }),
        center: {
            x: 0,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '-100%' : '100%',
        }),
    };

    const currentBanner = banners[currentIndex];

    // Don't render anything if not visible
    if (!isVisible || banners.length === 0) {
        return null;
    }

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
                        className="relative z-10 flex flex-col items-center max-w-4xl w-full max-h-[85vh]"
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Carousel Area */}
                        <div
                            className="relative w-full overflow-hidden rounded-2xl border-2 border-[#90CDF4]/30 shadow-2xl shadow-[#90CDF4]/20 cursor-pointer select-none"
                            style={{ touchAction: 'pan-y' }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onClick={handleBannerClick}
                        >
                            {/* Desktop Banner (landscape) */}
                            <div className="hidden md:block relative" style={{ aspectRatio: '16/9' }}>
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div
                                        key={currentIndex}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="absolute inset-0 w-full h-full z-[1]"
                                    >
                                        {currentBanner?.desktopImage ? (
                                            <img
                                                src={currentBanner.desktopImage}
                                                alt={currentBanner.title}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#1a2f47] flex items-center justify-center">
                                                <p className="text-white/50 text-sm">No desktop image</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Mobile Banner — natural proportions, max height constrained */}
                            <div className="block md:hidden relative" style={{ maxHeight: '70vh' }}>
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div
                                        key={currentIndex}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="w-full h-full z-[1] flex items-center justify-center"
                                    >
                                        {currentBanner?.mobileImage ? (
                                            <img
                                                src={currentBanner.mobileImage}
                                                alt={currentBanner.title}
                                                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-full h-64 bg-[#1a2f47] flex items-center justify-center rounded-lg">
                                                <p className="text-white/50 text-sm">No mobile image</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Arrows + Dots inside carousel (2+ banners) */}
                            {banners.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-all"
                                        aria-label="Previous banner"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white/80 hover:bg-black/60 hover:text-white transition-all"
                                        aria-label="Next banner"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Dot Indicators — inside carousel, bottom overlay */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10" onClick={(e) => e.stopPropagation()}>
                                        {banners.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => goTo(idx)}
                                                className={`rounded-full transition-all duration-300 ${idx === currentIndex
                                                    ? 'w-7 h-2.5 bg-[#F6E05E] shadow-lg shadow-[#F6E05E]/30'
                                                    : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'
                                                    }`}
                                                aria-label={`Go to banner ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
