import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, Sparkles, Flame, ShieldAlert, Wifi, 
  Smartphone, User, Users, Clock, Award, Volume2 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { syncPushGameState, syncPullGameState, subscribeToGame } from '../utils/cloudSync';
import { playNotificationChime } from '../utils/notificationService';

export default function HeartbeatTouch() {
  const { coupleData, myRole } = useCouple();

  const [isMyTouching, setIsMyTouching] = useState(false);
  const [isPartnerTouching, setIsPartnerTouching] = useState(false);
  const [syncSeconds, setSyncSeconds] = useState(0);
  const [totalSyncCount, setTotalSyncCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const heartbeatAudioRef = useRef(null);
  const syncTimerRef = useRef(null);
  const touchDebounceRef = useRef(null);
  const lastPartnerTouchTimeRef = useRef(0);

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Bug';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Heily';
  const partnerRole = myRole === 'boy' ? 'girl' : 'boy';
  const partnerName = myRole === 'boy' ? girlName : boyName;

  // Lắng nghe dữ liệu chạm thời gian thực từ Firebase
  useEffect(() => {
    // 1. Kéo trạng thái ban đầu
    syncPullGameState('heartbeat_touch').then((state) => {
      if (state) {
        const partnerIsTouching = partnerRole === 'boy' ? Boolean(state.boyTouching) : Boolean(state.girlTouching);
        setIsPartnerTouching(partnerIsTouching);
        if (state.totalSyncCount) setTotalSyncCount(state.totalSyncCount);
      }
      setIsConnected(true);
    });

    // 2. Lắng nghe cập nhật realtime
    const unsubscribe = subscribeToGame('heartbeat_touch', (remoteState) => {
      if (!remoteState) return;

      const partnerIsTouching = partnerRole === 'boy' 
        ? Boolean(remoteState.boyTouching) 
        : Boolean(remoteState.girlTouching);

      setIsPartnerTouching(partnerIsTouching);
      if (remoteState.totalSyncCount) setTotalSyncCount(remoteState.totalSyncCount);

      // Nếu đối phương vừa chạm vào: rung điện thoại nhịp tim
      if (partnerIsTouching && Date.now() - lastPartnerTouchTimeRef.current > 3000) {
        lastPartnerTouchTimeRef.current = Date.now();
        vibrateHeartbeat();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [partnerRole]);

  // Rung nhịp đập trái tim trên điện thoại
  const vibrateHeartbeat = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 150, 120, 250, 100, 150]);
    }
  };

  // Cả hai cùng chạm tay đồng thời (Synchronized Touch)
  const isBothTouching = isMyTouching && isPartnerTouching;

  useEffect(() => {
    if (isBothTouching) {
      vibrateHeartbeat();
      playNotificationChime();

      // Bắn pháo hoa trái tim
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166', '#ff758f'],
      });

      // Tăng số giây đồng bộ
      syncTimerRef.current = setInterval(() => {
        setSyncSeconds((prev) => prev + 1);
      }, 1000);

      // Cập nhật tổng số lần kết nối
      setTotalSyncCount((prev) => {
        const newCount = prev + 1;
        syncPushGameState('heartbeat_touch', {
          [myRole === 'boy' ? 'boyTouching' : 'girlTouching']: true,
          totalSyncCount: newCount,
        });
        return newCount;
      });
    } else {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      setSyncSeconds(0);
    }

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [isBothTouching]);

  // Xử lý khi bắt đầu chạm
  const handleTouchStart = async (e) => {
    e.preventDefault();
    if (isMyTouching) return;

    setIsMyTouching(true);
    vibrateHeartbeat();

    // Bắn realtime lên Firebase
    await syncPushGameState('heartbeat_touch', {
      [myRole === 'boy' ? 'boyTouching' : 'girlTouching']: true,
      lastTouchedBy: myRole,
      lastTimestamp: Date.now(),
    });
  };

  // Xử lý khi buông tay
  const handleTouchEnd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isMyTouching) return;

    setIsMyTouching(false);

    // Bắn realtime cập nhật nhả tay
    await syncPushGameState('heartbeat_touch', {
      [myRole === 'boy' ? 'boyTouching' : 'girlTouching']: false,
      lastTimestamp: Date.now(),
    });
  };

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6 text-center animate-in fade-in">
      
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 px-4 py-1.5 rounded-full text-rose-700 text-xs font-semibold shadow-2xs">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>Truyền Nhịp Tim & Cảm Xúc Từ Xa</span>
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-800">
          Chạm Tay Kết Nối 💕
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Dù ở bất cứ đâu, chỉ cần hai bạn cùng mở trang này và chạm giữ vào Trái Tim, màn hình sẽ rung theo nhịp đập của nhau!
        </p>
      </div>

      {/* Connection Status & Current User */}
      <div className="glass-card p-3 rounded-2xl border border-rose-200/90 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Tài khoản:</span>
          <span className="px-3 py-1 rounded-full font-bold bg-white text-slate-800 border border-rose-200 shadow-2xs flex items-center gap-1.5">
            <span>{myRole === 'boy' ? '👑' : '🎀'}</span>
            <span>{myRole === 'boy' ? boyName : girlName}</span>
          </span>
        </div>

        {/* Trạng thái đối phương */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-100 font-medium">
          <span className={`w-2 h-2 rounded-full ${isPartnerTouching ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[11px] text-slate-700">
            {isPartnerTouching ? (
              <strong className="text-rose-600">{partnerName} đang chạm tay!</strong>
            ) : (
              `${partnerName} đang trực tuyến`
            )}
          </span>
        </div>
      </div>

      {/* KHU VỰC TRÁI TIM CHẠM TAY LỚN (CENTRAL HEARTBEAT ZONE) */}
      <div className="relative py-8 sm:py-12 flex flex-col items-center justify-center select-none">
        
        {/* Glow rings ambient */}
        <div className={`absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full transition-all duration-700 pointer-events-none blur-3xl ${
          isBothTouching 
            ? 'bg-gradient-to-tr from-amber-300 via-rose-400 to-pink-500 opacity-70 scale-125 animate-pulse'
            : isMyTouching || isPartnerTouching
            ? 'bg-rose-300/60 opacity-60 scale-110'
            : 'bg-pink-100/40 opacity-40 scale-95'
        }`} />

        {/* Vòng lan tỏa sóng nước khi chạm */}
        {(isMyTouching || isPartnerTouching) && (
          <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border-4 border-rose-400/60 animate-ping pointer-events-none" />
        )}
        {isBothTouching && (
          <div className="absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full border-4 border-amber-400/80 animate-ping pointer-events-none delay-150" />
        )}

        {/* Nút Trái Tim Lớn Để Chạm / Giữ */}
        <button
          type="button"
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer outline-none select-none ${
            isBothTouching
              ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 text-white shadow-rose-400/80 scale-110 ring-8 ring-amber-300/80 animate-pulse'
              : isMyTouching
              ? 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-300 scale-105 ring-4 ring-rose-300'
              : isPartnerTouching
              ? 'bg-gradient-to-tr from-pink-400 to-rose-400 text-white shadow-pink-200 ring-4 ring-pink-300 animate-bounce-gentle'
              : 'bg-gradient-to-tr from-white via-rose-50 to-pink-100 text-rose-500 border-4 border-rose-300/80 hover:border-rose-400 shadow-xl'
          }`}
        >
          <Heart className={`w-20 h-20 sm:w-24 sm:h-24 transition-all duration-300 ${
            isBothTouching 
              ? 'fill-white text-white scale-115 drop-shadow-lg' 
              : isMyTouching
              ? 'fill-white text-white scale-110'
              : isPartnerTouching
              ? 'fill-white text-white animate-pulse'
              : 'fill-rose-500 text-rose-500 hover:scale-105'
          }`} />

          <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-wide">
            {isBothTouching ? (
              <span className="text-white drop-shadow">ĐANG NẮM TAY 💕</span>
            ) : isMyTouching ? (
              <span className="text-white">ĐANG CHẠM...</span>
            ) : isPartnerTouching ? (
              <span className="text-white">CHẠM NGAY!</span>
            ) : (
              <span>CHẠM & GIỮ</span>
            )}
          </span>
        </button>

        {/* Status prompt right below heart */}
        <div className="mt-6 z-10 min-h-[50px] flex flex-col items-center justify-center">
          {isBothTouching ? (
            <div className="animate-in zoom-in-95 space-y-1">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 mx-auto">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Hai bạn đang cùng chạm tay vào nhau lúc này! 💕</span>
              </div>
              <p className="text-xs text-rose-600 font-semibold">
                Thời gian kết nối nhịp tim: <strong className="text-base text-rose-700">{syncSeconds}s</strong>
              </p>
            </div>
          ) : isMyTouching ? (
            <p className="text-xs sm:text-sm text-slate-600 font-medium animate-pulse">
              Bạn đang giữ ngón tay trên trái tim... Hãy rủ <strong>{partnerName}</strong> cùng vào chạm nhé!
            </p>
          ) : isPartnerTouching ? (
            <p className="text-xs sm:text-sm text-rose-600 font-bold animate-bounce">
              👉 {partnerName} đang chạm tay và chờ bạn! Hãy chạm vào trái tim ngay nào!
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500">
              Chạm và giữ ngón tay trên Trái Tim để gửi nhịp đập yêu thương tới người ấy
            </p>
          )}
        </div>

      </div>

      {/* Stats and Sweet Touch Log */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <div className="glass-card p-3 rounded-2xl border border-rose-100 shadow-xs text-center">
          <span className="text-slate-400 block text-[10px]">Tổng số lần đồng điệu</span>
          <span className="font-bold text-rose-600 text-base sm:text-lg font-serif">
            {totalSyncCount} lần
          </span>
          <span className="text-[10px] text-slate-400 block">chạm tay cùng lúc</span>
        </div>

        <div className="glass-card p-3 rounded-2xl border border-rose-100 shadow-xs text-center">
          <span className="text-slate-400 block text-[10px]">Cảm giác kết nối</span>
          <span className="font-bold text-slate-800 text-base sm:text-lg font-serif">
            Vô Tận ∞
          </span>
          <span className="text-[10px] text-slate-400 block">khoảng cách là 0cm</span>
        </div>
      </div>

    </div>
  );
}
