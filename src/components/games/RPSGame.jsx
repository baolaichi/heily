import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, Heart, Flame, Award } from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';

export default function RPSGame() {
  const { coupleData } = useCouple();

  const choices = [
    { id: 'rock', name: 'Búa', icon: '✊', beats: 'scissors' },
    { id: 'paper', name: 'Bao', icon: '✋', beats: 'rock' },
    { id: 'scissors', name: 'Kéo', icon: '✌️', beats: 'paper' },
  ];

  const penalties = [
    "Hôn nhẹ lên trán người yêu một cái 💋",
    "Bao một ly trà sữa hoặc sinh tố theo sở thích 🧋",
    "Khen người yêu 5 câu ngọt ngào không được trùng lặp 🌸",
    "Làm mặt cười xấu xí cho người kia chụp lại 📸",
    "Hát một câu hát tỏ tình bất kỳ 🎶",
    "Chịu phạt bị nhéo má yêu 10 giây 🥰",
    "Được người yêu nắm tay dạo phố suốt buổi tối 👫",
  ];

  const [playerChoice, setPlayerChoice] = useState(null);
  const [partnerChoice, setPartnerChoice] = useState(null);
  const [result, setResult] = useState(null); // 'win' | 'lose' | 'tie'
  const [currentPenalty, setCurrentPenalty] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [stats, setStats] = useState({ win: 0, lose: 0, tie: 0 });

  const playRound = (userChoice) => {
    if (isRolling) return;
    setIsRolling(true);
    setPlayerChoice(userChoice);
    setResult(null);
    setCurrentPenalty('');

    // Hiệu ứng xoay xoay hồi hộp
    let counter = 0;
    const interval = setInterval(() => {
      setPartnerChoice(choices[counter % 3]);
      counter++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const randomOpponent = choices[Math.floor(Math.random() * choices.length)];
      setPartnerChoice(randomOpponent);
      setIsRolling(false);

      const penalty = penalties[Math.floor(Math.random() * penalties.length)];
      setCurrentPenalty(penalty);

      if (userChoice.id === randomOpponent.id) {
        setResult('tie');
        setStats((prev) => ({ ...prev, tie: prev.tie + 1 }));
      } else if (userChoice.beats === randomOpponent.id) {
        setResult('win');
        setStats((prev) => ({ ...prev, win: prev.win + 1 }));
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } else {
        setResult('lose');
        setStats((prev) => ({ ...prev, lose: prev.lose + 1 }));
      }
    }, 1000);
  };

  const handleReset = () => {
    setPlayerChoice(null);
    setPartnerChoice(null);
    setResult(null);
    setCurrentPenalty('');
    setStats({ win: 0, lose: 0, tie: 0 });
  };

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200 shadow-xl max-w-xl mx-auto space-y-4 sm:space-y-6 text-center animate-in fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-rose-100 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-rose-700 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Oẳn Tù Tì Tình Yêu</span>
        </div>
        <h3 className="font-serif font-bold text-xl sm:text-2xl md:text-3xl text-slate-800">
          Kéo - Búa - Bao ✌️✊✋
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Thử vận may xem ai sẽ phải nhận hình phạt ngọt ngào hôm nay nhé!
        </p>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-white/80 p-2.5 sm:p-3 rounded-2xl border border-rose-100 shadow-xs">
        <div className="p-1 sm:p-2">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">Bạn Thắng</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-emerald-600">{stats.win}</span>
        </div>
        <div className="p-1 sm:p-2">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">Hòa Nhau</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-slate-600">{stats.tie}</span>
        </div>
        <div className="p-1 sm:p-2">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium truncate">Bé Thắng</span>
          <span className="text-lg sm:text-xl font-bold font-serif text-rose-600">{stats.lose}</span>
        </div>
      </div>

      {/* Arena Display */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center bg-rose-50/70 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-rose-200">
        {/* Player choice */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 block truncate">Lựa Chọn Của Bạn</span>
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-2xl bg-white shadow-md border-2 border-rose-200 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl transition-all">
            {playerChoice ? playerChoice.icon : '❓'}
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-rose-600 block">
            {playerChoice ? playerChoice.name : 'Đang đợi...'}
          </span>
        </div>

        {/* Partner choice */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 block truncate">
            {coupleData.girl.nickname || coupleData.girl.name} Ra
          </span>
          <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-2xl bg-white shadow-md border-2 border-pink-200 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl transition-all ${isRolling ? 'animate-bounce' : ''}`}>
            {partnerChoice ? partnerChoice.icon : '❓'}
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-pink-600 block">
            {isRolling ? 'Đang tung...' : partnerChoice ? partnerChoice.name : 'Đang đợi...'}
          </span>
        </div>
      </div>

      {/* Choice Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-600 block">Hãy chọn nước đi của bạn:</span>
        <div className="flex items-center justify-center gap-3">
          {choices.map((c) => (
            <button
              key={c.id}
              disabled={isRolling}
              onClick={() => playRound(c)}
              className="flex-1 max-w-[100px] p-4 bg-white/90 hover:bg-rose-50 rounded-2xl border border-rose-200 shadow-sm hover:scale-105 active:scale-95 transition flex flex-col items-center gap-1 group"
            >
              <span className="text-3xl group-hover:scale-110 transition">{c.icon}</span>
              <span className="text-xs font-bold text-slate-700">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-200 space-y-2 animate-in zoom-in-95">
          <div className="font-serif font-bold text-base md:text-lg">
            {result === 'win' && <span className="text-emerald-600">🎉 Bạn đã chiến thắng xuất sắc!</span>}
            {result === 'lose' && <span className="text-rose-600">🥰 Bé cưng đã chiến thắng rồi nhé!</span>}
            {result === 'tie' && <span className="text-slate-700">🤝 Hai trái tim đồng điệu (Hòa nhau)!</span>}
          </div>

          {currentPenalty && (
            <div className="text-xs md:text-sm text-slate-700 bg-white/90 p-3 rounded-xl border border-rose-100">
              <span className="font-semibold text-rose-600 block mb-0.5">
                {result === 'win' ? 'Quyền lợi dành cho bạn:' : result === 'lose' ? 'Hình phạt ngọt ngào của bạn:' : 'Cả hai cùng làm nhé:'}
              </span>
              <span>{currentPenalty}</span>
            </div>
          )}
        </div>
      )}

      {/* Reset Stats */}
      <div className="pt-2">
        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại tỉ số</span>
        </button>
      </div>
    </div>
  );
}
