import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sprout, Droplets, Heart, Sparkles, Send, Lock, 
  Unlock, Check, Calendar, Sun, Flower2, Award, RotateCcw 
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { syncPushGameState, syncPullGameState, subscribeToGame } from '../utils/cloudSync';
import { playNotificationChime } from '../utils/notificationService';

export default function LovePlant() {
  const { coupleData, myRole, setMyRole } = useCouple();

  // State cây tình yêu khởi đầu từ Hạt Mầm (Cấp 1 - 0 EXP)
  const [plantData, setPlantData] = useState({
    exp: 0,
    level: 1,
    wateredDates: {}, // { '2026-10-17': { boy: true, girl: true } }
    answers: {}, // { questionId: { boy: '...', girl: '...' } }
  });

  const [myAnswerInput, setMyAnswerInput] = useState('');
  const [isWatering, setIsWatering] = useState(false);

  // Ngân hàng câu hỏi đôi hàng ngày (SumOne Style)
  const questionBank = [
    { id: 1, text: "Hôm nay điều gì ở người ấy khiến bạn bất giác mỉm cười? 💕" },
    { id: 2, text: "Kỷ niệm hẹn hò nào làm bạn nhớ nhất từ trước đến giờ? 🌹" },
    { id: 3, text: "Một thói quen đáng yêu của đối phương mà chỉ mình bạn biết? 🥰" },
    { id: 4, text: "Nếu được cùng nhau đi du lịch ngay ngày mai, bạn muốn cùng người ấy đi đâu? 🏖️" },
    { id: 5, text: "Bài hát nào cứ bật lên là bạn lại nghĩ ngay đến người yêu? 🎵" },
    { id: 6, text: "Món ăn nào hai đứa mình cùng thích ăn nhất? 🍕" },
    { id: 7, text: "Khoảnh khắc nào bạn nhận ra mình đã hoàn toàn 'đổ gục' trước người ấy? 💘" },
    { id: 8, text: "Ba từ ngọt ngào nhất bạn muốn nói với đối phương lúc này? 💌" },
    { id: 9, text: "Lần gần nhất bạn cảm thấy biết ơn vì có người ấy bên cạnh là khi nào? ✨" },
    { id: 10, text: "Điều gì bạn mong muốn hai đứa mình sẽ cùng nhau đạt được trong năm nay? 🏡" },
  ];

  // Tính câu hỏi của ngày hôm nay theo ngày trong tháng
  const todayStr = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date().getDate() % questionBank.length;
  const todayQuestion = questionBank[dayIndex];

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Bug';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Heily';
  const partnerRole = myRole === 'boy' ? 'girl' : 'boy';
  const partnerName = myRole === 'boy' ? girlName : boyName;

  // Cấp độ của cây
  const getPlantLevelInfo = (exp) => {
    if (exp < 40) {
      return { level: 1, title: 'Hạt Mầm Kỳ Diệu 🌱', desc: 'Mầm cây đang ấp ủ dưới lòng đất ấm áp', icon: '🌱' };
    }
    if (exp < 100) {
      return { level: 2, title: 'Chồi Non Ngọt Ngào 🌿', desc: 'Hai chiếc lá non xinh xắn đang đâm chồi', icon: '🌿' };
    }
    if (exp < 180) {
      return { level: 3, title: 'Nhánh Cây Yêu Thương 🌳', desc: 'Cây tình yêu đã vươn cành lá xanh tươi', icon: '🌳' };
    }
    if (exp < 300) {
      return { level: 4, title: 'Nụ Hoa E Ấp 🌷', desc: 'Những nụ hoa hồng phấn đang chuẩn bị nở rộ', icon: '🌷' };
    }
    return { level: 5, title: 'Cây Tình Yêu Nở Hoa Rực Rỡ 🌸✨', desc: 'Tình yêu đôi ta đơm hoa kết trái viên mãn', icon: '🌸' };
  };

  const levelInfo = getPlantLevelInfo(plantData.exp || 0);

  // Kéo dữ liệu cây từ Firebase Realtime
  useEffect(() => {
    syncPullGameState('love_plant').then((state) => {
      if (state && typeof state.exp === 'number') {
        setPlantData(state);
      }
    });

    const unsubscribe = subscribeToGame('love_plant', (remoteState) => {
      if (remoteState && typeof remoteState.exp === 'number') {
        setPlantData(remoteState);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const todayAnswers = plantData.answers?.[todayQuestion.id] || {};
  const myAnswer = todayAnswers[myRole];
  const partnerAnswer = todayAnswers[partnerRole];
  const isBothAnswered = Boolean(myAnswer && partnerAnswer);
  const isTodayWatered = plantData.wateredDates?.[todayStr]?.[myRole];

  // Gửi câu trả lời của hôm nay
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!myAnswerInput.trim()) return;

    const updatedAnswers = {
      ...(plantData.answers || {}),
      [todayQuestion.id]: {
        ...todayAnswers,
        [myRole]: myAnswerInput.trim(),
        [`${myRole}_time`]: new Date().toISOString(),
      },
    };

    // Nếu cả hai cùng trả lời xong: thưởng +25 EXP
    const willBothAnswer = Boolean(partnerAnswer && myAnswerInput.trim());
    const newExp = (plantData.exp || 0) + (willBothAnswer ? 25 : 10);

    const updated = {
      ...plantData,
      exp: newExp,
      answers: updatedAnswers,
    };

    setPlantData(updated);
    setMyAnswerInput('');

    if (willBothAnswer) {
      playNotificationChime();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f43f5e', '#fb7185', '#ffd166'],
      });
    }

    await syncPushGameState('love_plant', updated);
  };

  // Tưới nước cho cây tình yêu
  const handleWaterPlant = async () => {
    if (isTodayWatered) return;

    setIsWatering(true);
    playNotificationChime();

    const newWateredDates = {
      ...(plantData.wateredDates || {}),
      [todayStr]: {
        ...(plantData.wateredDates?.[todayStr] || {}),
        [myRole]: true,
      },
    };

    const newExp = (plantData.exp || 0) + 15;
    const updated = {
      ...plantData,
      exp: newExp,
      wateredDates: newWateredDates,
    };

    setPlantData(updated);

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#60a5fa', '#f43f5e'],
    });

    await syncPushGameState('love_plant', updated);
    setTimeout(() => setIsWatering(false), 1200);
  };

  // Đặt lại mầm cây về ban đầu (Level 1, 0 EXP)
  const handleResetPlant = async () => {
    if (window.confirm("Bạn có muốn đặt lại cây tình yêu về ban đầu (Hạt Mầm Cấp 1, 0 EXP) để hai bạn cùng nhau chăm sóc lại từ đầu không?")) {
      const resetState = {
        exp: 0,
        level: 1,
        wateredDates: {},
        answers: {},
      };
      setPlantData(resetState);
      try {
        localStorage.removeItem('love_plant_data');
      } catch {}
      await syncPushGameState('love_plant', resetState);
    }
  };

  const handleRoleChange = (role) => {
    setMyRole(role);
    try {
      localStorage.setItem('user_chat_role', role);
    } catch {}
  };

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6 text-center animate-in fade-in">
      
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-1.5 rounded-full text-emerald-800 text-xs font-semibold shadow-2xs">
          <Sprout className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
          <span>Nuôi Cây Tình Yêu (Phong cách SumOne)</span>
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-800">
          Cây Tình Yêu Đôi Ta 🌱
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Mỗi ngày hai bạn cùng vào trả lời câu hỏi đôi và tưới nước để cây tình yêu lớn lên và đơm hoa rực rỡ!
        </p>
      </div>

      {/* Role Picker */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Bạn đang là:</span>
        <button
          type="button"
          onClick={() => handleRoleChange('boy')}
          className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 ${
            myRole === 'boy'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-rose-100'
          }`}
        >
          <span>👑 {boyName}</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('girl')}
          className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 ${
            myRole === 'girl'
              ? 'bg-pink-500 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-pink-100'
          }`}
        >
          <span>🎀 {girlName}</span>
        </button>
      </div>

      {/* KHU VỰC CÂY TRỒNG TÌNH YÊU (VIRTUAL LOVE PLANT DISPLAY) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-200/90 shadow-xl bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/40 relative overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Level badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs mb-4">
          <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          <span>Cấp {levelInfo.level}: {levelInfo.title}</span>
        </div>

        {/* Hình tượng Cây Tình Yêu (Animated Plant Visualization) */}
        <div className="relative py-4 flex flex-col items-center justify-center">
          
          {/* Cây theo cấp độ */}
          <div className={`text-7xl sm:text-8xl transition-all duration-500 ${isWatering ? 'scale-110 rotate-6' : 'animate-bounce-gentle'}`}>
            {levelInfo.icon}
          </div>

          {/* Chậu cây in tên hai bạn */}
          <div className="relative -mt-2 w-32 sm:w-36 h-14 bg-gradient-to-b from-rose-400 via-rose-500 to-pink-600 rounded-b-3xl rounded-t-lg shadow-md flex items-center justify-center text-white border-2 border-white">
            <span className="font-serif font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1">
              <Heart className="w-3 h-3 fill-white" />
              <span>{boyName} & {girlName}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-3 font-medium">
            {levelInfo.desc}
          </p>
        </div>

        {/* Thanh Tiến Trình Lớn (EXP Growth Progress Bar) */}
        <div className="max-w-md mx-auto mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Tiến trình lớn</span>
            <span className="text-emerald-600 font-bold">{plantData.exp || 0} EXP</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-emerald-200 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, ((plantData.exp || 0) % 100))}%` }}
            />
          </div>
        </div>

        {/* Nút Tưới Nước Hàng Ngày & Đặt Lại Ban Đầu */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleWaterPlant}
            disabled={isTodayWatered}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 ${
              isTodayWatered
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white shadow-sky-200 scale-102 hover:scale-105'
            }`}
          >
            <Droplets className="w-4 h-4 fill-current" />
            <span>{isTodayWatered ? 'Hôm nay bạn đã tưới nước rồi 💧' : 'Tưới Nước Tình Yêu (+15 EXP) 💧'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetPlant}
            className="px-3.5 py-2 rounded-full text-[11px] font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 transition flex items-center gap-1.5"
            title="Đặt lại mầm cây về Cấp 1 để bắt đầu chăm sóc từ đầu"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Trồng lại từ đầu 🌱</span>
          </button>
        </div>

      </div>

      {/* CÂU HỎI ĐÔI HÔM NAY (DAILY COUPLE QUESTION - SUMONE STYLE) */}
      <div className="glass-card rounded-3xl p-5 sm:p-7 border border-rose-200/90 shadow-md text-left space-y-4 bg-white/90">
        
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💌</span>
            <h4 className="font-bold text-sm sm:text-base text-slate-800">
              Câu Hỏi Đôi Hôm Nay
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Ngày {new Date().getDate()}/{new Date().getMonth() + 1}</span>
          </span>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80">
          <p className="font-serif font-bold text-sm sm:text-base text-rose-700 leading-relaxed text-center">
            "{todayQuestion.text}"
          </p>
        </div>

        {/* Form nhập câu trả lời của bạn */}
        {!myAnswer ? (
          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <textarea
              rows={3}
              value={myAnswerInput}
              onChange={(e) => setMyAnswerInput(e.target.value)}
              placeholder={`Viết câu trả lời của ${myRole === 'boy' ? boyName : girlName} gửi đến người ấy nhé...`}
              className="w-full p-3 rounded-2xl bg-rose-50/40 border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-xs sm:text-sm text-slate-800 transition placeholder-slate-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!myAnswerInput.trim()}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi câu trả lời & Mở khóa (+10 EXP)</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Câu trả lời của bạn */}
            <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 mb-1">
                <span>{myRole === 'boy' ? boyName : girlName} (Bạn) đã trả lời:</span>
                <span className="text-[10px] text-slate-400">Đã gửi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic">
                "{myAnswer}"
              </p>
            </div>

            {/* Câu trả lời của đối phương (Chế độ mở khóa SumOne) */}
            {isBothAnswered ? (
              <div className="p-3 rounded-2xl bg-pink-50/80 border border-pink-200 animate-in zoom-in-95">
                <div className="flex items-center justify-between text-[11px] font-bold text-pink-600 mb-1">
                  <span>{partnerName} đã trả lời:</span>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Đã mở khóa</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 italic">
                  "{partnerAnswer}"
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-semibold text-xs text-slate-700">
                  Câu trả lời của {partnerName} đang được khóa bí mật 🔒
                </p>
                <p className="text-[11px] text-slate-500">
                  Hãy nhắc {partnerName} vào trả lời để cả hai cùng mở khóa đọc suy nghĩ của nhau nhé!
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
