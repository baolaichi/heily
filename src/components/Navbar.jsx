import React, { useState, useEffect } from 'react';
import { 
  Heart, Gamepad2, CalendarHeart, Mail, Settings, Lock, 
  Bell, BellRing, ListTodo, Sprout, HeartPulse, ShieldCheck, 
  KeyRound, Eye, EyeOff, X 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCouple } from '../context/CoupleContext';
import { getNotificationPermission, requestNotificationPermission, sendLocalNotification, playNotificationChime } from '../utils/notificationService';

export default function Navbar({ activeTab, setActiveTab, onLockPage }) {
  const { coupleData, setIsSettingsOpen, myRole, setMyRole, switchRoleWithPin } = useCouple();
  const [notifyPermission, setNotifyPermission] = useState(() => getNotificationPermission());

  // Modal xác thực mã PIN khi muốn đổi vai trò sang người kia
  const [pinModalTarget, setPinModalTarget] = useState(null); // 'boy' | 'girl' | null
  const [pinInput, setPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isPinShaking, setIsPinShaking] = useState(false);

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

  const boyDisplayName = (coupleData.boy?.nickname || coupleData.boy?.name || 'Bug').trim().split(' ').pop();
  const girlDisplayName = (coupleData.girl?.nickname || coupleData.girl?.name || 'Heily').trim().split(' ').pop();

  const handleRoleClick = (targetRole) => {
    if (targetRole === myRole) {
      return;
    }
    // Muốn chuyển sang tài khoản đối phương -> Bắt buộc nhập mã PIN của đối phương
    setPinModalTarget(targetRole);
    setPinInput('');
    setPinError('');
    setShowPinText(false);
  };

  const handleConfirmSwitchPin = (e) => {
    e.preventDefault();
    if (!pinModalTarget) return;

    const res = switchRoleWithPin(pinModalTarget, pinInput);
    if (res && res.success) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
      });
      playNotificationChime();
      setPinModalTarget(null);
      setPinInput('');
      setPinError('');
    } else {
      setIsPinShaking(true);
      setPinError(res?.error || 'Mã PIN bảo mật chưa chính xác!');
      setTimeout(() => setIsPinShaking(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-2 sm:px-4 pt-safe pb-1.5 transition-all">
      <div className="max-w-5xl mx-auto glass-card rounded-2xl md:rounded-full px-2.5 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 border border-rose-200/80 shadow-md backdrop-blur-md">

        {/* Top row on Mobile / Left on Desktop: Brand Logo + Role Switcher + Action Buttons */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-3">
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
              <span className="text-[10px] text-rose-500 font-cursive truncate max-w-[90px] sm:max-w-none">
                {boyDisplayName} & {girlDisplayName} • Yêu thương ✨
              </span>
            </div>
          </div>

          {/* BỘ CHỌN VAI TRÒ TOÀN CỤC (GLOBAL ROLE SWITCHER - CÓ PHÂN QUYỀN PIN) */}
          <div className="flex items-center p-0.5 rounded-full bg-rose-100/90 border border-rose-200/90 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => handleRoleClick('boy')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
                myRole === 'boy'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs scale-102 cursor-default'
                  : 'text-slate-600 hover:text-rose-600 cursor-pointer'
              }`}
              title={myRole === 'boy' ? `Bạn đang đăng nhập: ${boyDisplayName} (Đã khóa quyền 🔒)` : `Chuyển sang ${boyDisplayName} (Cần mã PIN)`}
            >
              <span>👑</span>
              <span className="max-w-[42px] sm:max-w-[65px] truncate">{boyDisplayName}</span>
              {myRole === 'boy' && <ShieldCheck className="w-3 h-3 text-white shrink-0" />}
            </button>
            <button
              type="button"
              onClick={() => handleRoleClick('girl')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
                myRole === 'girl'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xs scale-102 cursor-default'
                  : 'text-slate-600 hover:text-pink-600 cursor-pointer'
              }`}
              title={myRole === 'girl' ? `Bạn đang đăng nhập: ${girlDisplayName} (Đã khóa quyền 🔒)` : `Chuyển sang ${girlDisplayName} (Cần mã PIN)`}
            >
              <span>🎀</span>
              <span className="max-w-[42px] sm:max-w-[65px] truncate">{girlDisplayName}</span>
              {myRole === 'girl' && <ShieldCheck className="w-3 h-3 text-white shrink-0" />}
            </button>
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

      {/* MODAL XÁC THỰC MÃ PIN BẢO MẬT PHÂN QUYỀN */}
      {pinModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className={`bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-rose-200 text-center space-y-4 animate-in zoom-in-95 transition-transform ${
            isPinShaking ? 'animate-shake' : ''
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base sm:text-lg text-slate-800">
                Xác Thực Phân Quyền 🔐
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn đang đăng nhập với tư cách <strong>{myRole === 'boy' ? boyDisplayName : girlDisplayName}</strong>.
                Để chuyển sang quyền của <strong>{pinModalTarget === 'boy' ? boyDisplayName : girlDisplayName}</strong>, vui lòng nhập mã PIN bảo mật của {pinModalTarget === 'boy' ? boyDisplayName : girlDisplayName}:
              </p>
            </div>

            <form onSubmit={handleConfirmSwitchPin} className="space-y-3">
              <div className="relative">
                <input
                  type={showPinText ? 'text' : 'password'}
                  autoFocus
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Nhập mã PIN..."
                  className="w-full text-center tracking-widest text-base font-bold py-2.5 px-10 rounded-2xl bg-rose-50/60 border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1"
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <p className="text-xs font-semibold text-rose-600 animate-in fade-in">
                  {pinError}
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                (Mẹo: PIN mặc định là <strong>1234</strong> cho Bug và <strong>5678</strong> cho Heily, có thể đổi trong Cài đặt).
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalTarget(null);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  Xác Nhận 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
