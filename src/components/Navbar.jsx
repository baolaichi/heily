import React from 'react';
import { Heart, Gamepad2, CalendarHeart, Mail, Settings, Lock } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export default function Navbar({ activeTab, setActiveTab, onLockPage }) {
  const { coupleData, setIsSettingsOpen } = useCouple();

  const tabs = [
    { id: 'home', label: 'Trang Chủ', icon: Heart, shortLabel: 'Trang Chủ' },
    { id: 'game', label: 'Trò Chơi', icon: Gamepad2, shortLabel: 'Trò Chơi' },
    { id: 'timeline', label: 'Kỷ Niệm', icon: CalendarHeart, shortLabel: 'Kỷ Niệm' },
    { id: 'capsule', label: 'Hộp Thư', icon: Mail, shortLabel: 'Hộp Thư' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full px-2 sm:px-4 pt-1.5 sm:pt-3 pb-1.5 transition-all">
      <div className="max-w-5xl mx-auto glass-card rounded-2xl md:rounded-full px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 border border-rose-200/80 shadow-md backdrop-blur-md">

        {/* Top row on Mobile / Left on Desktop: Brand + Action Buttons */}
        <div className="w-full sm:w-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2 cursor-pointer group shrink-0"
          >
            <div className="relative flex -space-x-2 overflow-hidden items-center">
              <img
                src={coupleData.boy.avatar}
                alt={coupleData.boy.name}
                className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover group-hover:scale-105 transition"
              />
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] text-white z-10 shadow-xs">
                ❤️
              </div>
              <img
                src={coupleData.girl.avatar}
                alt={coupleData.girl.name}
                className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover group-hover:scale-105 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-serif font-bold text-xs sm:text-sm md:text-base text-slate-800 tracking-wide group-hover:text-rose-600 transition">
                {coupleData.boy.name.split(' ').pop()} & {coupleData.girl.name.split(' ').pop()}
              </span>
              <span className="text-[10px] sm:text-[11px] text-rose-500 sm:ml-1.5 font-cursive">
                Bí mật nhỏ💘
              </span>
            </div>
          </div>

          {/* Mobile Right Action Buttons (Settings & Lock) */}
          <div className="flex items-center space-x-1 sm:hidden">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100/70 transition"
              title="Cài đặt thông tin"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onLockPage && (
              <button
                onClick={onLockPage}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
                  className={`flex-1 sm:flex-initial relative flex items-center justify-center space-x-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${isActive
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200 scale-102'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/70'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                  <span className="text-[11px] sm:text-xs">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-rose-100 ml-1">
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
