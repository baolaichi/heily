import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Circle, Plus, Heart, Sparkles, 
  Trash2, Camera, Calendar, Trophy, Filter, Image, X, Award, RotateCcw 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { syncPushGameState, syncPullGameState, subscribeToGame, compressImageToBase64 } from '../utils/cloudSync';
import { playNotificationChime } from '../utils/notificationService';
import { formatVietnameseDateOnly } from '../utils/dateUtils';

export default function CoupleBucketList() {
  const { coupleData } = useCouple();

  const defaultBucketList = [];

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('heily_bucket_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultBucketList;
  });

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'completed' | category
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Lãng Mạn');
  const [newIcon, setNewIcon] = useState('💕');

  // Modal hoàn thành ước mơ
  const [completingItem, setCompletingItem] = useState(null);
  const [completeNote, setCompleteNote] = useState('');
  const [completeImage, setCompleteImage] = useState('');
  const fileInputRef = useRef(null);

  const categories = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chưa xong', value: 'pending' },
    { label: 'Đã hoàn thành', value: 'completed' },
    { label: 'Du Lịch', value: 'Du Lịch' },
    { label: 'Ẩm Thực', value: 'Ẩm Thực' },
    { label: 'Trải Nghiệm', value: 'Trải Nghiệm' },
    { label: 'Lãng Mạn', value: 'Lãng Mạn' },
    { label: 'Tương Lai', value: 'Tương Lai' },
  ];

  // Kéo dữ liệu từ Firebase & lắng nghe realtime
  useEffect(() => {
    syncPullGameState('bucket_list').then((state) => {
      if (state && Array.isArray(state.items)) {
        setItems(state.items);
        try {
          localStorage.setItem('heily_bucket_list', JSON.stringify(state.items));
        } catch (e) {}
      }
    });

    const unsubscribe = subscribeToGame('bucket_list', (remoteState) => {
      if (remoteState && Array.isArray(remoteState.items)) {
        setItems(remoteState.items);
        try {
          localStorage.setItem('heily_bucket_list', JSON.stringify(remoteState.items));
        } catch (e) {}
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Lưu danh sách và đẩy lên Firebase
  const saveItems = async (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem('heily_bucket_list', JSON.stringify(newItems));
    } catch (e) {}
    await syncPushGameState('bucket_list', { items: newItems });
  };

  // Click vào checkbox ước mơ
  const handleToggleItem = (item) => {
    if (item.completed) {
      // Nếu đã xong, cho phép bỏ tick
      if (window.confirm(`Bạn có muốn đánh dấu lại "${item.title}" thành chưa hoàn thành?`)) {
        const updated = items.map((i) => i.id === item.id ? { ...i, completed: false } : i);
        saveItems(updated);
      }
    } else {
      // Mở modal hoàn thành để tải ảnh và viết cảm nghĩ
      setCompletingItem(item);
      setCompleteNote('');
      setCompleteImage('');
    }
  };

  // Xác nhận hoàn thành kèm ảnh minh chứng
  const handleConfirmComplete = async (e) => {
    e.preventDefault();
    if (!completingItem) return;

    playNotificationChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166'],
    });

    const updated = items.map((i) => {
      if (i.id === completingItem.id) {
        return {
          ...i,
          completed: true,
          completedDate: new Date().toISOString().slice(0, 10),
          note: completeNote.trim() || 'Một cột mốc ngọt ngào tụi mình đã làm được cùng nhau!',
          image: completeImage || '',
        };
      }
      return i;
    });

    await saveItems(updated);
    setCompletingItem(null);
  };

  // Thêm ước mơ mới
  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem = {
      id: `bucket-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    await saveItems(updated);

    setNewTitle('');
    setShowAddModal(false);
  };

  // Xóa ước mơ
  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa điều ước này?')) {
      const updated = items.filter((i) => i.id !== id);
      await saveItems(updated);
    }
  };

  // Xử lý nén ảnh minh chứng
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImageToBase64(file, 800, 0.8);
    if (base64) setCompleteImage(base64);
  };

  // Đặt lại toàn bộ danh sách ước mơ (xóa sạch để hai bạn tự tạo mới)
  const handleResetAllBucketList = async () => {
    if (window.confirm("Bạn có muốn xóa sạch danh sách ước mơ để hai bạn tự tạo mới từ đầu không?")) {
      await saveItems([]);
    }
  };

  // Lọc danh sách
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return !item.completed;
    if (activeFilter === 'completed') return item.completed;
    return item.category === activeFilter;
  });

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="py-4 max-w-3xl mx-auto space-y-6 text-center animate-in fade-in">
      
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 px-4 py-1.5 rounded-full text-rose-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
          <span>Hành Trình Chinh Phục Cuộc Sống Cùng Nhau</span>
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-800">
          Danh Sách Ước Mơ Của Đôi Ta 📝
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Những điều ngọt ngào mà hai bạn muốn cùng nhau trải nghiệm và thực hiện trong đời!
        </p>
      </div>

      {/* Progress Card */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-rose-200/90 shadow-md bg-gradient-to-r from-rose-50/70 via-white to-pink-50/70 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-xs sm:text-sm text-slate-800">
              Tiến Độ Ước Mơ Tình Yêu
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-rose-600">
              {completedCount}/{items.length} ({progressPercent}%)
            </span>
            <button
              type="button"
              onClick={handleResetAllBucketList}
              className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition px-2 py-0.5 rounded-full hover:bg-rose-50"
              title="Đặt lại toàn bộ về 0% ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Bắt đầu lại</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-rose-100/80 rounded-full overflow-hidden p-0.5 border border-rose-200">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 italic">
          {items.length === 0
            ? '✨ Hãy cùng nhau thêm những ước mơ đầu tiên của hai đứa vào danh sách nhé!'
            : progressPercent === 100 
              ? '🎉 Thật tuyệt vời! Hai bạn đã hoàn thành tất cả ước mơ cùng nhau!'
              : `Đã hoàn thành ${completedCount} điều ước! Hãy tiếp tục cùng nhau đi hết chặng đường nhé 💕`}
        </p>
      </div>

      {/* Filter and Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setActiveFilter(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === c.value
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Nút thêm điều ước */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ước Mơ Mới</span>
        </button>
      </div>

      {/* Bucket List Items */}
      <div className="space-y-2.5 text-left">
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white/70 rounded-3xl border-2 border-dashed border-rose-200 text-slate-500 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-2xl shadow-inner">
              📝
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base sm:text-lg text-slate-800">
                {items.length === 0 ? 'Chưa có ước mơ nào được tạo' : 'Không tìm thấy điều ước phù hợp'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {items.length === 0 
                  ? 'Danh sách đang hoàn toàn trống để hai bạn tự do ghi lại những điều muốn làm cùng nhau!' 
                  : 'Hãy chọn danh mục khác hoặc bấm Thêm để tạo điều ước mới.'}
              </p>
            </div>
            {items.length === 0 && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm ước mơ đầu tiên của đôi ta</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleItem(item)}
              className={`group p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                item.completed
                  ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs'
                  : 'bg-white hover:bg-rose-50/40 border-slate-200 hover:border-rose-300 shadow-xs'
              }`}
            >
              {/* Checkbox */}
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-rose-500 fill-rose-100" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 group-hover:text-rose-400 transition" />
                )}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs sm:text-sm font-bold ${
                    item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-600 font-semibold">
                    {item.category}
                  </span>
                </div>

                {/* Nếu đã hoàn thành: Hiện ngày & ghi chú */}
                {item.completed && (
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-[11px] text-rose-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Đã cùng nhau hoàn thành ngày {item.completedDate || 'Gần đây'}</span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded-xl border border-rose-100">
                        "{item.note}"
                      </p>
                    )}

                    {item.image && (
                      <div className="mt-1.5 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-rose-200 shadow-xs">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nút xóa */}
              <button
                type="button"
                onClick={(e) => handleDeleteItem(item.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 transition"
                title="Xóa điều ước này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Hoàn Thành Kèm Ảnh Minh Chứng */}
      {completingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm sm:text-base text-slate-800">
                  Chúc Mừng Hoàn Thành! 🎉
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-rose-600">
              {completingItem.title}
            </p>

            <form onSubmit={handleConfirmComplete} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cảm nghĩ / Kỷ niệm khi hoàn thành:
                </label>
                <textarea
                  rows={2}
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder="Ví dụ: Buổi chiều hôm ấy thật đẹp và hạnh phúc..."
                  className="w-full p-2.5 rounded-xl border border-rose-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Đính kèm 1 bức ảnh kỷ niệm (Tùy chọn):
                </label>
                {completeImage ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-rose-300">
                    <img src={completeImage} alt="Ảnh hoàn thành" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCompleteImage('')}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tải ảnh lên 📸</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingItem(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition"
                >
                  Xác nhận hoàn thành 💕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Ước Mơ Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <h3 className="font-bold text-sm sm:text-base text-slate-800">
                Thêm Điều Ước Đôi Ta Mới ✨
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Điều hai bạn muốn cùng nhau làm:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Cùng nhau đón bình minh trên đỉnh Fansipan..."
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Danh mục:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                >
                  <option value="Du Lịch">🏖️ Du Lịch & Khám Phá</option>
                  <option value="Ẩm Thực">🍽️ Ẩm Thực & Nấu Ăn</option>
                  <option value="Trải Nghiệm">✨ Trải Nghiệm Mới</option>
                  <option value="Lãng Mạn">💕 Lãng Mạn & Hẹn Hò</option>
                  <option value="Tương Lai">🏡 Tương Lai & Tổ Ấm</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition disabled:opacity-50"
                >
                  Lưu Điều Ước ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
