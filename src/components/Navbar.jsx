import React, { useState, useEffect } from 'react';
import { 
  Heart, Gamepad2, CalendarHeart, Mail, Settings, Lock, 
  Bell, BellRing, ListTodo, Sprout, HeartPulse 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { getNotificationPermission, requestNotificationPermission, sendLocalNotification } from '../utils/notificationService';

export default function Navbar({ activeTab, setActiveTab, onLockPage }) {
  const { coupleData, setIsSettingsOpen } = useCouple();
  const [notifyPermission, setNotifyPermission] = useState(() => getNotificationPermission());

  useEffect(() => {
    setNotifyPermission(getNotificationPermission());
  }, []);

  const handleToggleNotification = async () => {
    if (notifyPermission === 'granted') {
      sendLocalNotification({
        title: '🔔 Thông báo đang hoạt động!',
        body: 'Bạn sẽ nhận được thông báo ngay khi có tin nhắn, status, kỷ niệm hay thư mới 💕',
      });
    } else {
      const granted = await requestNotificationPermission();
      if (granted) setNotifyPermission('granted');
    }
  };

  const tabs = [
    { id: 'home', label: 'Trang Chủ', icon: Heart, shortLabel: 'Trang Chủ' },
    { id: 'bucketlist', label: 'Ước Mơ', icon: ListTodo, shortLabel: 'Ước Mơ' },
    { id: 'plant', label: 'Cây Yêu', icon: Sprout, shortLabel: 'Cây Yêu' },
    { id: 'heartbeat', label: 'Chạm Tay', icon: HeartPulse, shortLabel: 'Chạm Tay' },
    { id: 'game', label: 'Trò Chơi', icon: Gamepad2, shortLabel: 'Trò Chơi' },
    { id: 'timeline', label: 'Kỷ Niệm', icon: CalendarHeart, shortLabel: 'Kỷ Niệm' },
    { id: 'capsule', label: 'Hộp Thư', icon: Mail, shortLabel: 'Hộp Thư' },
  ];

  const boyDisplayName = (coupleData.boy?.name || 'Chàng Trai').trim().split(' ').pop();
  const girlDisplayName = (coupleData.girl?.name || 'Cô Gái').trim().split(' ').pop();

  return (
    <header className="sticky top-0 z-30 w-full px-2 sm:px-4 pt-safe pb-1.5 transition-all">
      <div className="max-w-5xl mx-auto glass-card rounded-2xl md:rounded-full px-2.5 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 border border-rose-200/80 shadow-md backdrop-blur-md">

        {/* Top row on Mobile / Left on Desktop: Brand Logo + Action Buttons */}
        <div className="w-full sm:w-auto flex items-center justify-between">
          {/* Brand Logo & Website Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group shrink-0"
          >
            {/* Logo image B & H rose gold heart */}
            <div className="relative">
              <img
                src="/img/logo.png"
                alt="Bí Mật Đôi Ta"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Couple Avatars Mini */}
            <div className="relative hidden xs:flex -space-x-1.5 overflow-hidden items-center">
              <img
                src={coupleData.boy.avatar || '/images/avatar-boy.svg'}
                alt={boyDisplayName}
                className="inline-block h-6 w-6 rounded-full ring-1.5 ring-white object-cover"
              />
              <img
                src={coupleData.girl.avatar || '/images/avatar-girl.svg'}
                alt={girlDisplayName}
                className="inline-block h-6 w-6 rounded-full ring-1.5 ring-white object-cover"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-xs sm:text-base text-slate-800 tracking-wide group-hover:text-rose-600 transition">
                  Bí Mật Đôi Ta
                </span>
                <span className="text-[10px] text-rose-500 font-bold hidden sm:inline-block bg-rose-100/80 px-1.5 py-0.2 rounded-full">
                  B & H 💕
                </span>
              </div>
              <span className="text-[10px] text-rose-500 font-cursive truncate max-w-[130px] sm:max-w-none">
                {boyDisplayName} & {girlDisplayName} • Hành trình yêu thương ✨
              </span>
            </div>
          </div>

          {/* Mobile Right Action Buttons (Notification, Settings & Lock) */}
          <div className="flex items-center space-x-1 sm:hidden">
            <button
              onClick={handleToggleNotification}
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100/70 active:scale-95 transition relative"
              title={notifyPermission === 'granted' ? 'Thông báo điện thoại đang bật' : 'Bật thông báo điện thoại'}
            >
              {notifyPermission === 'granted' ? (
                <>
                  <Bell className="w-4 h-4 text-rose-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </>
              ) : (
                <BellRing className="w-4 h-4 text-amber-500 animate-bounce" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100/70 active:scale-95 transition"
              title="Cài đặt thông tin"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onLockPage && (
              <button
                onClick={onLockPage}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition"
                title="Khóa trang web"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Optimized for iPhone Xs, Xs Max, Samsung S25 FE) */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1 overflow-x-auto no-scrollbar">
          <nav className="flex items-center space-x-1 w-full sm:w-auto justify-between sm:justify-start">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-initial shrink-0 relative flex items-center justify-center space-x-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap min-h-[34px] ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200 scale-102'
                      : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 active:bg-rose-100/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                  <span className="text-[10.5px] sm:text-xs">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-rose-100 ml-1">
            <button
              onClick={handleToggleNotification}
              className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 text-xs font-semibold ${
                notifyPermission === 'granted'
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
              }`}
              title={notifyPermission === 'granted' ? 'Thông báo điện thoại đang bật' : 'Bật thông báo điện thoại'}
            >
              {notifyPermission === 'granted' ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thông Báo Bật</span>
                </>
              ) : (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  <span>Bật Thông Báo</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 transition flex items-center gap-1 text-xs font-semibold"
              title="Cài đặt thông tin"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài Đặt</span>
            </button>

            {onLockPage && (
              <button
                onClick={onLockPage}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Khóa trang web"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
