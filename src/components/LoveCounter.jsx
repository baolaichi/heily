import React, { useState, useEffect } from 'react';
import {
  Heart, Sparkles, Gift, ArrowRight, Flame,
  Edit3, Calendar, ChevronDown, ChevronUp, Plus, Clock, Music
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { formatVietnameseFull, formatVietnameseShort } from '../utils/dateUtils';
import AvatarStatusModal from './AvatarStatusModal';

export default function LoveCounter({ onNavigateToGame }) {
  const { coupleData, setIsSettingsOpen, getClosestEvent, playTrackDirectly } = useCouple();
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetRole, setStatusTargetRole] = useState('boy');

  const boyStatus = coupleData?.boy?.status || {};
  const girlStatus = coupleData?.girl?.status || {};

  // Tính toán thời gian yêu nhau theo giây
  const [elapsed, setElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
  });

  // Sự kiện gần nhất
  const closestEvent = getClosestEvent() || {
    title: "Sự Kiện Đặc Biệt",
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    description: "Sắp đến ngày hẹn ước ngọt ngào của hai đứa!",
    icon: "🎁",
  };

  // Tính toán đếm ngược đến sự kiện gần nhất
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isToday: false,
  });

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const start = new Date(coupleData.startDate);
      const targetDate = new Date(closestEvent.date);

      // Love counter (bên nhau bao lâu)
      const diffLove = Math.max(0, now.getTime() - start.getTime());
      const totalSecondsLove = Math.floor(diffLove / 1000);
      const days = Math.floor(totalSecondsLove / (3600 * 24));
      const hours = Math.floor((totalSecondsLove % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSecondsLove % 3600) / 60);
      const seconds = totalSecondsLove % 60;

      setElapsed({
        days,
        hours,
        minutes,
        seconds,
        totalDays: days,
      });

      // Countdown to closest event
      const diffEvent = targetDate.getTime() - now.getTime();
      if (diffEvent > 0) {
        const totalSecondsEvent = Math.floor(diffEvent / 1000);
        const eventDays = Math.floor(totalSecondsEvent / (3600 * 24));
        const eventHours = Math.floor((totalSecondsEvent % (3600 * 24)) / 3600);
        const eventMinutes = Math.floor((totalSecondsEvent % 3600) / 60);
        const eventSeconds = totalSecondsEvent % 60;
        setCountdown({
          days: eventDays,
          hours: eventHours,
          minutes: eventMinutes,
          seconds: eventSeconds,
          isToday: eventDays === 0 && eventHours < 24,
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true });
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [coupleData.startDate, closestEvent.date]);

  // Sắp xếp danh sách toàn bộ các sự kiện
  const allEventsSorted = [...(coupleData.events || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6 sm:space-y-10 py-2 sm:py-4 max-w-4xl mx-auto px-1 sm:px-0">

      {/* Hero Section: Couple Avatars & Beating Heart */}
      <div className="relative text-center pt-2 sm:pt-4">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-72 sm:h-72 bg-rose-200/50 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center space-x-3 sm:space-x-6 md:space-x-10 mb-3 sm:mb-4">
          
          {/* Chàng trai */}
          <div className="flex flex-col items-center group relative pt-4 sm:pt-6">
            
            {/* Thought Bubble - Chàng trai (Nổi lơ lửng không làm vỡ khung tròn) */}
            {boyStatus?.text ? (
              <div
                onClick={() => {
                  setStatusTargetRole('boy');
                  setIsStatusModalOpen(true);
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20 cursor-pointer animate-bounce-gentle transition hover:scale-105 active:scale-95"
                title="Chạm để đổi suy nghĩ / status hôm nay"
              >
                <div className="bg-white/95 hover:bg-rose-50/95 border border-rose-200/90 shadow-md shadow-rose-200/50 rounded-2xl px-2.5 sm:px-3 py-1 flex items-center gap-1.5 whitespace-nowrap text-slate-800">
                  <span className="text-xs sm:text-sm">{boyStatus.emoji || '💭'}</span>
                  <span className="font-semibold text-[10px] sm:text-xs text-slate-700 max-w-[90px] sm:max-w-[130px] truncate">
                    {boyStatus.text}
                  </span>
                  {boyStatus.songTitle && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (boyStatus.song) playTrackDirectly(boyStatus.song);
                      }}
                      className="text-[9px] text-rose-500 font-bold flex items-center gap-0.5 max-w-[70px] sm:max-w-[100px] truncate hover:underline"
                      title={`Phát: ${boyStatus.songTitle}`}
                    >
                      <Music className="w-2.5 h-2.5 animate-spin-slow shrink-0" />
                      <span className="truncate">{boyStatus.songTitle}</span>
                    </span>
                  )}
                </div>
                <div className="w-2 h-2 bg-white border-r border-b border-rose-200 rotate-45 mx-auto -mt-1 shadow-2xs" />
              </div>
            ) : (
              <button
                onClick={() => {
                  setStatusTargetRole('boy');
                  setIsStatusModalOpen(true);
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-rose-50 border border-rose-200 shadow-xs px-2 py-0.5 rounded-full text-[10px] text-slate-600 hover:text-rose-600 flex items-center gap-1 transition hover:scale-105 whitespace-nowrap"
                title="Thêm suy nghĩ / status"
              >
                <span>💭</span>
                <span className="hidden sm:inline font-medium">Nghĩ gì thế?</span>
              </button>
            )}

            {/* Avatar Tròn Như Ban Đầu */}
            <div 
              onClick={() => {
                setStatusTargetRole('boy');
                setIsStatusModalOpen(true);
              }}
              className="relative p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-rose-400 to-rose-200 shadow-lg group-hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <img
                src={coupleData.boy.avatar}
                alt={coupleData.boy.name}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-3 sm:border-4 border-white shadow-inner"
              />
              <span className="absolute bottom-0.5 right-0.5 bg-white p-0.5 sm:p-1 rounded-full shadow text-[10px] sm:text-xs">
                👑
              </span>
            </div>
            <h3 className="mt-2 sm:mt-3 font-serif font-bold text-slate-800 text-xs sm:text-base md:text-lg truncate max-w-[100px] sm:max-w-none">
              {coupleData.boy.name}
            </h3>
            <span className="text-[10px] sm:text-xs text-rose-500 font-medium truncate max-w-[100px] sm:max-w-none">
              {coupleData.boy.nickname}
            </span>
          </div>

          {/* Trái tim kết nối */}
          <div className="flex flex-col items-center -mt-4 sm:-mt-6 shrink-0 pt-4 sm:pt-6">
            <div className="relative">
              <Heart className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 text-rose-500 fill-rose-500 animate-pulse-gentle drop-shadow-md" />
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 absolute -top-1 -right-1 sm:-right-2 animate-bounce" />
            </div>
            <span className="mt-1 sm:mt-2 text-[9px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 bg-rose-100/90 text-rose-700 rounded-full shadow-xs">
              In Love
            </span>
          </div>

          {/* Cô gái */}
          <div className="flex flex-col items-center group relative pt-4 sm:pt-6">
            
            {/* Thought Bubble - Cô gái (Nổi lơ lửng không làm vỡ khung tròn) */}
            {girlStatus?.text ? (
              <div
                onClick={() => {
                  setStatusTargetRole('girl');
                  setIsStatusModalOpen(true);
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20 cursor-pointer animate-bounce-gentle transition hover:scale-105 active:scale-95"
                title="Chạm để đổi suy nghĩ / status hôm nay"
              >
                <div className="bg-white/95 hover:bg-pink-50/95 border border-pink-200/90 shadow-md shadow-pink-200/50 rounded-2xl px-2.5 sm:px-3 py-1 flex items-center gap-1.5 whitespace-nowrap text-slate-800">
                  <span className="text-xs sm:text-sm">{girlStatus.emoji || '💭'}</span>
                  <span className="font-semibold text-[10px] sm:text-xs text-slate-700 max-w-[90px] sm:max-w-[130px] truncate">
                    {girlStatus.text}
                  </span>
                  {girlStatus.songTitle && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (girlStatus.song) playTrackDirectly(girlStatus.song);
                      }}
                      className="text-[9px] text-pink-500 font-bold flex items-center gap-0.5 max-w-[70px] sm:max-w-[100px] truncate hover:underline"
                      title={`Phát: ${girlStatus.songTitle}`}
                    >
                      <Music className="w-2.5 h-2.5 animate-spin-slow shrink-0" />
                      <span className="truncate">{girlStatus.songTitle}</span>
                    </span>
                  )}
                </div>
                <div className="w-2 h-2 bg-white border-r border-b border-pink-200 rotate-45 mx-auto -mt-1 shadow-2xs" />
              </div>
            ) : (
              <button
                onClick={() => {
                  setStatusTargetRole('girl');
                  setIsStatusModalOpen(true);
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-pink-50 border border-pink-200 shadow-xs px-2 py-0.5 rounded-full text-[10px] text-slate-600 hover:text-pink-600 flex items-center gap-1 transition hover:scale-105 whitespace-nowrap"
                title="Thêm suy nghĩ / status"
              >
                <span>💭</span>
                <span className="hidden sm:inline font-medium">Nghĩ gì thế?</span>
              </button>
            )}

            {/* Avatar Tròn Như Ban Đầu */}
            <div 
              onClick={() => {
                setStatusTargetRole('girl');
                setIsStatusModalOpen(true);
              }}
              className="relative p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-pink-400 to-rose-200 shadow-lg group-hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <img
                src={coupleData.girl.avatar}
                alt={coupleData.girl.name}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-3 sm:border-4 border-white shadow-inner"
              />
              <span className="absolute bottom-0.5 right-0.5 bg-white p-0.5 sm:p-1 rounded-full shadow text-[10px] sm:text-xs">
                🎀
              </span>
            </div>
            <h3 className="mt-2 sm:mt-3 font-serif font-bold text-slate-800 text-xs sm:text-base md:text-lg truncate max-w-[100px] sm:max-w-none">
              {coupleData.girl.name}
            </h3>
            <span className="text-[10px] sm:text-xs text-rose-500 font-medium truncate max-w-[100px] sm:max-w-none">
              {coupleData.girl.nickname}
            </span>
          </div>
        </div>

        {/* Nút bấm nhanh Tùy chỉnh ngày yêu & Avatar */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/90 hover:bg-rose-50 border border-rose-200 shadow-xs text-[11px] sm:text-xs font-medium text-rose-600 hover:text-rose-700 transition active:scale-95"
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Tùy chỉnh</span>
          </button>
        </div>

        {/* Romantic Quote */}
        <div className="max-w-xl mx-auto px-2 sm:px-4">
          <p className="font-serif italic text-slate-700 text-xs sm:text-base md:text-lg leading-relaxed">
            "{coupleData.romanticQuote.text}"
          </p>
          <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm font-cursive text-rose-500 tracking-wider">
            — {coupleData.romanticQuote.author} —
          </p>
        </div>
      </div>

      {/* Main Love Counter Card */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200/90 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-32 sm:w-40 h-32 sm:h-40 bg-pink-100/60 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            <span className="text-[10px] sm:text-xs font-semibold text-rose-700 tracking-wide uppercase">
              Chúng Mình Đã Yêu Nhau Được
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-rose-600 mt-1">
            {elapsed.days} <span className="text-base sm:text-xl md:text-2xl font-sans font-normal text-slate-600">Ngày</span>
          </h2>

          {/* HIỂN THỊ NGÀY BẮT ĐẦU YÊU NHAU THEO TIẾNG VIỆT */}
          <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-2xl sm:rounded-full border border-rose-200/90 text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 shadow-xs max-w-full text-center">
            <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              Khởi đầu từ: <strong className="text-rose-600 font-semibold">{formatVietnameseFull(coupleData.startDate)}</strong>
            </span>
          </div>
        </div>

        {/* Time Units Grid (Days, Hours, Minutes, Seconds) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 max-w-xl mx-auto">
          {[
            { value: elapsed.days, label: 'Ngày', sub: 'Hạnh phúc' },
            { value: String(elapsed.hours).padStart(2, '0'), label: 'Giờ', sub: 'Thương nhớ' },
            { value: String(elapsed.minutes).padStart(2, '0'), label: 'Phút', sub: 'Ngọt ngào' },
            { value: String(elapsed.seconds).padStart(2, '0'), label: 'Giây', sub: 'Bên nhau' },
          ].map((item, index) => (
            <div
              key={index}
              className="glass-card-hover bg-white/85 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center border border-rose-100 shadow-xs"
            >
              <div className="text-base sm:text-2xl md:text-4xl font-bold font-serif text-slate-800 tracking-tight">
                {item.value}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-rose-500 mt-0.5">
                {item.label}
              </div>
              <div className="hidden sm:block text-[9px] md:text-[10px] text-slate-400 font-light mt-0.5">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Milestone Quick Stats */}
        <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-rose-100 grid grid-cols-3 gap-2 text-center">
          <div className="p-1 sm:p-2">
            <p className="text-[10px] sm:text-xs text-slate-500">Tổng giờ yêu</p>
            <p className="text-xs sm:text-base md:text-lg font-bold text-slate-800 font-serif">
              {(elapsed.days * 24 + elapsed.hours).toLocaleString()}h
            </p>
          </div>
          <div className="p-1 sm:p-2">
            <p className="text-[10px] sm:text-xs text-slate-500">Nụ hôn & ôm</p>
            <p className="text-xs sm:text-base md:text-lg font-bold text-rose-500 font-serif">
              Vô Tận ∞
            </p>
          </div>
          <div className="p-1 sm:p-2">
            <p className="text-[10px] sm:text-xs text-slate-500">Lời ước nguyện</p>
            <p className="text-xs sm:text-base md:text-lg font-bold text-slate-800 font-serif truncate">
              Mãi Một Lòng
            </p>
          </div>
        </div>
      </div>

      {/* HIGHLIGHT: SỰ KIỆN GẦN NHẤT */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-7 border border-rose-200/90 bg-gradient-to-r from-rose-50/90 via-pink-50/80 to-rose-50/90 shadow-md relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 text-center sm:text-left">

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-md shadow-rose-200 shrink-0">
              {closestEvent.icon || "🎁"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Sự Kiện Gần Nhất
                </span>
              </div>
              <h4 className="text-sm sm:text-lg md:text-2xl font-serif font-bold text-slate-800 mt-0.5 truncate">
                {closestEvent.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                {closestEvent.description}
              </p>
            </div>
          </div>

          {/* Countdown Unit Boxes */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
            {[
              { val: countdown.days, label: 'Ngày' },
              { val: countdown.hours, label: 'Giờ' },
              { val: countdown.minutes, label: 'Phút' },
              { val: countdown.seconds, label: 'Giây' },
            ].map((c, i) => (
              <div key={i} className="bg-white/95 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-center shadow-xs border border-rose-100 min-w-[42px] sm:min-w-[54px]">
                <span className="block text-xs sm:text-base md:text-xl font-bold text-rose-600 font-serif">
                  {c.val}
                </span>
                <span className="block text-[8.5px] sm:text-[10px] text-slate-500 font-sans font-medium">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle View All Events Button */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-rose-200/70 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1 text-[11px] sm:text-xs transition"
          >
            <span>{showAllEvents ? 'Thu gọn' : `Xem tất cả ${allEventsSorted.length} sự kiện`}</span>
            {showAllEvents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-rose-600 flex items-center space-x-1 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-rose-100 transition shadow-xs"
          >
            <Plus className="w-3 h-3 text-rose-500" />
            <span>Thêm sự kiện</span>
          </button>
        </div>

        {/* All Events Expandable Drawer */}
        {showAllEvents && (
          <div className="mt-3 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 animate-in fade-in slide-in-from-top-2">
            {allEventsSorted.map((item) => {
              const isItemClosest = item.id === closestEvent.id;
              const dateObj = new Date(item.date);
              const isPast = dateObj.getTime() < Date.now();

              return (
                <div
                  key={item.id}
                  className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${isItemClosest
                      ? 'bg-rose-100/90 border-rose-300 ring-2 ring-rose-200 shadow-xs'
                      : isPast
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : 'bg-white/85 border-rose-100 shadow-xs'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{item.icon || '💖'}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isItemClosest ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {isItemClosest ? 'Gần nhất' : formatVietnameseShort(item.date)}
                    </span>
                  </div>
                  <h5 className="font-serif font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {item.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA To Romantic Game */}
      <div className="text-center pt-1 sm:pt-2">
        <button
          onClick={onNavigateToGame}
          className="group inline-flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-semibold shadow-lg shadow-rose-300 hover:scale-105 active:scale-95 transition-all text-xs sm:text-base"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 group-hover:rotate-12 transition" />
          <span>Khám Phá Trò Chơi "Hành Trình Yêu Thương"</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition" />
        </button>
        <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500 font-light">
          Vượt qua 4 trạm thử thách để mở khóa bức tâm thư & điều bất ngờ 💌
        </p>
      </div>

      {/* Modal Cập Nhật Status Avatar */}
      <AvatarStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        targetRole={statusTargetRole}
      />
    </div>
  );
}
