import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { MembersPage } from './components/pages/MembersPage';
import { MemberDetailPage } from './components/pages/MemberDetailPage';
import { MusicPage } from './components/pages/MusicPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { MediaPage } from './components/pages/MediaPage';
import { BuyPage } from './components/pages/buy/BuyPage';
import { OrderStatusPage } from './components/pages/buy/OrderStatusPage';
import { AdminLoginPage } from './components/pages/buy/AdminLoginPage';
import { AdminOrdersPage } from './components/pages/buy/AdminOrdersPage';
import { AdminSettingsPage } from './components/pages/buy/AdminSettingsPage';
import { AdminDashboardPage } from './components/pages/buy/AdminDashboardPage';
import { AdminCheckInPage } from './components/pages/buy/AdminCheckInPage';
import { AdminStockPage } from './components/pages/buy/AdminStockPage';
import { ShopPageBackup } from './components/pages/ShopPageBackup';
import { AudioProvider } from './context/AudioContext';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { PageTransition } from './components/PageTransition';
import { ReleaseOverlay } from './components/ReleaseOverlay';
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
      <div className="min-h-screen bg-[#1a2f47]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <ScrollToTop />
        <Navigation />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/members" element={<PageTransition><MembersPage /></PageTransition>} />
            <Route path="/members/:name" element={<PageTransition><MemberDetailPage /></PageTransition>} />
            <Route path="/music" element={<PageTransition><MusicPage /></PageTransition>} />
            <Route path="/schedule" element={<PageTransition><SchedulePage /></PageTransition>} />
            <Route path="/media" element={<PageTransition><MediaPage /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><BuyPage /></PageTransition>} />
            <Route path="/buy" element={<PageTransition><BuyPage /></PageTransition>} />
            <Route path="/buy/status" element={<PageTransition><OrderStatusPage /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><AdminDashboardPage /></PageTransition>} />
            <Route path="/admin/login" element={<PageTransition><AdminLoginPage /></PageTransition>} />
            <Route path="/admin/orders" element={<PageTransition><AdminOrdersPage /></PageTransition>} />
            <Route path="/admin/event-po-setting" element={<PageTransition><AdminSettingsPage /></PageTransition>} />
            <Route path="/admin/check-in" element={<PageTransition><AdminCheckInPage /></PageTransition>} />
            <Route path="/admin/stock-setting" element={<PageTransition><AdminStockPage /></PageTransition>} />
            <Route path="/shop-legacy" element={<PageTransition><ShopPageBackup /></PageTransition>} />
            <Route path="*" element={<PageTransition><HomePage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
        <Footer />
        <FloatingMusicPlayer />
        <ReleaseOverlay />
      </div>
    </AudioProvider>
  );
}