import React from 'react';
import { Heart, Sparkles, Settings, Lock } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export default function Footer({ onTriggerLove, onLockPage }) {
  const { coupleData, setIsSettingsOpen } = useCouple();

  return (
    <footer className="mt-16 border-t border-rose-200/60 py-8 px-4 text-center relative z-20">
      <div className="max-w-md mx-auto space-y-3">
        {/* Heart Tap Button & Actions */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onTriggerLove}
            className="group inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-rose-50 border border-rose-200 shadow-sm text-xs font-semibold text-rose-600 transition active:scale-90"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 group-hover:scale-125 transition" />
            <span>Chạm để gửi một ngàn tim yêu ❤️</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-full bg-white/80 hover:bg-rose-50 border border-rose-200 text-rose-500 hover:text-rose-700 transition shadow-sm"
            title="Tùy chỉnh ngày yêu & thông tin đôi"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onLockPage && (
            <button
              onClick={onLockPage}
              className="p-2.5 rounded-full bg-white/80 hover:bg-rose-50 border border-rose-200 text-slate-400 hover:text-rose-600 transition shadow-sm"
              title="Khóa trang web lại"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center pt-2">
          <img
            src="/img/logo.png"
            alt="Bí Mật Đôi Ta"
            className="w-10 h-10 object-contain drop-shadow-sm mb-1.5 hover:scale-105 transition"
          />
          <h4 className="font-serif font-bold text-slate-800 text-sm sm:text-base">
            Bí Mật Đôi Ta 💕
          </h4>
        </div>

        <p className="font-serif text-slate-600 text-xs sm:text-sm">
          {coupleData.boy.name} & {coupleData.girl.name}
        </p>

        <p className="text-xs text-slate-500 font-light flex items-center justify-center gap-1 flex-wrap">
          <span>Kỷ niệm tình yêu ngọt ngào</span>
          <span>•</span>
          <span>Dành trọn cả trái tim cho {coupleData.girl.nickname || coupleData.girl.name}</span>
        </p>

        <div className="text-[11px] text-rose-400 font-cursive">
          Hành trình yêu thương mãi mãi bền chặt ✨
        </div>
      </div>
    </footer>
  );
}
