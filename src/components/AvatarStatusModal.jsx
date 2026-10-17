import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Smile, Music, Sparkles, Trash2, 
  Check, Save, Disc, RefreshCw 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import MusicPickerModal from './MusicPickerModal';

export default function AvatarStatusModal({ isOpen, onClose }) {
  const { coupleData, saveCoupleData, myRole } = useCouple();

  const activeRole = myRole || 'boy';
  const [statusText, setStatusText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💭');
  const [selectedSong, setSelectedSong] = useState(null);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    const currentPerson = activeRole === 'boy' ? coupleData.boy : coupleData.girl;
    const currentStatus = currentPerson?.status || {};
    setStatusText(currentStatus.text || '');
    setSelectedEmoji(currentStatus.emoji || '💭');
    setSelectedSong(currentStatus.song || null);
  }, [isOpen, activeRole, coupleData]);

  if (!isOpen) return null;

  const feelings = [
    { emoji: '💭', label: 'Suy nghĩ' },
    { emoji: '🥰', label: 'Hạnh phúc' },
    { emoji: '💖', label: 'Yêu thương' },
    { emoji: '🥺', label: 'Nhớ người ấy' },
    { emoji: '😴', label: 'Buồn ngủ' },
    { emoji: '🍕', label: 'Đói bụng' },
    { emoji: '☕', label: 'Đi cafe' },
    { emoji: '🏖️', label: 'Đi chơi' },
    { emoji: '🎮', label: 'Chơi game' },
    { emoji: '🌸', label: 'Bình yên' },
  ];

  const handleSaveStatus = (e) => {
    e.preventDefault();
    const newStatus = {
      text: statusText.trim(),
      emoji: selectedEmoji,
      songTitle: selectedSong?.title || '',
      songArtist: selectedSong?.artist || '',
      songUrl: selectedSong?.url || '',
      song: selectedSong || null,
      updatedAt: new Date().toISOString(),
    };

    if (activeRole === 'boy') {
      saveCoupleData({
        boy: {
          ...coupleData.boy,
          status: newStatus,
        },
      });
    } else {
      saveCoupleData({
        girl: {
          ...coupleData.girl,
          status: newStatus,
        },
      });
    }

    onClose();
  };

  const handleClearStatus = () => {
    if (activeRole === 'boy') {
      saveCoupleData({
        boy: {
          ...coupleData.boy,
          status: null,
        },
      });
    } else {
      saveCoupleData({
        girl: {
          ...coupleData.girl,
          status: null,
        },
      });
    }
    onClose();
  };

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Chàng Trai';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Cô Gái';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-gradient-to-b from-rose-50/98 via-white to-pink-50/98 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200/90 flex flex-col overflow-hidden pb-safe relative">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">💭</span>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Đăng Status Avatar</h3>
                <p className="text-[11px] text-rose-100">Hiển thị bong bóng suy nghĩ trên trang chủ</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveStatus} className="p-4 sm:p-5 space-y-4">
            
            {/* Danh tính chính chủ đã phân quyền */}
            <div className="p-3 rounded-2xl bg-rose-100/70 border border-rose-200/90 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeRole === 'boy' ? coupleData.boy.avatar : coupleData.girl.avatar}
                  alt={activeRole}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{activeRole === 'boy' ? boyName : girlName}</span>
                    <span className="text-[10px] text-rose-600 bg-rose-200/80 px-2 py-0.2 rounded-full font-semibold">
                      Chính chủ 🔒
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-medium">
                    {activeRole === 'boy' ? 'Tài khoản Chàng Trai 👑' : 'Tài khoản Cô Gái 🎀'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-rose-500 font-medium italic">
                (Đã xác thực)
              </span>
            </div>

            {/* Ô nhập suy nghĩ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Bạn đang nghĩ gì thế?</span>
                <span className="text-[11px] text-slate-400 font-normal">{statusText.length}/45</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                  {selectedEmoji}
                </span>
                <input
                  type="text"
                  maxLength={45}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="Ví dụ: Đang nhớ em nhiều lắm 🥰..."
                  className="w-full pl-10 pr-3 py-2.5 bg-rose-50/50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Chọn Biểu cảm / Cảm xúc */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cảm xúc / Hoạt động hôm nay
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar p-1">
                {feelings.map((f) => (
                  <button
                    key={f.emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(f.emoji)}
                    className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 transition ${
                      selectedEmoji === f.emoji
                        ? 'bg-rose-500 text-white font-semibold shadow-xs scale-105'
                        : 'bg-white border border-rose-100 text-slate-600 hover:bg-rose-50'
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span className="text-[11px]">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn nhạc đính kèm phong cách Facebook */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gắn bài hát yêu thích (Kiểu Story FB) 🎵
              </label>
              {selectedSong ? (
                <div className="p-2.5 rounded-2xl bg-rose-100/80 border border-rose-300 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={selectedSong.cover}
                      alt={selectedSong.title}
                      className="w-9 h-9 rounded-xl object-cover shrink-0 border border-rose-200"
                    />
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {selectedSong.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {selectedSong.artist}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMusicPickerOpen(true)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-200/60 transition"
                    >
                      Đổi bài
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSong(null)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Gỡ bài hát"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMusicPickerOpen(true)}
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Music className="w-4 h-4 animate-bounce" />
                  <span>Chọn bài hát từ Kho nhạc FB 🎶</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearStatus}
                className="py-2.5 px-3.5 rounded-2xl border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-semibold flex items-center justify-center gap-1 transition"
                title="Xóa bong bóng status này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gỡ status</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-300 hover:scale-102 active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Đồng bộ ngay 💕</span>
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Modal Chọn nhạc FB */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        currentSongId={selectedSong?.id}
      />
    </>
  );
}
