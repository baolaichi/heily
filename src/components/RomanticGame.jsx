import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, Sparkles, CheckCircle2, Award, ArrowRight, 
  RotateCcw, Mail, Utensils, Grid, HandMetal, Compass 
} from 'lucide-react';
import { coupleConfig } from '../data/config';
import { useCouple } from '../context/CoupleContext';
import TicTacToeGame from './games/TicTacToeGame';
import RPSGame from './games/RPSGame';
import FoodWheelGame from './games/FoodWheelGame';

export default function RomanticGame({ onGameCompleted }) {
  const { coupleData } = useCouple();
  const [activeGame, setActiveGame] = useState('journey'); // 'journey' | 'tictactoe' | 'rps' | 'wheel'

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [stageFeedback, setStageFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState([]);

  const stages = coupleConfig.gameStages;
  const currentStage = stages[currentStageIndex];

  // Kích hoạt pháo hoa hoa lệ khi chiến thắng
  const triggerVictoryCelebration = () => {
    setIsCompleted(true);
    setShowLetterModal(true);

    if (onGameCompleted) {
      onGameCompleted();
    }

    const duration = 4 * 1000;
    const end = Date.now() + duration;
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#ffd166', '#ff758f'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleSelectOption = (opt) => {
    setSelectedOption(opt.id);
    setStageFeedback({
      isCorrect: opt.isCorrect,
      comment: opt.comment,
    });
  };

  const handleSelectKey = (keyItem) => {
    if (!unlockedKeys.includes(keyItem.id)) {
      setUnlockedKeys([...unlockedKeys, keyItem.id]);
    }
  };

  const handleNextStage = () => {
    setSelectedOption(null);
    setStageFeedback(null);

    if (currentStageIndex + 1 < stages.length) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      triggerVictoryCelebration();
    }
  };

  const handleResetGame = () => {
    setCurrentStageIndex(0);
    setSelectedOption(null);
    setStageFeedback(null);
    setIsCompleted(false);
    setShowLetterModal(false);
    setUnlockedKeys([]);
  };

  const gameNav = [
    { id: 'journey', label: 'Hành Trình Yêu Thương', icon: Compass, badge: 'Chính' },
    { id: 'tictactoe', label: 'Cờ Caro X/O', icon: Grid, badge: 'Đôi' },
    { id: 'rps', label: 'Kéo Búa Bao', icon: HandMetal },
    { id: 'wheel', label: 'Hôm Nay Ăn Gì?', icon: Utensils, badge: 'Date' },
  ];

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      
      {/* Top Game Navigation Selector */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar pb-1 px-1">
        <div className="glass-card p-1 sm:p-1.5 rounded-full border border-rose-200/90 shadow-xs flex items-center gap-1 shrink-0">
          {gameNav.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveGame(tab.id)}
                className={`relative flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200 scale-102'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="hidden md:inline-flex text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-600 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* GAME 2: TIC TAC TOE */}
      {activeGame === 'tictactoe' && <TicTacToeGame />}

      {/* GAME 3: ROCK PAPER SCISSORS */}
      {activeGame === 'rps' && <RPSGame />}

      {/* GAME 4: FOOD WHEEL */}
      {activeGame === 'wheel' && <FoodWheelGame />}

      {/* GAME 1: HÀNH TRÌNH YÊU THƯƠNG (TRÒ CHƠI CHÍNH) */}
      {activeGame === 'journey' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Title & Introduction */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 bg-rose-100/80 px-4 py-1.5 rounded-full text-rose-700 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-rose-500 animate-spin-slow" />
              <span>Mini-game Trái Tim Tương Tác</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-800">
              Hành Trình Yêu Thương 💖
            </h2>
            <p className="text-sm md:text-base text-slate-600 max-w-lg mx-auto">
              Cùng vượt qua 4 trạm dừng chân đáng yêu để mở khóa bức tâm thư bí mật và món quà bất ngờ mà {coupleData.boy.nickname || coupleData.boy.name} đã chuẩn bị!
            </p>
          </div>

          {/* Progress Map / Stations */}
          <div className="glass-card rounded-2xl p-5 border border-rose-200 shadow-md">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-rose-100 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
              />

              {stages.map((stage, index) => {
                const isPassed = index < currentStageIndex || isCompleted;
                const isCurrent = index === currentStageIndex && !isCompleted;
                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 shadow-md ${
                        isPassed
                          ? 'bg-rose-500 text-white shadow-rose-200 ring-4 ring-rose-100'
                          : isCurrent
                          ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white ring-4 ring-rose-200 scale-110 animate-pulse'
                          : 'bg-white text-slate-400 border-2 border-rose-100'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : `0${index + 1}`}
                    </div>
                    <span className="mt-2 text-[11px] md:text-xs font-medium text-slate-600 hidden sm:block max-w-[80px] text-center truncate">
                      Trạm {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Question Card */}
          {!isCompleted ? (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-rose-200 shadow-xl relative animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-rose-500">
                    {currentStage.title}
                  </span>
                  <h3 className="text-lg md:text-2xl font-serif font-bold text-slate-800 mt-1">
                    {currentStage.subtitle}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
              </div>

              {currentStage.hint && (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 mb-6 text-xs md:text-sm text-amber-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{currentStage.hint}</span>
                </div>
              )}

              {/* Multiple choice options */}
              {currentStage.options && (
                <div className="space-y-3 mb-6">
                  {currentStage.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-md ring-2 ring-rose-200 scale-[1.01]'
                            : 'bg-white/80 hover:bg-rose-50/50 border-rose-100 text-slate-700 hover:border-rose-300'
                        }`}
                      >
                        <span className="text-sm md:text-base font-medium">{opt.text}</span>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                          isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected ? <CheckCircle2 className="w-4 h-4" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Stage 4 secret keys */}
              {currentStage.type === 'secretKey' && (
                <div className="space-y-6 mb-6 text-center">
                  <p className="text-sm md:text-base text-slate-700 font-medium">
                    {currentStage.prompt}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {currentStage.keys.map((k) => {
                      const isKeyChosen = unlockedKeys.includes(k.id);
                      return (
                        <button
                          key={k.id}
                          onClick={() => handleSelectKey(k)}
                          className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-3 ${
                            isKeyChosen
                              ? 'bg-rose-500 text-white border-rose-500 shadow-xl scale-105 ring-4 ring-rose-200'
                              : 'bg-white/90 hover:bg-rose-50 text-slate-800 border-rose-100 hover:scale-102 shadow-sm'
                          }`}
                        >
                          <span className="text-4xl">{k.symbol}</span>
                          <span className="font-serif font-bold text-sm md:text-base">{k.name}</span>
                          <span className="text-[11px] opacity-80">
                            {isKeyChosen ? 'Đã kích hoạt ✨' : 'Chạm để mở'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {unlockedKeys.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm font-medium animate-in fade-in">
                      🎉 {currentStage.successMessage}
                    </div>
                  )}
                </div>
              )}

              {stageFeedback && (
                <div className="p-4 rounded-xl mb-6 bg-pink-50 border border-pink-200 text-pink-900 text-sm flex items-start space-x-2 animate-in fade-in">
                  <Heart className="w-4 h-4 text-pink-500 shrink-0 mt-0.5 fill-pink-500" />
                  <span>{stageFeedback.comment}</span>
                </div>
              )}

              <div className="flex justify-center sm:justify-end pt-2">
                <button
                  onClick={handleNextStage}
                  disabled={
                    currentStage.options
                      ? !selectedOption
                      : currentStage.type === 'secretKey'
                      ? unlockedKeys.length === 0
                      : false
                  }
                  className={`w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md ${
                    (currentStage.options && selectedOption) || (currentStage.type === 'secretKey' && unlockedKeys.length > 0)
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:scale-105 active:scale-95 shadow-rose-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>{currentStageIndex + 1 === stages.length ? 'Mở Khóa Trái Tim & Lời Chúc' : 'Tiếp Tục Trạm Sau'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-8 border-2 border-rose-300 text-center shadow-2xl space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-rose-300 animate-bounce">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-100 px-3 py-1 rounded-full">
                  Thành Công Xuất Sắc
                </span>
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-slate-800">
                  {coupleData.girl.nickname || coupleData.girl.name} Đã Mở Khóa Trọn Vẹn Trái Tim Anh! 🎉
                </h3>
                <p className="text-slate-600 max-w-md mx-auto text-sm md:text-base">
                  Bức tâm thư đặc biệt cùng bài hát lãng mạn đã sẵn sàng dành riêng cho người con gái tuyệt vời nhất.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setShowLetterModal(true)}
                  className="inline-flex items-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-rose-300 hover:scale-105 transition"
                >
                  <Mail className="w-5 h-5" />
                  <span>Đọc Lại Bức Tâm Thư</span>
                </button>

                <button
                  onClick={handleResetGame}
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-white text-slate-700 font-medium rounded-full border border-rose-200 hover:bg-rose-50 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi Lại Từ Đầu</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grand Romantic Love Letter Modal */}
      {showLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-[#fffdf9] via-[#fff5f5] to-[#fef2f2] w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border-2 border-rose-200/90 shadow-2xl relative pb-safe">
            
            <button
              onClick={() => setShowLetterModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 text-white shadow-lg border-2 border-rose-300 mb-3 animate-pulse">
                <Heart className="w-7 h-7 fill-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">
                Gửi {coupleData.girl.nickname || coupleData.girl.name} - Tình Yêu Của Anh
              </h2>
              <p className="text-xs font-cursive text-rose-500 mt-1 text-sm">
                {coupleConfig.loveLetter.date}
              </p>
              <div className="w-24 h-0.5 bg-rose-200 mx-auto mt-3" />
            </div>

            <div className="space-y-4 font-serif text-slate-700 text-sm md:text-base leading-relaxed px-2 md:px-4">
              {coupleConfig.loveLetter.paragraphs.map((p, idx) => (
                <p key={idx} className="indent-4 md:indent-6">
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 md:px-4">
              <div className="text-center sm:text-left">
                <span className="text-xs text-slate-400 uppercase tracking-widest block font-sans">
                  Ký tên
                </span>
                <span className="font-cursive text-xl md:text-2xl text-rose-600 font-bold">
                  {coupleData.boy.nickname || coupleData.boy.name} 🌹
                </span>
              </div>

              <div className="border-2 border-dashed border-rose-400 p-2.5 rounded-xl text-center bg-white/60 rotate-2">
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block">
                  ❤️ Eternal Love Guarantee ❤️
                </span>
                <span className="text-xs font-serif font-semibold text-slate-800">
                  {coupleData.boy.name} & {coupleData.girl.name}
                </span>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowLetterModal(false)}
                className="px-8 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-full shadow-md transition"
              >
                Gấp Thư Lại & Lưu Vào Tim 💖
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
