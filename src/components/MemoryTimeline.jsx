import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Heart, Sparkles, Image, 
  Camera, Eye, Tag, ChevronDown, ZoomIn, Plus, 
  Trash2, Video, Play, Film, Filter 
} from 'lucide-react';
import { coupleConfig } from '../data/config';
import { getMemoriesFromDB, saveMemoryToDB, deleteMemoryFromDB, clearAllDefaultMemories } from '../utils/memoriesDB';
import { syncPushMemories, syncPullMemories, subscribeToFirebase } from '../utils/cloudSync';
import { formatVietnameseFull, formatVietnameseDateOnly } from '../utils/dateUtils';
import AddMemoryModal from './AddMemoryModal';

export default function MemoryTimeline() {
  const [activeView, setActiveView] = useState('timeline'); // 'timeline' | 'polaroid'
  const [memories, setMemories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [likes, setLikes] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'video' | 'image'

  // Tải kỷ niệm từ IndexedDB & Firebase khi khởi động
  useEffect(() => {
    loadAllMemories();

    // Kéo dữ liệu kỷ niệm từ đám mây Firebase
    syncPullMemories().then(async (remoteItems) => {
      if (Array.isArray(remoteItems) && remoteItems.length > 0) {
        for (const item of remoteItems) {
          await saveMemoryToDB(item);
        }
        await loadAllAllMemoriesForce();
      }
    });

    // Lắng nghe cập nhật kỷ niệm thời gian thực (SSE)
    const unsubscribe = subscribeToFirebase('memories', async (remoteItems) => {
      if (Array.isArray(remoteItems)) {
        for (const item of remoteItems) {
          await saveMemoryToDB(item);
        }
        await loadAllAllMemoriesForce();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadAllMemories = async () => {
    try {
      await clearAllDefaultMemories();
      const dbItems = await getMemoriesFromDB();
      const realItems = (dbItems || []).filter((item) => !String(item.id).startsWith('default-'));
      realItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMemories(realItems);
    } catch (err) {
      console.error('Lỗi khi tải kỷ niệm:', err);
    }
  };

  const handleAddMemory = async (newMemory) => {
    await saveMemoryToDB(newMemory);
    const updated = await loadAllAllMemoriesForce();
    // Đẩy danh sách kỷ niệm mới lên Firebase đồng bộ 2 máy
    if (updated) syncPushMemories(updated);
  };

  const loadAllAllMemoriesForce = async () => {
    const items = await getMemoriesFromDB();
    const realItems = (items || []).filter((item) => !String(item.id).startsWith('default-'));
    realItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMemories(realItems);
    return realItems;
  };

  const handleDeleteMemory = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa kỷ niệm này?')) {
      await deleteMemoryFromDB(id);
      const remaining = memories.filter((m) => m.id !== id);
      setMemories(remaining);
      syncPushMemories(remaining);
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  const handleLike = (id, e) => {
    e.stopPropagation();
    setLikes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // Lọc theo loại phương tiện
  const filteredMemories = memories.filter((m) => {
    if (filterType === 'video') return m.mediaType === 'video';
    if (filterType === 'image') return m.mediaType !== 'video';
    return true;
  });

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-8">
      
      {/* Modal Thêm Kỷ Niệm Mới */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveMemory={handleAddMemory}
      />

      {/* Header & Subtitle */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-rose-100/80 px-4 py-1.5 rounded-full text-rose-700 text-xs font-semibold">
          <Camera className="w-4 h-4 text-rose-500" />
          <span>Nhật Ký Tình Yêu Của Hai Đứa</span>
        </div>

        <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-800">
          Kỷ Niệm Của Tụi Mình 📸🎬
        </h2>
        
        <p className="text-sm md:text-base text-slate-600 max-w-md mx-auto">
          Tự do viết tiếp những câu chuyện, tải lên ảnh và video đáng nhớ nhất của chúng mình!
        </p>

        {/* Nút Viết Kỷ Niệm Mới & Switcher */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold text-xs md:text-sm shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Viết Kỷ Niệm Mới (Ảnh & Video)</span>
          </button>

          {/* View Switcher Pill */}
          <div className="inline-flex p-1 bg-white/90 rounded-full border border-rose-200 shadow-xs">
            <button
              onClick={() => setActiveView('timeline')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeView === 'timeline'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Dòng Thời Gian
            </button>
            <button
              onClick={() => setActiveView('polaroid')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeView === 'polaroid'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Album Polaroid
            </button>
          </div>
        </div>

        {/* Filter Pill: Tất cả | Video | Ảnh */}
        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Lọc:</span>
          {[
            { id: 'all', label: `Tất cả (${memories.length})` },
            { id: 'video', label: `🎬 Video (${memories.filter(m => m.mediaType === 'video').length})` },
            { id: 'image', label: `📸 Hình ảnh (${memories.filter(m => m.mediaType !== 'video').length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 rounded-full font-medium transition ${
                filterType === f.id
                  ? 'bg-rose-100 text-rose-700 border border-rose-300 font-semibold'
                  : 'bg-white/80 text-slate-500 hover:text-slate-700 border border-rose-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* EMPTY STATE: Khi chưa có kỷ niệm nào */}
      {filteredMemories.length === 0 && (
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-rose-200 shadow-md space-y-4 my-6 animate-in fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            📷
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-lg sm:text-2xl text-slate-800">
              Chưa có kỷ niệm nào được lưu
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Hành trình tình yêu của hai bạn bắt đầu từ đây! Sắp tới 20/10 hay những buổi hẹn hò, đi chơi, hãy chụp ảnh, quay video và bấm nút bên dưới để lưu giữ khoảnh khắc ngọt ngào nhé 💕
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Viết Kỷ Niệm Đầu Tiên (Ảnh & Video)</span>
          </button>
        </div>
      )}

      {/* VIEW 1: TIMELINE */}
      {activeView === 'timeline' && filteredMemories.length > 0 && (
        <div className="relative pt-6">
          {/* Vertical Glowing Line */}
          <div className="absolute left-4 md:left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-rose-300 via-pink-400 to-rose-200 -translate-x-1/2 rounded-full hidden md:block" />
          <div className="absolute left-6 top-8 bottom-8 w-1 bg-gradient-to-b from-rose-300 via-pink-400 to-rose-200 -translate-x-1/2 rounded-full md:hidden" />

          <div className="space-y-12">
            {filteredMemories.map((item, index) => {
              const isEven = index % 2 === 0;
              const likeCount = (likes[item.id] || 0) + (item.likes || 12);
              const isVideo = item.mediaType === 'video';

              return (
                <div
                  key={item.id}
                  className={`relative flex flex-col md:flex-row items-center ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Center Dot Indicator */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-rose-400 shadow-lg flex items-center justify-center z-10">
                    {isVideo ? (
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="w-full md:w-[46%] pl-14 md:pl-0">
                    <div className="glass-card rounded-2xl overflow-hidden border border-rose-200/90 shadow-md hover:shadow-xl transition-all duration-300 group">
                      
                      {/* Media Container (Image OR Video) */}
                      <div className="relative h-52 md:h-60 overflow-hidden bg-black/5 cursor-pointer" onClick={() => setSelectedItem(item)}>
                        {isVideo ? (
                          <div className="w-full h-full relative group">
                            <video
                              src={item.displayUrl || item.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseEnter={(e) => e.target.play().catch(() => {})}
                              onMouseLeave={(e) => e.target.pause()}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition">
                              <div className="w-12 h-12 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                <Play className="w-6 h-6 translate-x-0.5 fill-rose-600" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.displayUrl || item.mediaUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Tag */}
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-rose-600 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                          {isVideo ? <Film className="w-3 h-3 text-purple-500" /> : <Tag className="w-3 h-3" />}
                          {item.tag || 'Kỷ niệm'}
                        </span>

                        {/* Location */}
                        <span className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1 drop-shadow-md">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          {item.location || 'Nơi hẹn hò'}
                        </span>

                        {/* Video Badge */}
                        {isVideo && (
                          <span className="absolute top-3 right-3 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video
                          </span>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-rose-600">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatVietnameseDateOnly(item.date)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleLike(item.id, e)}
                              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-rose-100 transition active:scale-95"
                            >
                              <Heart className="w-3.5 h-3.5 fill-rose-500" />
                              <span>{likeCount}</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteMemory(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
                              title="Xóa kỷ niệm này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-serif font-bold text-slate-800 text-lg group-hover:text-rose-600 transition">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: POLAROID GALLERY */}
      {activeView === 'polaroid' && filteredMemories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
          {filteredMemories.map((p, idx) => {
            const likeCount = (likes[p.id] || 0) + (p.likes || 18);
            const isVideo = p.mediaType === 'video';
            const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3', 'rotate-1'];
            const rotClass = rotations[idx % rotations.length];

            return (
              <div
                key={p.id}
                onClick={() => setSelectedItem(p)}
                className={`bg-white p-3.5 pb-6 rounded shadow-xl hover:shadow-2xl border border-slate-100 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:rotate-0 group ${rotClass}`}
              >
                {/* Polaroid Frame */}
                <div className="relative aspect-square overflow-hidden rounded bg-slate-900 mb-3">
                  {isVideo ? (
                    <div className="w-full h-full relative">
                      <video
                        src={p.displayUrl || p.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition">
                        <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 translate-x-0.5 fill-rose-600" />
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🎬 Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={p.displayUrl || p.mediaUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 transition-colors flex items-center justify-center pointer-events-none">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" />
                  </div>
                </div>

                {/* Handwritten Caption */}
                <div className="flex items-center justify-between px-1">
                  <div className="min-w-0 pr-2">
                    <p className="font-cursive text-slate-800 text-base md:text-lg font-bold truncate">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5 truncate">
                      {formatVietnameseDateOnly(p.date)} {p.location ? `• ${p.location}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleLike(p.id, e)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
                    >
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteMemory(p.id, e)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Video Player Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-white/20 animate-in zoom-in-95 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition"
            >
              ✕
            </button>

            {/* Media Player */}
            <div className="relative bg-black flex items-center justify-center max-h-[65vh]">
              {selectedItem.mediaType === 'video' ? (
                <video
                  src={selectedItem.displayUrl || selectedItem.mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[65vh] object-contain"
                />
              ) : (
                <img
                  src={selectedItem.displayUrl || selectedItem.mediaUrl}
                  alt={selectedItem.title}
                  className="w-full max-h-[65vh] object-contain"
                />
              )}
            </div>

            {/* Info */}
            <div className="p-6 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  {selectedItem.tag || 'Kỷ niệm'}
                </span>
                <span className="text-xs text-slate-400">
                  {formatVietnameseFull(selectedItem.date)}
                </span>
              </div>

              <h3 className="font-serif font-bold text-slate-800 text-xl md:text-2xl">
                {selectedItem.title}
              </h3>

              {selectedItem.description && (
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pt-1">
                  {selectedItem.description}
                </p>
              )}

              {selectedItem.location && (
                <p className="text-xs text-rose-500 flex items-center gap-1 font-medium pt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedItem.location}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
