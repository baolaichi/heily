import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Lock, Unlock, Eye, EyeOff, Sparkles, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

const CORRECT_PASSWORD = 'B12@ao_H09!uong26';

export default function LockScreen({ onUnlock }) {
  const { coupleData } = useCouple();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleUnlock = (e) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      setIsSuccess(true);
      setErrorMsg('');

      // Confetti celebration
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
      });

      if (rememberMe) {
        localStorage.setItem('heily_authenticated', 'true');
      }

      setTimeout(() => {
        onUnlock();
      }, 1000);
    } else {
      setIsShaking(true);
      setErrorMsg('Mật khẩu chưa chính xác rồi bé ơi! Hãy nhập đúng chìa khóa riêng của hai đứa nha 💕');
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#fff0f3] via-[#fff5f5] to-[#fde2e4] relative overflow-hidden select-none">
      
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-300/30 rounded-full blur-3xl pointer-events-none animate-pulse-gentle" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl pointer-events-none animate-pulse-gentle" />

      {/* Main Lock Card */}
      <div className={`glass-card rounded-3xl p-5 sm:p-8 md:p-10 max-w-sm sm:max-w-md w-full border border-rose-200/90 shadow-2xl relative z-20 text-center transition-all ${
        isShaking ? 'animate-shake' : ''
      }`}>
        
        {/* Logo and Avatars */}
        <div className="flex flex-col items-center justify-center mb-4">
          {/* Logo B & H Rose Gold Heart */}
          <div className="relative mb-3">
            <img
              src="/img/logo.png"
              alt="Bí Mật Đôi Ta"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Avatars */}
          <div className="flex items-center justify-center -space-x-3">
            <img
              src={coupleData.boy.avatar}
              alt={coupleData.boy.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-white shadow-md ring-2 ring-rose-200"
            />
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center z-10 shadow-md">
              {isSuccess ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <img
              src={coupleData.girl.avatar}
              alt={coupleData.girl.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-white shadow-md ring-2 ring-pink-200"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-rose-100 px-3 py-0.5 rounded-full text-rose-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Khu Vườn Kỷ Niệm Riêng Tư</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
            Bí Mật Đôi Ta 💖
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Nhập mật khẩu riêng của hai đứa để mở khóa toàn bộ hành trình yêu thương
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
              <KeyRound className="w-4 h-4" />
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu bí mật..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
              className="w-full pl-10 pr-10 py-3 bg-white/90 border border-rose-200 rounded-2xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 font-medium transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-rose-500 transition"
              title={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Remember me option */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-400 w-3.5 h-3.5"
              />
              <span>Ghi nhớ trên thiết bị này</span>
            </label>
            <span className="text-[11px] text-rose-400 font-cursive">Mãi mãi một tình yêu ✨</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-3.5 rounded-2xl font-serif font-bold text-sm md:text-base text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isSuccess
                ? 'bg-emerald-500 shadow-emerald-200 scale-98'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:scale-102 active:scale-98 shadow-rose-300'
            }`}
          >
            {isSuccess ? (
              <>
                <ShieldCheck className="w-5 h-5 text-white animate-bounce" />
                <span>Mở Khóa Thành Công! Đang Vào...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>Mở Khóa Trái Tim</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer text */}
        <div className="mt-6 pt-4 border-t border-rose-100 text-[11px] text-slate-400">
          Trang web kỷ niệm riêng tư dành riêng cho {coupleData.boy.name} & {coupleData.girl.name} ❤️
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
