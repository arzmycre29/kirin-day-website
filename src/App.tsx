import { useState } from 'react';
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


export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleNavigate = (page: string, id?: string) => {
    setCurrentPage(page);
    if (id) {
      setTargetId(id);
    } else {
      setTargetId(null);
    }
    window.scrollTo(0, 0); // Scroll to top on navigation
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage />;
      case 'members':
        return <MembersPage />;
      case 'music':
        return <MusicPage targetId={targetId} />;
      case 'schedule':
        return <SchedulePage targetId={targetId} />;
      case 'media':
        return <MediaPage />;
      case 'shop':
        return <ShopPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#1a2f47] pb-20" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        {renderPage()}
        <Footer onNavigate={handleNavigate} />
        <FloatingMusicPlayer />
      </div>
    </AudioProvider>
  );
}