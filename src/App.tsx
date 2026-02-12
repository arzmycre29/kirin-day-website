import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { MembersPage } from './components/pages/MembersPage';
import { MusicPage } from './components/pages/MusicPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { ShopPage } from './components/pages/ShopPage';
import { MediaPage } from './components/pages/MediaPage';
import { AudioProvider } from './context/AudioContext';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { PageTransition } from './components/PageTransition';
import { useEffect } from 'react';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#1a2f47] pb-20" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <ScrollToTop />
        <Navigation />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/members" element={<PageTransition><MembersPage /></PageTransition>} />
            <Route path="/music" element={<PageTransition><MusicPage /></PageTransition>} />
            <Route path="/schedule" element={<PageTransition><SchedulePage /></PageTransition>} />
            <Route path="/media" element={<PageTransition><MediaPage /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><ShopPage /></PageTransition>} />
            <Route path="*" element={<PageTransition><HomePage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
        <Footer />
        <FloatingMusicPlayer />
      </div>
    </AudioProvider>
  );
}