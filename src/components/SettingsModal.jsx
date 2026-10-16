import React, { useState, useRef } from 'react';
import { 
  X, Camera, Heart, Calendar, Sparkles, Check, 
  RotateCcw, Trash2, Plus, Save, Clock, Music, Upload, Disc 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import VietnameseDatePicker from './VietnameseDatePicker';
import { formatVietnameseFull } from '../utils/dateUtils';

export default function SettingsModal() {
  const { 
    coupleData, saveCoupleData, addEvent, deleteEvent, 
    resetToDefault, isSettingsOpen, setIsSettingsOpen,
    activePlaylist, uploadCustomSong, removeCustomSong 
  } = useCouple();

  const [activeSubTab, setActiveSubTab] = useState('couple'); // 'couple' | 'events' | 'music'

  // Couple state
  const [boyName, setBoyName] = useState(coupleData.boy.name);
  const [boyNickname, setBoyNickname] = useState(coupleData.boy.nickname);
  const [boyAvatar, setBoyAvatar] = useState(coupleData.boy.avatar);

  const [girlName, setGirlName] = useState(coupleData.girl.name);
  const [girlNickname, setGirlNickname] = useState(coupleData.girl.nickname);
  const [girlAvatar, setGirlAvatar] = useState(coupleData.girl.avatar);

  const [startDate, setStartDate] = useState(coupleData.startDate || new Date().toISOString());
  const [quoteText, setQuoteText] = useState(coupleData.romanticQuote.text);

  // Event creation form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString());
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventIcon, setNewEventIcon] = useState('🎂');

  // Music upload state
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const boyFileInputRef = useRef(null);
  const girlFileInputRef = useRef(null);
  const musicModalFileInputRef = useRef(null);

  if (!isSettingsOpen) return null;

  // Xử lý nén ảnh Base64
  const handleImageUpload = (file, setAvatarState) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarState(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Lưu thông tin đôi
  const handleSaveCoupleInfo = (e) => {
    e.preventDefault();

    saveCoupleData({
      boy: {
        name: boyName,
        nickname: boyNickname,
        avatar: boyAvatar,
      },
      girl: {
        name: girlName,
        nickname: girlNickname,
        avatar: girlAvatar,
      },
      startDate: startDate,
      romanticQuote: {
        text: quoteText,
        author: `Gửi ${girlNickname || girlName} - Tình yêu to bự nhất`,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsOpen(false);
    }, 1000);
  };

  // Thêm sự kiện mới
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    addEvent({
      title: newEventTitle,
      date: newEventDate,
      description: newEventDesc || 'Một ngày đặc biệt ngập tràn yêu thương!',
      icon: newEventIcon,
    });

    setNewEventTitle('');
    setNewEventDesc('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // Upload nhạc
  const handleMusicUploadSubmit = async (e) => {
    e.preventDefault();
    const file = musicModalFileInputRef.current?.files?.[0];
    if (!file) {
      alert("Vui lòng chọn một file nhạc .mp3 từ máy tính/điện thoại!");
      return;
    }

    setIsUploadingMusic(true);
    try {
      await uploadCustomSong(file, songTitle, songArtist);
      setSongTitle('');
      setSongArtist('');
      if (musicModalFileInputRef.current) musicModalFileInputRef.current.value = '';
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      alert("Lỗi khi tải file nhạc: " + err.message);
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về dữ liệu mặc định ban đầu?')) {
      resetToDefault();
      setIsSettingsOpen(false);
    }
  };

  const emojiList = ['🎂', '💖', '💍', '🌹', '✈️', '🎄', '🎆', '🏖️', '🎁', '☕', '🌟'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-white via-rose-50/50 to-pink-50/30 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200 shadow-2xl relative pb-safe">
        
        {/* Nút đóng */}
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-md shadow-rose-200 mb-2">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">
            Trung Tâm Tùy Chỉnh 💖
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Ngày yêu thuần Việt, tải ảnh đại diện, sự kiện và tải nhạc yêu thích
          </p>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4">
            <button
              onClick={() => setActiveSubTab('couple')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                activeSubTab === 'couple'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
              }`}
            >
              Thông Tin & Ngày Yêu
            </button>
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                activeSubTab === 'events'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Sự Kiện ({(coupleData.events || []).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('music')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                activeSubTab === 'music'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Playlist & Tải Nhạc ({activePlaylist.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: THÔNG TIN ĐÔI & NGÀY YÊU */}
        {activeSubTab === 'couple' && (
          <form onSubmit={handleSaveCoupleInfo} className="space-y-6">
            {/* AVATAR & BIỆT DANH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/80 p-5 rounded-2xl border border-rose-100 shadow-sm">
              {/* Chàng trai */}
              <div className="flex flex-col items-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  👑 Chàng Trai
                </span>
                <div className="relative group cursor-pointer" onClick={() => boyFileInputRef.current?.click()}>
                  <img
                    src={boyAvatar}
                    alt="Avatar chàng trai"
                    className="w-24 h-24 rounded-full object-cover border-4 border-rose-300 shadow-md group-hover:opacity-80 transition"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Đổi ảnh</span>
                  </div>
                  <input
                    type="file"
                    ref={boyFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], setBoyAvatar)}
                  />
                </div>
                <div className="w-full space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên:</label>
                    <input
                      type="text"
                      value={boyName}
                      onChange={(e) => setBoyName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Biệt danh:</label>
                    <input
                      type="text"
                      value={boyNickname}
                      onChange={(e) => setBoyNickname(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cô gái */}
              <div className="flex flex-col items-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full">
                  🎀 Cô Gái
                </span>
                <div className="relative group cursor-pointer" onClick={() => girlFileInputRef.current?.click()}>
                  <img
                    src={girlAvatar}
                    alt="Avatar cô gái"
                    className="w-24 h-24 rounded-full object-cover border-4 border-pink-300 shadow-md group-hover:opacity-80 transition"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Đổi ảnh</span>
                  </div>
                  <input
                    type="file"
                    ref={girlFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], setGirlAvatar)}
                  />
                </div>
                <div className="w-full space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên:</label>
                    <input
                      type="text"
                      value={girlName}
                      onChange={(e) => setGirlName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Biệt danh:</label>
                    <input
                      type="text"
                      value={girlNickname}
                      onChange={(e) => setGirlNickname(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CHỌN NGÀY & GIỜ YÊU NHAU CHUẨN TIẾNG VIỆT */}
            <VietnameseDatePicker
              value={startDate}
              onChange={setStartDate}
              label="Chọn Ngày, Tháng, Năm & Giờ Bắt Đầu Yêu Nhau (Chuẩn Tiếng Việt)"
            />

            {/* QUOTE */}
            <div className="bg-white/80 p-5 rounded-2xl border border-rose-100 shadow-sm space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Câu Quote Ý Nghĩa Ở Trang Chủ:
              </label>
              <textarea
                rows={2}
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                className="w-full p-3 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-slate-700"
              />
            </div>

            {/* NÚT LƯU & RESET */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition"
                >
                  {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{saveSuccess ? 'Đã Lưu!' : 'Lưu Thay Đổi 💖'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: QUẢN LÝ NHIỀU SỰ KIỆN */}
        {activeSubTab === 'events' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateEvent} className="bg-white/90 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-4">
              <h4 className="font-serif font-bold text-slate-800 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Thêm Sự Kiện Đếm Ngược Mới</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên sự kiện:</label>
                <input
                  type="text"
                  placeholder="VD: Sinh nhật bé yêu, Kỷ niệm 1 năm..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              <VietnameseDatePicker
                value={newEventDate}
                onChange={setNewEventDate}
                label="Chọn Thời Gian Diễn Ra Sự Kiện (Chuẩn Tiếng Việt)"
              />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn biểu tượng:</label>
                <div className="flex flex-wrap gap-2">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewEventIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition ${
                        newEventIcon === emoji
                          ? 'bg-rose-500 text-white ring-2 ring-rose-300 scale-110'
                          : 'bg-rose-50 hover:bg-rose-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mô tả / Lời nhắn ngắn:</label>
                <input
                  type="text"
                  placeholder="VD: Ngày thiên thần nhỏ đáng yêu bước đến thế giới này ✨"
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold shadow hover:scale-105 transition"
                >
                  + Thêm Vào Danh Sách Sự Kiện
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Các Sự Kiện Đã Đặt ({(coupleData.events || []).length})
                </span>
                <span className="text-[11px] text-rose-500 font-medium">
                  Sự kiện gần nhất sẽ tự động hiện ở Trang chủ!
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(coupleData.events || []).map((ev) => {
                  const d = new Date(ev.date);
                  const isPast = d.getTime() < Date.now();

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isPast ? 'bg-slate-50/70 border-slate-200 opacity-60' : 'bg-white border-rose-100 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-2xl">{ev.icon || '🎁'}</span>
                        <div className="min-w-0">
                          <h5 className="font-serif font-bold text-slate-800 text-sm truncate">
                            {ev.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-rose-400" />
                            <span>{formatVietnameseFull(ev.date)}</span>
                            {isPast && <span className="text-slate-400">(Đã qua)</span>}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteEvent(ev.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                        title="Xóa sự kiện này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ NHẠC & UPLOAD MP3 */}
        {activeSubTab === 'music' && (
          <div className="space-y-6">
            
            {/* Form tải nhạc */}
            <form onSubmit={handleMusicUploadSubmit} className="bg-white/90 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-4">
              <h4 className="font-serif font-bold text-slate-800 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-500" />
                <span>Tải Lên Bài Hát Mới Từ Thiết Bị (.mp3)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên bài hát:</label>
                  <input
                    type="text"
                    placeholder="VD: Nàng Thơ, Đôi Mươi..."
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ca sĩ / Lời nhắn:</label>
                  <input
                    type="text"
                    placeholder="VD: Hoàng Dũng, Gửi bé yêu..."
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn file âm thanh (.mp3, .wav, .m4a):</label>
                <input
                  type="file"
                  ref={musicModalFileInputRef}
                  accept="audio/*"
                  required
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingMusic}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold shadow hover:scale-105 transition"
                >
                  {isUploadingMusic ? 'Đang lưu vào máy...' : '💾 Lưu Vào Danh Sách Nhạc'}
                </button>
              </div>
            </form>

            {/* Danh sách bài hát hiện có */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Toàn Bộ Danh Sách Nhạc ({activePlaylist.length} bài)
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activePlaylist.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className="p-3 bg-white rounded-2xl border border-rose-100 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <Disc className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-slate-800 text-xs truncate">
                          {song.title}
                        </h5>
                        <p className="text-[10px] text-rose-500 truncate flex items-center gap-1.5">
                          <span>{song.artist}</span>
                          {song.isCustom && (
                            <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                              Tải lên
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {song.isCustom && (
                      <button
                        onClick={() => removeCustomSong(song.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                        title="Xóa bài hát tự tải lên này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
