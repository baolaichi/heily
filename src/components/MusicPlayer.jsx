import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Music, 
  Volume2, VolumeX, Disc, Sparkles, Upload, ListMusic, Plus, Trash2, Library 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import MusicPickerModal from './MusicPickerModal';

export default function MusicPlayer({ autoTriggerPlay = false }) {
  const { 
    activePlaylist, setActivePlaylist, 
    uploadCustomSong, removeCustomSong, 
    directPlayTrack 
  } = useCouple();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);

  const audioRef = useRef(null);
  const musicFileInputRef = useRef(null);

  const currentTrack = activePlaylist[currentTrackIndex] || activePlaylist[0] || {
    title: "Giai Điệu Tình Yêu",
    artist: "Dành riêng cho em",
    url: "",
    cover: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=400&auto=format&fit=crop",
  };

  // Lắng nghe phát nhạc trực tiếp (khi chọn từ Status Avatar hoặc bài hát cụ thể)
  useEffect(() => {
    if (!directPlayTrack || !directPlayTrack.url) return;

    const existingIndex = activePlaylist.findIndex((s) => s.url === directPlayTrack.url);
    if (existingIndex >= 0) {
      setCurrentTrackIndex(existingIndex);
    } else {
      const newPlaylist = [...activePlaylist, directPlayTrack];
      setActivePlaylist(newPlaylist);
      setCurrentTrackIndex(newPlaylist.length - 1);
    }

    setIsPlaying(true);
    setIsExpanded(true);

    if (audioRef.current) {
      audioRef.current.src = directPlayTrack.url;
      audioRef.current.play().catch(() => {});
    }
  }, [directPlayTrack]);

  // Khởi tạo và thay đổi bài hát
  useEffect(() => {
    if (!currentTrack.url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(currentTrack.url);
      audioRef.current.loop = false;
      audioRef.current.onended = () => {
        handleNext();
      };
      audioRef.current.onerror = () => {
        console.warn("Audio loading error, switching to next track");
      };
    } else {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentTrack.url]);

  const handleSelectFromFBLibrary = (song) => {
    const existingIndex = activePlaylist.findIndex((s) => s.url === song.url);
    if (existingIndex >= 0) {
      setCurrentTrackIndex(existingIndex);
    } else {
      const newPlaylist = [...activePlaylist, song];
      setActivePlaylist(newPlaylist);
      setCurrentTrackIndex(newPlaylist.length - 1);
    }

    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = song.url;
      audioRef.current.play().catch(() => {});
    }
  };

  // Nhận trigger phát nhạc khi thắng game
  useEffect(() => {
    if (autoTriggerPlay && !isPlaying) {
      togglePlay();
    }
  }, [autoTriggerPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Audio play blocked until gesture: ", err);
        setIsPlaying(false);
      });
    }
  };

  const handleNext = () => {
    if (activePlaylist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % activePlaylist.length);
  };

  const handlePrev = () => {
    if (activePlaylist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + activePlaylist.length) % activePlaylist.length);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Xử lý upload file mp3 từ máy
  const handleMusicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const song = await uploadCustomSong(file);
      // Chuyển sang bài vừa tải lên
      setCurrentTrackIndex(activePlaylist.length);
      setIsPlaying(true);
      setShowPlaylistView(true);
    } catch (err) {
      alert("Không thể tải bài hát lên: " + err.message);
    } finally {
      setIsUploading(false);
      if (musicFileInputRef.current) musicFileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="fixed right-3 sm:bottom-5 sm:right-5 z-40 transition-all duration-300"
      style={{ bottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))' }}
    >
      
      {/* Hidden file input for quick mp3 upload */}
      <input
        type="file"
        ref={musicFileInputRef}
        accept="audio/*"
        className="hidden"
        onChange={handleMusicUpload}
      />

      {/* Expanded Player Box */}
      {isExpanded ? (
        <div className="glass-card rounded-3xl p-4 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 shadow-2xl border border-rose-200/90 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3 border-b border-rose-100 pb-2">
            <div className="flex items-center space-x-2 text-rose-600">
              <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin-slow' : ''}`} />
              <span className="text-xs font-semibold tracking-wider uppercase font-sans">
                {showPlaylistView ? 'Danh Sách Nhạc' : 'Giai Điệu Tình Yêu'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowPlaylistView(!showPlaylistView)}
                className={`p-1.5 rounded-lg text-xs transition ${
                  showPlaylistView ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Danh sách bài hát"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-rose-400 hover:text-rose-600 px-2 py-0.5 rounded-full hover:bg-rose-50 transition"
                title="Thu nhỏ"
              >
                ✕
              </button>
            </div>
          </div>

          {/* VIEW 1: PLAYING SCREEN */}
          {!showPlaylistView ? (
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative group shrink-0">
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className={`w-14 h-14 rounded-full object-cover border-2 border-rose-300 shadow-md ${isPlaying ? 'animate-spin-slow' : ''}`}
                  />
                  <div className="absolute inset-0 rounded-full border border-rose-400 pointer-events-none" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{currentTrack.title}</p>
                  <p className="text-xs text-rose-500 truncate">{currentTrack.artist}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Bài {currentTrackIndex + 1}/{activePlaylist.length}</span>
                    {currentTrack.isCustom && (
                      <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.2 rounded-full font-semibold">
                        Tải lên
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sound waves visualization when playing */}
              <div className="flex items-center justify-center gap-1 h-4 mb-3">
                {[40, 70, 30, 90, 60, 100, 50, 80, 45, 65].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400/80 rounded-full transition-all duration-300"
                    style={{
                      height: isPlaying ? `${Math.max(4, (h * Math.sin(Date.now() / 200 + i)) + 15)}px` : '4px',
                    }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
                  title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrev}
                    className="p-2 text-slate-600 hover:text-rose-600 rounded-full hover:bg-rose-100 transition"
                    title="Bài trước"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-lg shadow-rose-300 hover:scale-105 active:scale-95 transition"
                    title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2 text-slate-600 hover:text-rose-600 rounded-full hover:bg-rose-100 transition"
                    title="Bài tiếp theo"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload quick button */}
                <button
                  onClick={() => musicFileInputRef.current?.click()}
                  className="p-2 text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50 transition"
                  title="Tải thêm bài hát từ máy (.mp3)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 2: PLAYLIST DRAWER */
            <div className="space-y-2">
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {activePlaylist.map((song, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={song.id || idx}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${
                        isCurrent
                          ? 'bg-rose-500 text-white font-semibold shadow-sm'
                          : 'hover:bg-rose-50/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        <span className="w-4 text-center text-[10px] opacity-70">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate">{song.title}</p>
                          <p className={`text-[10px] truncate ${isCurrent ? 'text-rose-100' : 'text-slate-400'}`}>
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      {song.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomSong(song.id);
                          }}
                          className={`p-1 rounded-md hover:bg-rose-600 transition shrink-0 ${
                            isCurrent ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Xóa bài hát này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: FB Music Library & Custom Upload */}
              <div className="pt-2 border-t border-rose-100 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setIsMusicPickerOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:scale-102 active:scale-98 transition"
                >
                  <Music className="w-3.5 h-3.5 animate-bounce" />
                  <span>Chọn Nhạc Phong Cách FB 🎶</span>
                </button>

                <button
                  onClick={() => musicFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs hover:scale-102 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isUploading ? 'Đang nạp file...' : 'Tự tải lên từ máy (.mp3)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Floating mini badge */
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative flex items-center space-x-3 glass-card rounded-full p-2 pr-4 shadow-xl border border-rose-200/80 hover:border-rose-400 transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white shadow-md ${isPlaying ? 'animate-spin-slow' : ''}`}>
              <Disc className="w-6 h-6" />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{currentTrack.title}</p>
            <p className="text-[10px] text-rose-500">{isPlaying ? "Đang phát..." : "Mở bài hát 🎵"}</p>
          </div>
          <Music className="w-4 h-4 text-rose-500 ml-1 group-hover:scale-110 transition" />
        </button>
      )}

      {/* Modal Chọn Nhạc FB */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onSelectSong={handleSelectFromFBLibrary}
        currentSongId={currentTrack?.id}
      />
    </div>
  );
}
