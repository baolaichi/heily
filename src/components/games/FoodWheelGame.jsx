import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, RotateCcw, Plus, Trash2, Award } from 'lucide-react';

export default function FoodWheelGame() {
  const defaultFoods = [
    { id: 1, name: "Lẩu Haidilao / Lẩu Thái", icon: "🍲", color: "#f87171" },
    { id: 2, name: "Nướng BBQ Hàn Quốc", icon: "🥩", color: "#fb923c" },
    { id: 3, name: "Sushi & Sashimi Nhật", icon: "🍣", color: "#facc15" },
    { id: 4, name: "Pizza & Mì Ý Lãng Mạn", icon: "🍕", color: "#4ade80" },
    { id: 5, name: "Bún Chả / Phở Phố Cổ", icon: "🍜", color: "#38bdf8" },
    { id: 6, name: "Ốc Đêm & Ăn Vặt Vỉa Hè", icon: "🍢", color: "#a78bfa" },
    { id: 7, name: "Trà Sữa & Bánh Ngọt", icon: "🧋", color: "#f472b6" },
    { id: 8, name: "Rooftop Cafe Ngắm Hoàng Hôn", icon: "☕", color: "#fb7185" },
  ];

  const [foods, setFoods] = useState(() => {
    try {
      const saved = localStorage.getItem('date_foods_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultFoods;
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [newFoodName, setNewFoodName] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const canvasRef = useRef(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('date_foods_list', JSON.stringify(foods));
    } catch {}
  }, [foods]);

  // Vẽ bánh xe roulette trên canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;
    const total = foods.length;
    if (total === 0) return;

    const arcSize = (2 * Math.PI) / total;

    ctx.clearRect(0, 0, width, height);

    foods.forEach((item, index) => {
      const angle = index * arcSize;
      ctx.beginPath();
      ctx.fillStyle = item.color || `hsl(${(index * 360) / total}, 75%, 65%)`;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Vẽ chữ và icon
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      
      const label = `${item.icon || '🍽️'} ${item.name.length > 14 ? item.name.slice(0, 14) + '...' : item.name}`;
      ctx.fillText(label, radius - 15, 5);
      ctx.restore();
    });

    // Vẽ tâm bánh xe
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
  }, [foods]);

  const spinWheel = () => {
    if (isSpinning || foods.length < 2) return;

    setIsSpinning(true);
    setSelectedFood(null);

    // Tính toán góc quay ngẫu nhiên (ít nhất 5 vòng = 1800 độ)
    const extraRounds = 5 + Math.floor(Math.random() * 4);
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotationDegree + extraRounds * 360 + randomAngle;

    setRotationDegree(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);

      // Tính ra món ăn trúng thưởng
      // Kim chỉ vào đỉnh trên cùng (270 độ hoặc -90 độ)
      const normalizedDegree = (totalRotation % 360);
      // Kim chỉ vào góc 270 deg (đỉnh bánh xe)
      const sliceSize = 360 / foods.length;
      // Do canvas quay theo chiều kim đồng hồ, góc tại đỉnh là:
      const winningIndex = Math.floor((360 - (normalizedDegree % 360) + 270) % 360 / sliceSize) % foods.length;
      
      const winner = foods[winningIndex];
      setSelectedFood(winner);

      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb923c', '#facc15', '#4ade80'],
      });
    }, 4000);
  };

  const handleAddFood = (e) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6', '#fb7185'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newItem = {
      id: Date.now(),
      name: newFoodName.trim(),
      icon: "🍽️",
      color: randomColor,
    };

    setFoods([...foods, newItem]);
    setNewFoodName('');
  };

  const handleDeleteFood = (id) => {
    if (foods.length <= 2) {
      alert("Cần giữ ít nhất 2 món ăn để quay nhé!");
      return;
    }
    setFoods(foods.filter((f) => f.id !== id));
  };

  const handleResetDefault = () => {
    setFoods(defaultFoods);
  };

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200 shadow-xl max-w-xl mx-auto space-y-4 sm:space-y-6 text-center animate-in fade-in">
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-rose-100 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-rose-700 text-xs font-semibold mb-1">
          <Utensils className="w-3.5 h-3.5 text-rose-500" />
          <span>Trợ Lý Đi Date Thông Minh</span>
        </div>
        <h3 className="font-serif font-bold text-xl sm:text-2xl md:text-3xl text-slate-800">
          Vòng Quay "Hôm Nay Ăn Gì?" 🎡
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Chấm dứt câu hỏi kinh điển "Ăn gì cũng được"! Quay một phát là có câu trả lời ngay.
        </p>
      </div>

      {/* Wheel Container with Pointer */}
      <div className="relative max-w-[250px] sm:max-w-[320px] mx-auto aspect-square flex items-center justify-center p-1 sm:p-2">
        {/* Kim chỉ đỏ phía trên */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[10px] sm:border-l-[14px] border-l-transparent border-r-[10px] sm:border-r-[14px] border-r-transparent border-t-[20px] sm:border-t-[26px] border-t-rose-600 drop-shadow-md" />
        </div>

        {/* Canvas Wheel */}
        <div
          className="w-full h-full rounded-full shadow-xl border-3 sm:border-4 border-white transition-transform duration-[4000ms] ease-out"
          style={{ transform: `rotate(${rotationDegree}deg)` }}
        >
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-full h-full rounded-full"
          />
        </div>
      </div>

      {/* Action Spin Button */}
      <div>
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={`px-5 sm:px-8 py-3 sm:py-3.5 rounded-full font-serif font-bold text-xs sm:text-base text-white shadow-xl transition-all duration-300 ${
            isSpinning
              ? 'bg-slate-400 cursor-not-allowed scale-95'
              : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:scale-105 active:scale-95 shadow-rose-300'
          }`}
        >
          {isSpinning ? 'Đang quay may mắn... 🎲' : 'QUAY NGAY HÔM NAY ĂN GÌ 🎲'}
        </button>
      </div>

      {/* Winner Reveal Card */}
      {selectedFood && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-3xl border-2 border-rose-300 shadow-lg space-y-2 animate-in zoom-in-95">
          <div className="text-3xl animate-bounce">{selectedFood.icon}</div>
          <span className="text-xs font-bold uppercase tracking-widest text-rose-500 block">
            Vũ Trụ Đã Lựa Chọn Cho Hai Đứa:
          </span>
          <h4 className="text-2xl font-serif font-bold text-slate-800">
            {selectedFood.name}
          </h4>
          <p className="text-xs text-slate-600 font-medium">
            Quyết định rồi nha! Mau dắt tay nhau đi thưởng thức thôi nào! 😋
          </p>
        </div>
      )}

      {/* Food Management Accordion */}
      <div className="pt-2 border-t border-rose-100">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowAddDrawer(!showAddDrawer)}
            className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddDrawer ? 'Đóng chỉnh sửa món ăn' : `Tự thêm món ăn khác (${foods.length} món)`}</span>
          </button>

          <button
            onClick={handleResetDefault}
            className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
        </div>

        {showAddDrawer && (
          <div className="mt-4 space-y-3 bg-white/90 p-4 rounded-2xl border border-rose-100 text-left animate-in fade-in">
            {/* Add input */}
            <form onSubmit={handleAddFood} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên món ăn mới (VD: Bánh mì chảo, Bò né...)"
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition"
              >
                + Thêm
              </button>
            </form>

            {/* List of items */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
              {foods.map((food) => (
                <span
                  key={food.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 text-slate-700 rounded-full text-xs font-medium"
                >
                  <span>{food.icon}</span>
                  <span>{food.name}</span>
                  <button
                    onClick={() => handleDeleteFood(food.id)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5"
                    title="Xóa món này"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
