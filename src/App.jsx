import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CoupleProvider } from './context/CoupleContext';
import Navbar from './components/Navbar';
import LoveCounter from './components/LoveCounter';
import RomanticGame from './components/RomanticGame';
import MemoryTimeline from './components/MemoryTimeline';
import TimeCapsule from './components/TimeCapsule';
import CoupleBucketList from './components/CoupleBucketList';
import LovePlant from './components/LovePlant';
import HeartbeatTouch from './components/HeartbeatTouch';
import MusicPlayer from './components/MusicPlayer';
import FloatingHearts from './components/FloatingHearts';
import SettingsModal from './components/SettingsModal';
import LockScreen from './components/LockScreen';
import Footer from './components/Footer';
import CoupleChat from './components/CoupleChat';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [triggerAudioPlay, setTriggerAudioPlay] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('heily_authenticated') === 'true';
  });

  // Kích hoạt phát nhạc khi cô ấy hoàn thành trò chơi
  const handleGameCompleted = () => {
    setTriggerAudioPlay(true);
  };

  // Nút gửi tim yêu
  const handleLoveClick = () => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6'],
    });
  };

  // Khóa lại màn hình
  const handleLockPage = () => {
    localStorage.removeItem('heily_authenticated');
    setIsAuthenticated(false);
  };

  // Nếu chưa nhập mật khẩu bí mật, hiển thị màn hình khóa
  if (!isAuthenticated) {
    return (
      <LockScreen onUnlock={() => setIsAuthenticated(true)} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-rose-200 selection:text-rose-900 overflow-x-hidden">
      {/* Background Floating Ambient Petals and Click Particles */}
      <FloatingHearts />

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2.5 sm:px-4 pt-2 sm:pt-4 pb-24 sm:pb-16 relative z-20">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            <LoveCounter onNavigateToGame={() => setActiveTab('game')} />
          </div>
        )}

        {activeTab === 'game' && (
          <div className="animate-in fade-in duration-300">
            <RomanticGame onGameCompleted={handleGameCompleted} />
          </div>
        )}

        {activeTab === 'bucketlist' && (
          <div className="animate-in fade-in duration-300">
            <CoupleBucketList />
          </div>
        )}

        {activeTab === 'plant' && (
          <div className="animate-in fade-in duration-300">
            <LovePlant />
          </div>
        )}

        {activeTab === 'heartbeat' && (
          <div className="animate-in fade-in duration-300">
            <HeartbeatTouch />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-in fade-in duration-300">
            <MemoryTimeline />
          </div>
        )}

        {activeTab === 'capsule' && (
          <div className="animate-in fade-in duration-300">
            <TimeCapsule />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onTriggerLove={handleLoveClick} onLockPage={handleLockPage} />

      {/* Settings Modal (Tùy chỉnh ngày yêu, upload avatar, biệt danh) */}
      <SettingsModal onLockPage={handleLockPage} />

      {/* Real-time Couple Secret Chat (Hộp Chat Đôi Ta) */}
      <CoupleChat />

      {/* Floating Music Widget */}
      <MusicPlayer autoTriggerPlay={triggerAudioPlay} />
    </div>
  );
}

export default function App() {
  return (
    <CoupleProvider>
      <MainApp />
    </CoupleProvider>
  );
}
