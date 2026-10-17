import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, Heart, Sparkles, Send, Image as ImageIcon, 
  Clock, X, History, RefreshCw, Upload, Maximize2, 
  ChevronLeft, ChevronRight, MessageCircle, MessageSquareShare,
  Bell, BellRing, BellOff
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { 
  syncPushGameState, syncPullGameState, subscribeToGame, 
  compressImageToBase64, syncSendMessage 
} from '../utils/cloudSync';
import { 
  playNotificationChime, 
  notifyNewLocketPhoto, 
  notifyLocketReaction, 
  getNotificationPermission, 
  requestNotificationPermission 
} from '../utils/notificationService';

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
  const { coupleData, myRole } = useCouple();

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Bug';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Heily';
  const partnerRole = myRole === 'boy' ? 'girl' : 'boy';
  const partnerName = myRole === 'boy' ? girlName : boyName;

  // State Locket Photo
  const [locketData, setLocketData] = useState(() => {
    try {
      const saved = localStorage.getItem('heily_locket_photo');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      current: null, // { id, senderRole, senderName, image, caption, timestamp, reactions: { boy: '❤️', girl: '🥰' } }
      history: [],
    };
  });

  // Vị trí ảnh đang xem (0: ảnh mới nhất, 1, 2... là các ảnh trước đó)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ô nhập trả lời ảnh nhảy vào tin nhắn
  const [replyInput, setReplyInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Modal chụp/gửi ảnh mới
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal xem lịch sử ảnh Locket
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // Modal phóng to ảnh hiện tại
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Trạng thái thông báo Web Push & Thông báo nổi (In-App Toast)
  const [notificationStatus, setNotificationStatus] = useState(() => getNotificationPermission());
  const [inAppToast, setInAppToast] = useState(null);

  const fileInputRef = useRef(null);
  const lastTimestampRef = useRef(locketData.current?.timestamp || '');
  const lastReactionTimeRef = useRef(Date.now());
  const lastReactionKeyRef = useRef('');

  // Tự tắt Toast sau 5 giây
  useEffect(() => {
    if (!inAppToast) return;
    const timer = setTimeout(() => setInAppToast(null), 5000);
    return () => clearTimeout(timer);
  }, [inAppToast]);

  // Touch Swipe Gesture References
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  // Danh sách emoji cảm xúc phong cách Locket
  const reactionEmojis = [
    { emoji: '❤️', label: 'Yêu thích' },
    { emoji: '🥰', label: 'Ngọt ngào' },
    { emoji: '😂', label: 'Cười xỉu' },
    { emoji: '🔥', label: 'Cháy quá' },
    { emoji: '🥺', label: 'Nhớ nè' },
    { emoji: '💋', label: 'Nụ hôn' },
  ];

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

  // Danh sách toàn bộ các ảnh Locket (ảnh mới nhất đầu tiên, kế tiếp là lịch sử)
  const allPhotos = [
    ...(locketData.current ? [locketData.current] : []),
    ...(Array.isArray(locketData.history) ? locketData.history : [])
  ].filter((photo, index, self) => 
    photo && photo.image && index === self.findIndex(p => p.id === photo.id)
  );

  // Đảm bảo chỉ số nằm trong khoảng hợp lệ
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, allPhotos.length - 1));
  const activePhoto = allPhotos[safeIndex] || null;

  // Lắng nghe dữ liệu Locket thời gian thực từ Firebase
  useEffect(() => {
    // 1. Kéo dữ liệu ban đầu
    syncPullGameState('locket_photo').then((remote) => {
      if (remote && remote.current) {
        setLocketData(remote);
        lastTimestampRef.current = remote.current.timestamp;
        if (remote.lastReactionUpdate && remote.lastReactionUpdate.timestamp) {
          lastReactionTimeRef.current = remote.lastReactionUpdate.timestamp;
        }
        try {
          localStorage.setItem('heily_locket_photo', JSON.stringify(remote));
        } catch (e) {}
      }
    });

    // 2. Lắng nghe cập nhật realtime
    const unsubscribe = subscribeToGame('locket_photo', (remote) => {
      if (!remote) return;

      // a. Nếu có ảnh mới từ người kia: thông báo Web Push + rung + phát âm thanh + Toast
      if (remote.current && remote.current.timestamp && remote.current.timestamp !== lastTimestampRef.current) {
        const isFirstLoad = !lastTimestampRef.current;
        lastTimestampRef.current = remote.current.timestamp;
        
        // Tự động chuyển về ảnh mới nhất vừa gửi
        setCurrentIndex(0);

        // Chỉ thông báo nếu không phải chính mình gửi và không phải lần tải đầu tiên
        if (remote.current.senderRole !== myRole && !isFirstLoad) {
          playNotificationChime();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([120, 80, 150]);
          }
          confetti({
            particleCount: 40,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
          });

          // Gửi thông báo hệ thống Web Push (hiển thị trên thanh thông báo điện thoại)
          notifyNewLocketPhoto(
            remote.current.senderName || partnerName, 
            remote.current.caption, 
            remote.current.image
          );

          // Hiển thị Banner Toast nổi ngay trong màn hình
          setInAppToast({
            title: `📸 ${remote.current.senderName || partnerName} vừa gửi ảnh Locket!`,
            body: remote.current.caption ? `"${remote.current.caption}"` : 'Vừa gửi một khoảnh khắc tức thì đến bạn 💕',
            image: remote.current.image,
          });
        }
      }

      // b. Kiểm tra nếu đối phương vừa thả hoặc đổi cảm xúc vào ảnh Locket
      if (remote.lastReactionUpdate && remote.lastReactionUpdate.timestamp) {
        const { byRole, byName, emoji, caption, timestamp } = remote.lastReactionUpdate;
        if (byRole !== myRole && timestamp > lastReactionTimeRef.current) {
          lastReactionTimeRef.current = timestamp;

          playNotificationChime();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([120, 80, 150]);
          }
          confetti({
            particleCount: 30,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
          });

          // Gửi thông báo hệ thống Web Push tới điện thoại
          notifyLocketReaction(
            byName || partnerName, 
            emoji, 
            caption
          );

          // Toast nổi ngay trên màn hình
          setInAppToast({
            title: `${emoji} ${byName || partnerName} đã thả cảm xúc!`,
            body: caption ? `Biểu cảm "${emoji}" cho ảnh: "${caption}"` : `Đã thả biểu cảm ${emoji} lên ảnh của bạn 💕`,
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
  }, [myRole, partnerRole, partnerName]);

  // Lắng nghe khi mở lại tab hoặc bật sáng màn hình điện thoại
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPullGameState('locket_photo').then((remote) => {
          if (!remote) return;
          if (remote.lastReactionUpdate && remote.lastReactionUpdate.timestamp) {
            const { byRole, byName, emoji, caption, timestamp } = remote.lastReactionUpdate;
            if (byRole !== myRole && timestamp > lastReactionTimeRef.current) {
              lastReactionTimeRef.current = timestamp;
              notifyLocketReaction(byName || partnerName, emoji, caption);
              setInAppToast({
                title: `${emoji} ${byName || partnerName} đã thả cảm xúc!`,
                body: caption ? `Biểu cảm "${emoji}" cho ảnh: "${caption}"` : `Đã thả biểu cảm ${emoji} lên ảnh của bạn 💕`,
              });
            }
          }
          setLocketData(remote);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [myRole, partnerName]);

  // Bật/Kiểm tra quyền thông báo cho Locket
  const handleToggleNotification = async () => {
    if (notificationStatus === 'granted') {
      playNotificationChime();
      notifyNewLocketPhoto('Locket Đôi Ta', 'Thông báo Locket đang hoạt động rất tốt trên thiết bị của bạn! 🔔');
      return;
    }
    const granted = await requestNotificationPermission();
    const updatedStatus = getNotificationPermission();
    setNotificationStatus(updatedStatus);
    if (granted || updatedStatus === 'granted') {
      playNotificationChime();
      notifyNewLocketPhoto('Locket Đôi Ta', 'Đã bật thông báo thành công! Bạn sẽ nhận thông báo ngay khi có ảnh mới 💕');
    } else if (updatedStatus === 'denied') {
      alert('Trình duyệt đang chặn thông báo. Vui lòng bấm vào biểu tượng ổ khóa cạnh thanh địa chỉ web trên trình duyệt để Cho phép (Allow) thông báo nhé!');
    }
  };

  // XỬ LÝ VUỐT (SWIPE GESTURE) TRÁI / PHẢI
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe && safeIndex < allPhotos.length - 1) {
      // Vuốt sang trái -> Xem ảnh cũ hơn trong lịch sử
      setCurrentIndex((prev) => Math.min(allPhotos.length - 1, prev + 1));
    }
    if (isRightSwipe && safeIndex > 0) {
      // Vuốt sang phải -> Xem ảnh mới hơn
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Xử lý khi chọn/chụp ảnh từ máy
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
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
      reactions: {},
    };

    const previousHistory = Array.isArray(locketData.history) ? locketData.history : [];
    const updatedHistory = locketData.current 
      ? [locketData.current, ...previousHistory].slice(0, 30)
      : previousHistory;

    const updatedData = {
      current: newPhoto,
      history: updatedHistory,
    };

    setLocketData(updatedData);
    setCurrentIndex(0); // Nhảy về xem ảnh mới nhất vừa đăng
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

  // THẢ CẢM XÚC (EMOJI REACTION)
  const handleReactEmoji = async (emoji) => {
    if (!activePhoto) return;

    playNotificationChime();
    confetti({
      particleCount: 26,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(70);
    }

    const prevReactions = typeof activePhoto.reactions === 'object' && activePhoto.reactions !== null
      ? { ...activePhoto.reactions }
      : {};

    // Gán emoji của vai trò hiện tại
    prevReactions[myRole] = emoji;

    const updatedPhoto = {
      ...activePhoto,
      reactions: prevReactions,
    };

    let newCurrent = locketData.current;
    let newHistory = Array.isArray(locketData.history) ? [...locketData.history] : [];

    if (newCurrent && newCurrent.id === activePhoto.id) {
      newCurrent = updatedPhoto;
    } else {
      newHistory = newHistory.map(p => p.id === activePhoto.id ? updatedPhoto : p);
    }

    const myDisplayName = myRole === 'boy' ? boyName : girlName;
    const nowTimestamp = Date.now();

    const updatedData = {
      current: newCurrent,
      history: newHistory,
      lastReactionUpdate: {
        photoId: activePhoto.id,
        byRole: myRole,
        byName: myDisplayName,
        emoji: emoji,
        caption: activePhoto.caption || '',
        timestamp: nowTimestamp,
      }
    };

    setLocketData(updatedData);
    lastReactionTimeRef.current = nowTimestamp;
    try {
      localStorage.setItem('heily_locket_photo', JSON.stringify(updatedData));
    } catch (e) {}

    await syncPushGameState('locket_photo', updatedData);
  };

  // TRẢ LỜI ẢNH LOCKET -> NHẢY VÀO HỘP TIN NHẮN REALTIME
  const handleReplyPhoto = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !activePhoto) return;

    setIsReplying(true);
    const myDisplayName = myRole === 'boy' ? boyName : girlName;
    const myAvatar = myRole === 'boy' 
      ? (coupleData.boy.avatar || '/images/avatar-boy.svg') 
      : (coupleData.girl.avatar || '/images/avatar-girl.svg');

    const replyMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderRole: myRole,
      senderName: myDisplayName,
      senderAvatar: myAvatar,
      text: `📸 [Trả lời ảnh Locket${activePhoto.caption ? `: "${activePhoto.caption}"` : ''}]\n${replyInput.trim()}`,
      mediaUrl: activePhoto.image || '',
      timestamp: Date.now(),
      reactions: {},
    };

    try {
      // 1. Đẩy vào tin nhắn
      await syncSendMessage(replyMsg);

      // 2. Âm báo & rung
      playNotificationChime();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185'],
      });

      // 3. Mở khung chat ngay lập tức
      window.dispatchEvent(new CustomEvent('open_couple_chat'));
      setReplyInput('');
    } catch (err) {
      console.error('Lỗi gửi tin nhắn trả lời Locket:', err);
    } finally {
      setIsReplying(false);
    }
  };

  const isSentByMe = activePhoto?.senderRole === myRole;
  const currentPhotoReactions = activePhoto?.reactions || {};

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-6">
      
      {/* In-App Toast Popup khi có ảnh / reaction mới */}
      {inAppToast && (
        <div 
          onClick={() => {
            setCurrentIndex(0);
            setInAppToast(null);
          }}
          className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-rose-300 p-3 flex items-center gap-3 cursor-pointer animate-in fade-in slide-in-from-top duration-300 hover:shadow-rose-200/50"
        >
          {inAppToast.image ? (
            <img src={inAppToast.image} alt="Locket" className="w-11 h-11 rounded-xl object-cover border border-rose-200 shadow-xs" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-xs">
              📸
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <div className="font-bold text-xs sm:text-sm text-slate-800 truncate flex items-center gap-1.5">
              <span>{inAppToast.title}</span>
            </div>
            <div className="text-[11px] text-slate-600 truncate">
              {inAppToast.body}
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setInAppToast(null); }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

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

          <div className="flex items-center gap-1.5">
            {/* Bộ đếm vị trí ảnh */}
            {allPhotos.length > 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-600">
                {safeIndex + 1}/{allPhotos.length}
              </span>
            )}

            {/* Nút Chuông Thông Báo */}
            <button
              type="button"
              onClick={handleToggleNotification}
              title={notificationStatus === 'granted' ? 'Đã bật thông báo Locket' : 'Bật thông báo khi có ảnh mới'}
              className={`text-[11px] font-medium flex items-center gap-1 transition px-2.5 py-1 rounded-full border ${
                notificationStatus === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
              }`}
            >
              {notificationStatus === 'granted' ? (
                <>
                  <Bell className="w-3 h-3 text-emerald-600" />
                  <span className="hidden xs:inline">Thông báo</span>
                </>
              ) : (
                <>
                  <BellRing className="w-3 h-3 text-amber-600" />
                  <span className="hidden xs:inline">Bật chuông</span>
                </>
              )}
            </button>

            {/* Nút Xem Lịch Sử */}
            {allPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition px-2.5 py-1 rounded-full bg-white/80 border border-rose-100 hover:bg-rose-50"
              >
                <History className="w-3 h-3 text-rose-500" />
                <span className="hidden xs:inline">Nhật ký</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner Nhắc Bật Thông Báo Nếu Chưa Cấp Quyền */}
        {notificationStatus !== 'granted' && (
          <div 
            onClick={handleToggleNotification}
            className="mb-3 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>Bật thông báo để nhận ảnh Locket & cảm xúc tức thì! 🔔</span>
            </div>
            <span className="font-bold underline text-amber-900 shrink-0">Bật ngay</span>
          </div>
        )}

        {/* KHUNG HIỂN THỊ ẢNH LOCKET (VUỐT TRÁI / PHẢI) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-4/3 sm:aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 shadow-md group select-none"
        >
          {activePhoto ? (
            <>
              {/* Ảnh Locket */}
              <img
                src={activePhoto.image}
                alt={activePhoto.caption || 'Locket photo'}
                onClick={() => setShowZoomModal(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101 cursor-pointer"
              />

              {/* Tag Người Gửi (Top-Left) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 shadow-md">
                <span>{activePhoto.senderRole === 'boy' ? '👑' : '🎀'}</span>
                <span>{activePhoto.senderName}</span>
                {isSentByMe && <span className="text-[9px] text-rose-300">(Bạn)</span>}
              </div>

              {/* Tag Thời Gian (Top-Right) */}
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/20 shadow-md">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>{timeAgo(activePhoto.timestamp)}</span>
              </div>

              {/* Nút Điều Hướng Trái / Phải Trên Ảnh */}
              {safeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition shadow-lg active:scale-90"
                  title="Xem ảnh mới hơn (Vuốt sang phải)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {safeIndex < allPhotos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(allPhotos.length - 1, prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition shadow-lg active:scale-90"
                  title="Xem ảnh cũ hơn (Vuốt sang trái)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Overlay Chú Thích & Huy Hiệu Cảm Xúc (Bottom) */}
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {activePhoto.caption ? (
                    <div className="inline-block max-w-full px-3 py-1 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-serif font-medium text-xs sm:text-sm shadow-md truncate">
                      "{activePhoto.caption}"
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/70 italic">Khoảnh khắc đôi ta</span>
                  )}
                </div>

                {/* Huy hiệu cảm xúc hai người đã thả */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentPhotoReactions.boy && (
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white text-[11px] shadow-sm flex items-center gap-1" title={`${boyName} đã thả ${currentPhotoReactions.boy}`}>
                      <span>👑</span>
                      <span>{currentPhotoReactions.boy}</span>
                    </span>
                  )}
                  {currentPhotoReactions.girl && (
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white text-[11px] shadow-sm flex items-center gap-1" title={`${girlName} đã thả ${currentPhotoReactions.girl}`}>
                      <span>🎀</span>
                      <span>{currentPhotoReactions.girl}</span>
                    </span>
                  )}
                </div>
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

        {/* BẬT MÍ VUỐT XEM ẢNH */}
        {allPhotos.length > 1 && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>👈 Vuốt trái / phải để xem {allPhotos.length} ảnh 👉</span>
            <div className="flex gap-1">
              {allPhotos.slice(0, 8).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === safeIndex ? 'bg-rose-500 w-3' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* KHU VỰC THẢ CẢM XÚC (EMOJI REACTION BAR) */}
        {activePhoto && (
          <div className="mt-3 p-2 rounded-2xl bg-white/90 border border-rose-100 shadow-2xs flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-500 pl-1 shrink-0">Thả cảm xúc:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {reactionEmojis.map(({ emoji, label }) => {
                const isSelectedByMe = currentPhotoReactions[myRole] === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReactEmoji(emoji)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform active:scale-125 hover:scale-115 ${
                      isSelectedByMe 
                        ? 'bg-rose-100 ring-2 ring-rose-400 scale-110 shadow-xs' 
                        : 'hover:bg-rose-50'
                    }`}
                    title={label}
                  >
                    <span>{emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* KHU VỰC TRẢ LỜI ẢNH -> NHẢY VÀO TIN NHẮN REALTIME */}
        {activePhoto && (
          <form onSubmit={handleReplyPhoto} className="mt-2.5 flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder={`Nhắn lại cho ${activePhoto.senderRole === myRole ? 'người ấy' : activePhoto.senderName}...`}
                className="w-full py-2 pl-3.5 pr-8 rounded-full bg-rose-50/70 border border-rose-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />
              <MessageCircle className="w-3.5 h-3.5 text-rose-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={!replyInput.trim() || isReplying}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center gap-1 active:scale-95 shrink-0"
              title="Gửi câu trả lời vào khung chat của hai bạn"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Chat</span>
            </button>
          </form>
        )}

        {/* NÚT CHỤP / GỬI ẢNH MỚI */}
        <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center gap-2">
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

          {activePhoto && (
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

            {/* Thông báo người gửi theo vai trò trên Header */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 font-medium">Người gửi:</span>
              <span className="font-bold text-rose-600">
                {myRole === 'boy' ? `👑 ${boyName}` : `🎀 ${girlName}`}
              </span>
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
      {showZoomModal && activePhoto && (
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
                src={activePhoto.image}
                alt={activePhoto.caption || 'Enlarged photo'}
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
                <span>{activePhoto.senderName} ({activePhoto.senderRole === 'boy' ? '👑 Chàng trai' : '🎀 Cô gái'})</span>
                <span>{timeAgo(activePhoto.timestamp)}</span>
              </div>
              {activePhoto.caption && (
                <p className="font-serif text-sm sm:text-base text-white pt-1">
                  "{activePhoto.caption}"
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
              {allPhotos.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowHistoryModal(false);
                  }}
                  className={`group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border cursor-pointer transition-all ${
                    idx === safeIndex ? 'ring-2 ring-rose-500 border-rose-300' : 'border-rose-100'
                  }`}
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
