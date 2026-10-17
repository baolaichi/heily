import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Puzzle, Sparkles, RotateCcw, Eye, EyeOff, Upload, 
  Users, User, Trophy, Heart, Check, Clock, Flame 
} from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';
import { 
  syncPushGameState, syncPullGameState, subscribeToGame, compressImageToBase64 
} from '../../utils/cloudSync';

export default function PuzzleGame() {
  const { coupleData, myRole, setMyRole } = useCouple();

  // Mode: 'solo' | 'online'
  const [playMode, setPlayMode] = useState('online');

  // Grid size: 3 (3x3 = 9 tiles) or 4 (4x4 = 16 tiles)
  const [gridSize, setGridSize] = useState(3);
  const totalTiles = gridSize * gridSize;

  // Selected preset image or custom uploaded image
  const defaultImages = [
    {
      id: 'couple-avatar',
      label: 'Avatar Đôi Ta 💕',
      url: coupleData.girl.avatar || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'sunset-love',
      label: 'Hoàng Hôn 🌅',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'sweet-flowers',
      label: 'Vườn Hoa 🌸',
      url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'starry-night',
      label: 'Bầu Trời Sao ✨',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    },
  ];

  const [currentImage, setCurrentImage] = useState(defaultImages[0].url);
  const [tiles, setTiles] = useState(() => createShuffledTiles(gridSize));
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [lastMovedBy, setLastMovedBy] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  // Tạo mảng xáo trộn vị trí các mảnh ghép
  function createShuffledTiles(size) {
    const total = size * size;
    const array = Array.from({ length: total }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    // Đảm bảo không bị trùng khớp 100% ngay lúc khởi tạo
    const isAlreadySolved = array.every((val, idx) => val === idx);
    if (isAlreadySolved && total > 1) {
      [array[0], array[1]] = [array[1], array[0]];
    }
    return array;
  }

  // Khởi động đồng hồ bấm giờ
  useEffect(() => {
    if (!isCompleted) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  // Lưu role vào localStorage
  const handleRoleChange = (role) => {
    setMyRole(role);
    try {
      localStorage.setItem('puzzle_my_role', role);
    } catch {}
  };

  // Đồng bộ Online Realtime qua Firebase
  useEffect(() => {
    if (playMode !== 'online') return;

    // Lấy dữ liệu ván đấu hiện tại
    syncPullGameState('love_puzzle').then((state) => {
      if (state && Array.isArray(state.tiles) && state.tiles.length === totalTiles) {
        setTiles(state.tiles);
        setMoveCount(state.moveCount || 0);
        setGridSize(state.gridSize || 3);
        if (state.currentImage) setCurrentImage(state.currentImage);
        if (state.lastMovedBy) setLastMovedBy(state.lastMovedBy);
        setIsCompleted(state.isCompleted || false);
      }
    });

    // Lắng nghe di chuyển thời gian thực từ đối phương
    const unsubscribe = subscribeToGame('love_puzzle', (remoteState) => {
      if (!remoteState || !Array.isArray(remoteState.tiles)) return;

      setTiles(remoteState.tiles);
      setMoveCount(remoteState.moveCount || 0);
      if (remoteState.gridSize) setGridSize(remoteState.gridSize);
      if (remoteState.currentImage) setCurrentImage(remoteState.currentImage);
      if (remoteState.lastMovedBy) setLastMovedBy(remoteState.lastMovedBy);

      // Kiểm tra thắng
      if (remoteState.isCompleted) {
        setIsCompleted(true);
        triggerVictoryEffects();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [playMode, totalTiles]);

  // Kiểm tra hoàn thành
  const checkVictory = (currentTiles) => {
    const win = currentTiles.every((val, idx) => val === idx);
    if (win) {
      setIsCompleted(true);
      triggerVictoryEffects();
      return true;
    }
    return false;
  };

  // Hiệu ứng pháo hoa hoa lệ khi ghép xong ảnh
  const triggerVictoryEffects = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd166', '#ff758f'],
    });
  };

  // Xử lý chạm/click chọn mảnh ghép và hoán đổi vị trí
  const handleTileClick = async (clickedIndex) => {
    if (isCompleted) return;

    // Nếu chưa chọn mảnh đầu tiên
    if (selectedTileIndex === null) {
      setSelectedTileIndex(clickedIndex);
      return;
    }

    // Nếu bấm lại chính mảnh đó -> hủy chọn
    if (selectedTileIndex === clickedIndex) {
      setSelectedTileIndex(null);
      return;
    }

    // Hoán đổi vị trí giữa 2 mảnh
    const newTiles = [...tiles];
    const temp = newTiles[selectedTileIndex];
    newTiles[selectedTileIndex] = newTiles[clickedIndex];
    newTiles[clickedIndex] = temp;

    setSelectedTileIndex(null);
    setTiles(newTiles);
    const newMoves = moveCount + 1;
    setMoveCount(newMoves);

    const playerName = myRole === 'boy' 
      ? (coupleData.boy.nickname || coupleData.boy.name || 'Bug 👑')
      : (coupleData.girl.nickname || coupleData.girl.name || 'Heily 🎀');

    setLastMovedBy(playerName);

    const win = checkVictory(newTiles);

    // Nếu đang chơi Online: Đẩy nước đi lên Firebase ngay tức thì
    if (playMode === 'online') {
      setIsSyncing(true);
      await syncPushGameState('love_puzzle', {
        tiles: newTiles,
        gridSize,
        currentImage,
        moveCount: newMoves,
        lastMovedBy: playerName,
        isCompleted: win,
      });
      setIsSyncing(false);
    }
  };

  // Khởi động lại ván cờ (Xáo trộn)
  const handleRestart = async (newSize = gridSize, newImg = currentImage) => {
    const shuffled = createShuffledTiles(newSize);
    setTiles(shuffled);
    setSelectedTileIndex(null);
    setIsCompleted(false);
    setMoveCount(0);
    setSecondsElapsed(0);

    const playerName = myRole === 'boy' 
      ? (coupleData.boy.nickname || 'Bug')
      : (coupleData.girl.nickname || 'Heily');

    if (playMode === 'online') {
      await syncPushGameState('love_puzzle', {
        tiles: shuffled,
        gridSize: newSize,
        currentImage: newImg,
        moveCount: 0,
        lastMovedBy: `${playerName} đã xáo trộn lại`,
        isCompleted: false,
      });
    }
  };

  // Đổi kích thước lưới (3x3 hoặc 4x4)
  const handleGridSizeChange = (newSize) => {
    setGridSize(newSize);
    handleRestart(newSize, currentImage);
  };

  // Đổi ảnh ghép
  const handleImageSelect = (imgUrl) => {
    setCurrentImage(imgUrl);
    handleRestart(gridSize, imgUrl);
  };

  // Tải ảnh kỷ niệm riêng từ thiết bị
  const handleCustomImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await compressImageToBase64(file, 800, 0.8);
    if (base64) {
      setCurrentImage(base64);
      handleRestart(gridSize, base64);
    }
  };

  // Định dạng thời gian mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Chàng Trai';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Cô Gái';

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200/90 shadow-xl max-w-2xl mx-auto space-y-5 text-center animate-in fade-in">
      
      {/* Title & Badge */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 px-3.5 py-1 rounded-full text-rose-700 text-xs font-semibold mb-1 shadow-2xs">
          <Puzzle className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
          <span>Mini-game Đôi Ta Cùng Chơi Trực Tuyến</span>
        </div>
        <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
          Ghép Hình Tình Yêu 💕
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Hai bạn cùng nhau di chuyển các mảnh ghép để hoàn thiện bức tranh kỷ niệm ngọt ngào!
        </p>
      </div>

      {/* Mode Selector & Role Selection */}
      <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-full border border-rose-200 text-xs">
            <button
              type="button"
              onClick={() => setPlayMode('online')}
              className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 ${
                playMode === 'online'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Chơi Cùng Nhau (Online)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayMode('solo')}
              className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 ${
                playMode === 'solo'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Tự Ghép (Solo)</span>
            </button>
          </div>

          {/* Grid size toggle */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Lưới:</span>
            <button
              type="button"
              onClick={() => handleGridSizeChange(3)}
              className={`px-2.5 py-0.5 rounded-lg font-bold border transition ${
                gridSize === 3
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
              }`}
            >
              3x3
            </button>
            <button
              type="button"
              onClick={() => handleGridSizeChange(4)}
              className={`px-2.5 py-0.5 rounded-lg font-bold border transition ${
                gridSize === 4
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
              }`}
            >
              4x4
            </button>
          </div>
        </div>

        {/* Khi chơi Online: Cho phép chọn nhân vật */}
        {playMode === 'online' && (
          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-600 font-medium">Bạn đang điều khiển vai:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('boy')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition ${
                  myRole === 'boy'
                    ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <span>👑</span>
                <span>{boyName}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('girl')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition ${
                  myRole === 'girl'
                    ? 'bg-pink-500 text-white border-pink-500 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-pink-200 hover:bg-pink-50'
                }`}
              >
                <span>🎀</span>
                <span>{girlName}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-2xl border border-rose-100 shadow-xs text-center text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Số bước</span>
          <span className="font-bold text-slate-800 text-sm sm:text-base">{moveCount}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Thời gian</span>
          <span className="font-bold text-rose-600 text-sm sm:text-base">{formatTime(secondsElapsed)}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Nước đi gần nhất</span>
          <span className="font-semibold text-slate-700 text-[11px] truncate block">
            {lastMovedBy || 'Chưa ai đi'}
          </span>
        </div>
      </div>

      {/* Puzzle Board Container */}
      <div className="relative mx-auto max-w-[340px] sm:max-w-[400px] aspect-square rounded-2xl overflow-hidden border-4 border-rose-300 shadow-xl bg-rose-50/50">
        
        {/* Lưới các mảnh ghép */}
        <div 
          className="w-full h-full grid gap-1 p-1 bg-white"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((originalPos, currentIndex) => {
            const isSelected = selectedTileIndex === currentIndex;
            const isCorrect = originalPos === currentIndex;

            // Tính vị trí cắt của bức ảnh tương ứng mảnh ghép
            const row = Math.floor(originalPos / gridSize);
            const col = originalPos % gridSize;
            const xPercent = (col / (gridSize - 1)) * 100;
            const yPercent = (row / (gridSize - 1)) * 100;

            return (
              <div
                key={currentIndex}
                onClick={() => handleTileClick(currentIndex)}
                className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 select-none ${
                  isSelected
                    ? 'ring-4 ring-rose-500 scale-95 shadow-lg z-10'
                    : 'hover:opacity-95 hover:scale-98 active:scale-95'
                } ${isCorrect && !isCompleted ? 'border border-emerald-400/80 shadow-2xs' : 'border border-rose-100'}`}
                style={{
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                  backgroundPosition: `${xPercent}% ${yPercent}%`,
                }}
              >
                {/* Số thứ tự mảnh nhỏ ở góc */}
                <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1 rounded-sm pointer-events-none">
                  {originalPos + 1}
                </span>

                {/* Tích xanh nếu đã về đúng vị trí */}
                {isCorrect && !isCompleted && (
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] pointer-events-none shadow-xs">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Victory Overlay Khi Ghép Xong */}
        {isCompleted && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white mb-2 shadow-lg animate-bounce">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <h4 className="font-serif font-bold text-xl sm:text-2xl text-rose-200">
              Hoàn Thành Xuất Sắc! 🎉
            </h4>
            <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-xs text-center">
              Hai bạn đã ghép thành công bức tranh tình yêu trong {moveCount} bước!
            </p>
            <button
              type="button"
              onClick={() => handleRestart()}
              className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại ván mới</span>
            </button>
          </div>
        )}

        {/* Modal Xem trước ảnh mẫu */}
        {showPreview && (
          <div 
            onClick={() => setShowPreview(false)}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 z-20 cursor-pointer animate-in fade-in"
          >
            <img 
              src={currentImage} 
              alt="Mẫu" 
              className="w-full h-full object-cover rounded-xl"
            />
            <span className="absolute bottom-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              Chạm để tắt xem trước
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Xem trước, Xáo trộn, Tải ảnh */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 transition flex items-center gap-1.5 shadow-2xs active:scale-95"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showPreview ? 'Ẩn ảnh mẫu' : 'Xem ảnh gốc'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleRestart()}
          className="px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xáo trộn lại</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-2xs active:scale-95"
          title="Tải ảnh kỷ niệm của hai bạn để ghép"
        >
          <Upload className="w-3.5 h-3.5 text-rose-500" />
          <span>Ghép ảnh của hai bạn</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCustomImageUpload}
        />
      </div>

      {/* Preset Image Selection */}
      <div className="pt-2 border-t border-rose-100">
        <span className="text-[11px] text-slate-500 font-semibold block mb-2">
          Hoặc chọn các bức tranh lãng mạn có sẵn:
        </span>
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {defaultImages.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => handleImageSelect(img.url)}
              className={`p-1 rounded-xl border flex items-center gap-1.5 transition ${
                currentImage === img.url
                  ? 'border-rose-500 bg-rose-50 font-bold text-rose-700 ring-2 ring-rose-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200'
              }`}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-[11px] pr-1">{img.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
