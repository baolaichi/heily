import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Play, Pause, Music, X, Sparkles, Check, 
  Flame, Heart, Disc, Volume2, Globe, Loader2, Radio
} from 'lucide-react';
import { CURATED_MUSIC_LIBRARY } from '../data/musicLibrary';

export default function MusicPickerModal({ isOpen, onClose, onSelectSong, currentSongId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'local'
  const [onlineResults, setOnlineResults] = useState([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState(null);
  const previewAudioRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const quickSearchTags = [
    'Sơn Tùng M-TP',
    'Hoàng Dũng',
    'Đức Phúc',
    'Vũ.',
    'SOOBIN',
    'Đen Vâu',
    'AMEE',
    'Chillies',
    'Lofi Chill'
  ];

  // Cleanup audio preview khi unmount hoặc đóng modal
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Tìm kiếm mặc định khi mở modal lần đầu
  useEffect(() => {
    if (isOpen && onlineResults.length === 0) {
      searchOnlineMusic('nhạc tình yêu việt');
    }
  }, [isOpen]);

  // Debounced search khi gõ từ khóa
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      if (activeTab === 'online' && onlineResults.length === 0) {
        searchOnlineMusic('nhạc tình yêu việt');
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchOnlineMusic(searchTerm.trim());
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen]);

  // Hàm gọi Apple Music Search API (CORS friendly, 100% Free, Official Tracks)
  const searchOnlineMusic = async (query) => {
    if (!query) return;
    setIsLoadingOnline(true);
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`
      );
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      const tracks = (data.results || []).map((t) => ({
        id: `apple_${t.trackId}`,
        title: t.trackName,
        artist: t.artistName,
        cover: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '400x400bb') : '',
        url: t.previewUrl,
        genre: t.primaryGenreName || 'V-Pop',
        duration: '0:30',
        isStream: true,
        source: 'Apple Music',
      })).filter((t) => Boolean(t.url));

      setOnlineResults(tracks);
    } catch (err) {
      console.warn('Lỗi tìm nhạc online:', err);
    } finally {
      setIsLoadingOnline(false);
    }
  };

  if (!isOpen) return null;

  // Xử lý nghe thử đoạn nhạc
  const togglePreview = (song, e) => {
    e.stopPropagation();
    if (previewTrackId === song.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewTrackId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(song.url);
      previewAudioRef.current.play().catch(() => {});
      previewAudioRef.current.onended = () => setPreviewTrackId(null);
      setPreviewTrackId(song.id);
    }
  };

  const handleSelect = (song) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewTrackId(null);
    }
    onSelectSong(song);
    onClose();
  };

  const handleCloseModal = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewTrackId(null);
    }
    onClose();
  };

  // Lọc danh sách nhạc local bản full
  const filteredLocalSongs = CURATED_MUSIC_LIBRARY.filter((song) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      song.title.toLowerCase().includes(term) ||
      song.artist.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-b from-rose-50/98 via-white to-pink-50/95 w-full max-w-lg h-[90vh] sm:h-[620px] rounded-3xl shadow-2xl border border-rose-200/90 flex flex-col overflow-hidden pb-safe relative">
        
        {/* Header giống Facebook Music Picker */}
        <div className="p-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Kho Nhạc Phong Cách FB & Story</h3>
              <p className="text-[11px] text-rose-100">Stream hàng triệu bài hát thật từ ca sĩ yêu thích</p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh tìm kiếm & Tabs */}
        <div className="p-3 border-b border-rose-100 bg-white/90 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bài hát, ca sĩ (Sơn Tùng, Hoàng Dũng, Vũ...)"
              className="w-full pl-9 pr-8 py-2 bg-rose-50/70 border border-rose-200 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab chọn nguồn nhạc */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-rose-100/70 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'online'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-rose-700 hover:bg-rose-200/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Stream Trực Tuyến</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'local'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-rose-700 hover:bg-rose-200/60'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Bản Full Đôi Ta</span>
              </button>
            </div>

            {isLoadingOnline && activeTab === 'online' && (
              <div className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            )}
          </div>

          {/* Quick tags gợi ý */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  setActiveTab('online');
                }}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 whitespace-nowrap transition active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách bài hát */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'online' ? (
            // Danh sách nhạc Online từ Apple Music Stream
            onlineResults.length === 0 && !isLoadingOnline ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Disc className="w-12 h-12 text-rose-300 mb-2 animate-spin-slow" />
                <p className="text-sm font-medium text-slate-600">Chưa có kết quả tìm kiếm</p>
                <p className="text-xs text-slate-400 mt-1">Gõ tên bài hát hoặc chọn gợi ý ca sĩ ở trên nhé</p>
              </div>
            ) : (
              onlineResults.map((song) => {
                const isPlayingPreview = previewTrackId === song.id;
                const isSelected = currentSongId === song.id;

                return (
                  <div
                    key={song.id}
                    onClick={() => handleSelect(song)}
                    className={`group p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-100/90 border-rose-400 shadow-sm'
                        : 'bg-white/90 border-rose-100 hover:border-rose-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Ảnh bài hát + Nút Nghe thử */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs border border-rose-200 bg-rose-50">
                        {song.cover ? (
                          <img
                            src={song.cover}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-400">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => togglePreview(song, e)}
                          className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
                            isPlayingPreview ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                          }`}
                          title={isPlayingPreview ? 'Tạm dừng nghe thử' : 'Nghe thử đoạn 30s'}
                        >
                          {isPlayingPreview ? (
                            <Pause className="w-5 h-5 fill-white animate-pulse" />
                          ) : (
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          )}
                        </button>
                      </div>

                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                            {song.title}
                          </h4>
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                            Stream
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {song.artist} • <span className="text-rose-500 font-medium">{song.genre}</span>
                        </p>
                      </div>
                    </div>

                    {/* Nút Chọn bài */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="text-xs text-rose-600 font-bold flex items-center gap-1 bg-rose-200/80 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Đã chọn
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(song);
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xs group-hover:scale-105 active:scale-95 transition"
                        >
                          Chọn bài
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Danh sách nhạc Bản Full của đôi ta (Local MP3s)
            filteredLocalSongs.map((song) => {
              const isPlayingPreview = previewTrackId === song.id;
              const isSelected = currentSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={`group p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-100/90 border-rose-400 shadow-sm'
                      : 'bg-white/90 border-rose-100 hover:border-rose-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs border border-rose-200 bg-rose-50">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => togglePreview(song, e)}
                        className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
                          isPlayingPreview ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                        }`}
                        title={isPlayingPreview ? 'Tạm dừng nghe thử' : 'Nghe thử bản full'}
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-5 h-5 fill-white animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {song.title}
                        </h4>
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                          Bản Full
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {song.artist} • <span className="text-rose-500 font-medium">{song.genre}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <span className="text-xs text-rose-600 font-bold flex items-center gap-1 bg-rose-200/80 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Đã chọn
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(song);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xs group-hover:scale-105 active:scale-95 transition"
                      >
                        Chọn bài
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-rose-50/80 border-t border-rose-100 text-center text-[11px] text-slate-500 shrink-0">
          Chạm vào ảnh để nghe thử hoặc bấm <span className="font-bold text-rose-600">Chọn bài</span> để phát nhạc / đặt status 🎵
        </div>

      </div>
    </div>
  );
}
