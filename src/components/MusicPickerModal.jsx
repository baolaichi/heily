import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Play, Pause, Music, X, Sparkles, Check, 
  Flame, Heart, Disc, Volume2 
} from 'lucide-react';
import { CURATED_MUSIC_LIBRARY } from '../data/musicLibrary';

export default function MusicPickerModal({ isOpen, onClose, onSelectSong, currentSongId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [previewTrackId, setPreviewTrackId] = useState(null);
  const previewAudioRef = useRef(null);

  const genres = [
    'Tất cả', 
    'Trending 🔥', 
    'Lãng mạn 💕', 
    'Acoustic 🎸', 
    'Chill & Lo-fi ☕', 
    'Piano 🎹', 
    'Tỏ tình 💌'
  ];

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

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

  // Lọc bài hát theo từ khóa và thể loại
  const filteredSongs = CURATED_MUSIC_LIBRARY.filter((song) => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase().trim());
    
    if (selectedGenre === 'Tất cả') return matchesSearch;
    if (selectedGenre === 'Trending 🔥') return matchesSearch && song.trending;
    return matchesSearch && song.genre.includes(selectedGenre.replace(/[^\p{L}\s]/gu, '').trim());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-b from-rose-50/98 via-white to-pink-50/95 w-full max-w-lg h-[85vh] sm:h-[600px] rounded-3xl shadow-2xl border border-rose-200/90 flex flex-col overflow-hidden pb-safe relative">
        
        {/* Header giống Facebook Music Picker */}
        <div className="p-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Kho Nhạc Phong Cách FB</h3>
              <p className="text-[11px] text-rose-100">Chọn giai điệu tình yêu cho hai bạn</p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="p-3 border-b border-rose-100 bg-white/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bài hát, ca sĩ..."
              className="w-full pl-9 pr-8 py-2 bg-rose-50/60 border border-rose-200 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
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

          {/* Thể loại / Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === g
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-rose-100/70 text-rose-700 hover:bg-rose-200/70'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách bài hát */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSongs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Disc className="w-12 h-12 text-rose-300 mb-2 animate-spin-slow" />
              <p className="text-sm font-medium text-slate-600">Không tìm thấy bài hát phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử tìm với tên bài hát hoặc ca sĩ khác nhé</p>
            </div>
          ) : (
            filteredSongs.map((song) => {
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
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs border border-rose-200">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => togglePreview(song, e)}
                        className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity ${
                          isPlayingPreview ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                        }`}
                        title={isPlayingPreview ? 'Tạm dừng nghe thử' : 'Nghe thử'}
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-5 h-5 fill-white" />
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
                        {song.trending && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded-full shrink-0 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Hot
                          </span>
                        )}
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
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-rose-50/70 border-t border-rose-100 text-center text-[11px] text-slate-500 shrink-0">
          Chạm vào ảnh để nghe thử hoặc bấm <span className="font-bold text-rose-600">Chọn bài</span> để phát nhạc 🎵
        </div>

      </div>
    </div>
  );
}
