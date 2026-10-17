import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, Heart, Sparkles, Send, Image as ImageIcon, 
  Clock, X, History, RefreshCw, Upload, Maximize2 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { 
  syncPushGameState, syncPullGameState, subscribeToGame, compressImageToBase64 
} from '../utils/cloudSync';
import { playNotificationChime } from '../utils/notificationService';

// Tính thời gian trước
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  if (isNaN(past)) return '';
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export default function LivePhotoWidget() {
  const { coupleData, myRole, setMyRole } = useCouple();

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Bug';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Heily';

  // State Locket Photo
  const [locketData, setLocketData] = useState(() => {
    try {
      const saved = localStorage.getItem('heily_locket_photo');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      current: null, // { id, senderRole, senderName, image, caption, timestamp, reactions }
      history: [],
    };
  });

  // Modal chụp/gửi ảnh mới
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal xem lịch sử ảnh Locket
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // Modal phóng to ảnh hiện tại
  const [showZoomModal, setShowZoomModal] = useState(false);

  const fileInputRef = useRef(null);
  const lastTimestampRef = useRef(locketData.current?.timestamp || '');

  // Gợi ý caption nhanh phong cách Locket
  const quickCaptions = [
    'Đang nhớ em 💕',
    'Mặt mộc đi làm 😴',
    'Ăn cơm chưa nè 🍜',
    'Vừa tới nơi rồi 🚗',
    'Gửi ngàn nụ hôn 💋',
    'Thời tiết hôm nay đẹp ghê ☀️',
    'Bận rộn nhưng luôn nghĩ về người yêu ✨',
  ];

  // Lắng nghe dữ liệu Locket thời gian thực từ Firebase
  useEffect(() => {
    // 1. Kéo dữ liệu ban đầu
    syncPullGameState('locket_photo').then((remote) => {
      if (remote && remote.current) {
        setLocketData(remote);
        lastTimestampRef.current = remote.current.timestamp;
        try {
          localStorage.setItem('heily_locket_photo', JSON.stringify(remote));
        } catch (e) {}
      }
    });

    // 2. Lắng nghe cập nhật realtime
    const unsubscribe = subscribeToGame('locket_photo', (remote) => {
      if (!remote || !remote.current) return;

      // Nếu có ảnh mới từ người kia: rung và phát âm thanh
      if (remote.current.timestamp && remote.current.timestamp !== lastTimestampRef.current) {
        lastTimestampRef.current = remote.current.timestamp;
        
        // Chỉ rung/kêu nếu không phải chính mình gửi
        if (remote.current.senderRole !== myRole) {
          playNotificationChime();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([120, 80, 150]);
          }
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#ec4899', '#fb7185'],
          });
        }
      }

      setLocketData(remote);
      try {
        localStorage.setItem('heily_locket_photo', JSON.stringify(remote));
      } catch (e) {}
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [myRole]);

  // Xử lý khi chọn/chụp ảnh từ máy
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Nén ảnh chất lượng tối ưu cho truyền nhanh
      const base64 = await compressImageToBase64(file, 900, 0.78);
      if (base64) {
        setCapturedImage(base64);
        setShowCaptureModal(true);
      }
    } catch (err) {
      console.error('Lỗi nén ảnh Locket:', err);
      alert('Không thể tải ảnh. Vui lòng thử lại!');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Gửi ảnh Locket lên đám mây
  const handleSendLocketPhoto = async (e) => {
    e.preventDefault();
    if (!capturedImage) return;

    setIsSubmitting(true);
    const senderName = myRole === 'boy' ? boyName : girlName;
    const nowIso = new Date().toISOString();

    const newPhoto = {
      id: `locket_${Date.now()}`,
      senderRole: myRole,
      senderName,
      image: capturedImage,
      caption: captionInput.trim(),
      timestamp: nowIso,
      reactions: 0,
    };

    const previousHistory = Array.isArray(locketData.history) ? locketData.history : [];
    // Giữ tối đa 25 bức ảnh gần nhất trong nhật ký
    const updatedHistory = locketData.current 
      ? [locketData.current, ...previousHistory].slice(0, 25)
      : previousHistory;

    const updatedData = {
      current: newPhoto,
      history: updatedHistory,
    };

    setLocketData(updatedData);
    lastTimestampRef.current = nowIso;
    try {
      localStorage.setItem('heily_locket_photo', JSON.stringify(updatedData));
    } catch (e) {}

    playNotificationChime();
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#fb7185', '#ffd166'],
    });

    await syncPushGameState('locket_photo', updatedData);

    setCapturedImage('');
    setCaptionInput('');
    setShowCaptureModal(false);
    setIsSubmitting(false);
  };

  // Thả tim vào ảnh đối phương
  const handleReactHeart = async () => {
    if (!locketData.current) return;

    playNotificationChime();
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f43f5e', '#fb7185', '#fda4af'],
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }

    const currentReactions = Number(locketData.current.reactions || 0) + 1;
    const updatedCurrent = {
      ...locketData.current,
      reactions: currentReactions,
    };

    const updatedData = {
      ...locketData,
      current: updatedCurrent,
    };

    setLocketData(updatedData);
    try {
      localStorage.setItem('heily_locket_photo', JSON.stringify(updatedData));
    } catch (e) {}

    await syncPushGameState('locket_photo', updatedData);
  };

  const currentPhoto = locketData.current;
  const isSentByMe = currentPhoto?.senderRole === myRole;

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-6">
      
      {/* Khung Widget Phong Cách Locket */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-rose-200/90 shadow-xl bg-gradient-to-b from-rose-50/70 via-white to-pink-50/60 relative overflow-hidden text-left">
        
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Widget Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                <span>Locket Đôi Ta</span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.2 rounded-full bg-rose-100 text-rose-600">
                  Live Photo 📸
                </span>
              </h3>
            </div>
          </div>

          {/* Nút Xem Lịch Sử */}
          {locketData.history?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition px-2.5 py-1 rounded-full bg-white/80 border border-rose-100 hover:bg-rose-50"
            >
              <History className="w-3 h-3 text-rose-500" />
              <span>Nhật ký ({locketData.history.length})</span>
            </button>
          )}
        </div>

        {/* KHUNG HIỂN THỊ ẢNH LOCKET (PHOTO DISPLAY) */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-4/3 sm:aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 shadow-md group">
          
          {currentPhoto ? (
            <>
              {/* Ảnh Locket */}
              <img
                src={currentPhoto.image}
                alt={currentPhoto.caption || 'Locket photo'}
                onClick={() => setShowZoomModal(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 cursor-pointer"
              />

              {/* Tag Người Gửi (Top-Left) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 shadow-md">
                <span>{currentPhoto.senderRole === 'boy' ? '👑' : '🎀'}</span>
                <span>{currentPhoto.senderName}</span>
                {isSentByMe && <span className="text-[9px] text-rose-300">(Bạn)</span>}
              </div>

              {/* Tag Thời Gian (Top-Right) */}
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/20 shadow-md">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>{timeAgo(currentPhoto.timestamp)}</span>
              </div>

              {/* Overlay Chú Thích & Nút Thả Tim (Bottom) */}
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {currentPhoto.caption ? (
                    <div className="inline-block max-w-full px-3 py-1 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-serif font-medium text-xs sm:text-sm shadow-md truncate">
                      "{currentPhoto.caption}"
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/70 italic">Khoảnh khắc vừa gửi</span>
                  )}
                </div>

                {/* Nút Thả Tim Phản Hồi */}
                <button
                  type="button"
                  onClick={handleReactHeart}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition active:scale-90 hover:scale-105 border border-white/30"
                  title="Thả tim cho bức ảnh này"
                >
                  <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
                  <span>{currentPhoto.reactions || 1}</span>
                </button>
              </div>
            </>
          ) : (
            /* Trạng thái chưa có ảnh nào */
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white/80 cursor-pointer hover:bg-slate-800/80 transition"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 text-rose-400 border border-white/20 group-hover:scale-110 transition">
                <Camera className="w-7 h-7" />
              </div>
              <p className="font-serif font-bold text-sm sm:text-base text-white">
                Khung Ảnh Locket Đang Trống ✨
              </p>
              <p className="text-[11px] sm:text-xs text-white/70 mt-1 max-w-xs">
                Chụp nhanh 1 bức ảnh (mặt mộc, bữa ăn, góc làm việc...) gửi ngay cho người ấy nhé!
              </p>
              <span className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md">
                + Chụp gửi ngay
              </span>
            </div>
          )}

        </div>

        {/* Action Bar Nút Bấm */}
        <div className="mt-3.5 flex items-center justify-between gap-2">
          
          {/* Nút mở Camera / Thư viện */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Chụp / Gửi ảnh Locket mới 📸</span>
          </button>

          {currentPhoto && (
            <button
              type="button"
              onClick={() => setShowZoomModal(true)}
              className="p-2.5 rounded-full bg-white border border-rose-200 hover:bg-rose-50 text-slate-600 transition shadow-xs"
              title="Phóng to ảnh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* MODAL XÁC NHẬN & VIẾT CAPTION TRƯỚC KHI GỬI */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-rose-200 text-left space-y-3.5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-500" />
                <h4 className="font-serif font-bold text-sm sm:text-base text-slate-800">
                  Gửi Ảnh Locket Tức Thì 📸
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCaptureModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Xem trước ảnh */}
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-rose-200 shadow-inner">
              <img
                src={capturedImage}
                alt="Captured preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Vai trò người gửi */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Người gửi:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMyRole('boy')}
                  className={`px-2.5 py-1 rounded-full font-bold transition text-xs ${
                    myRole === 'boy' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  👑 {boyName}
                </button>
                <button
                  type="button"
                  onClick={() => setMyRole('girl')}
                  className={`px-2.5 py-1 rounded-full font-bold transition text-xs ${
                    myRole === 'girl' ? 'bg-pink-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  🎀 {girlName}
                </button>
              </div>
            </div>

            {/* Ô nhập Caption */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                maxLength={60}
                placeholder="Ghi kèm vài lời nhắn ngọt ngào..."
                className="w-full px-3.5 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />

              {/* Gợi ý caption nhanh */}
              <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto no-scrollbar">
                {quickCaptions.map((cap, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCaptionInput(cap)}
                    className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition"
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút gửi */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCaptureModal(false)}
                className="flex-1 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendLocketPhoto}
                className="flex-1 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Tức Thì 🚀'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO ẢNH LOCKET HIỆN TẠI */}
      {showZoomModal && currentPhoto && (
        <div 
          onClick={() => setShowZoomModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/20 text-white"
          >
            <div className="relative aspect-square">
              <img
                src={currentPhoto.image}
                alt={currentPhoto.caption || 'Enlarged photo'}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-1 bg-slate-900 text-left">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>{currentPhoto.senderName} ({currentPhoto.senderRole === 'boy' ? '👑 Chàng trai' : '🎀 Cô gái'})</span>
                <span>{timeAgo(currentPhoto.timestamp)}</span>
              </div>
              {currentPhoto.caption && (
                <p className="font-serif text-sm sm:text-base text-white pt-1">
                  "{currentPhoto.caption}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬT KÝ LỊCH SỬ ẢNH LOCKET */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-200 text-left space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-rose-500" />
                <h4 className="font-serif font-bold text-sm sm:text-base text-slate-800">
                  Nhật Ký Khoảnh Khắc Locket 🎞️
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Danh sách ảnh lưới */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[currentPhoto, ...(locketData.history || [])]
                .filter(Boolean)
                .map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-rose-100 shadow-2xs"
                  >
                    <img
                      src={item.image}
                      alt={item.caption || 'History item'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-white text-[10px]">
                      <span className="font-semibold">{item.senderName}</span>
                      {item.caption && <span className="truncate italic">"{item.caption}"</span>}
                      <span className="text-white/70 text-[9px]">{timeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
