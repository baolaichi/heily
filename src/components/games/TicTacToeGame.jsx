import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Crown, RotateCcw, Sparkles, Award } from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';

export default function TicTacToeGame() {
  const { coupleData } = useCouple();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // X = Boy, O = Girl
  const [scores, setScores] = useState({ boy: 0, girl: 0, ties: 0 });
  const [punishment, setPunishment] = useState('');

  const sweetRewards = [
    "Hôn đối phương một cái thật kêu vào má 💋",
    "Bao một cốc trà sữa full topping 🧋",
    "Ôm thật chặt trong 30 giây không buông 🤗",
    "Nói 3 điều mà bạn yêu nhất ở đối phương ❤️",
    "Mát-xa vai 5 phút cho người thắng 💆",
    "Hát một đoạn nhạc tình ca ngọt ngào tặng người yêu 🎤",
    "Được làm nũng và người kia phải chiều theo ý bạn hôm nay 👑",
  ];

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // hàng ngang
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // hàng dọc
      [0, 4, 8], [2, 4, 6]             // đường chéo
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return { winner: 'Tie', line: [] };
    }
    return null;
  };

  const winInfo = checkWinner(board);

  const handleClick = (index) => {
    if (board[index] || winInfo) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const result = checkWinner(newBoard);
    if (result) {
      const randomReward = sweetRewards[Math.floor(Math.random() * sweetRewards.length)];
      setPunishment(randomReward);

      if (result.winner === 'X') {
        setScores((prev) => ({ ...prev, boy: prev.boy + 1 }));
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      } else if (result.winner === 'O') {
        setScores((prev) => ({ ...prev, girl: prev.girl + 1 }));
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      } else {
        setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
      }
    }
  };

  const handleResetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setPunishment('');
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 border border-rose-200 shadow-xl max-w-xl mx-auto space-y-6 text-center animate-in fade-in">
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-rose-100 px-3.5 py-1 rounded-full text-rose-700 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Mini-game Đối Kháng Ngọt Ngào</span>
        </div>
        <h3 className="font-serif font-bold text-2xl md:text-3xl text-slate-800">
          Cờ Caro X/O Tình Yêu 💕
        </h3>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Ai thắng sẽ nhận được một đặc quyền yêu thương từ người kia!
        </p>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-2 bg-white/80 p-3 rounded-2xl border border-rose-100 shadow-sm items-center">
        {/* Boy */}
        <div className={`p-2 rounded-xl transition ${isXNext && !winInfo ? 'bg-rose-50 border border-rose-300 ring-2 ring-rose-200' : ''}`}>
          <div className="text-xl">👑</div>
          <div className="font-bold text-xs md:text-sm text-slate-800 truncate">
            {coupleData.boy.nickname || coupleData.boy.name}
          </div>
          <div className="text-lg font-serif font-bold text-rose-600">{scores.boy}</div>
        </div>

        {/* Tie */}
        <div className="p-2">
          <div className="text-slate-400 text-xs font-semibold">Hòa</div>
          <div className="text-base font-bold text-slate-600">{scores.ties}</div>
          <div className="text-[10px] text-slate-400">cả hai đều thắng</div>
        </div>

        {/* Girl */}
        <div className={`p-2 rounded-xl transition ${!isXNext && !winInfo ? 'bg-pink-50 border border-pink-300 ring-2 ring-pink-200' : ''}`}>
          <div className="text-xl">🎀</div>
          <div className="font-bold text-xs md:text-sm text-slate-800 truncate">
            {coupleData.girl.nickname || coupleData.girl.name}
          </div>
          <div className="text-lg font-serif font-bold text-pink-600">{scores.girl}</div>
        </div>
      </div>

      {/* Board 3x3 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[240px] sm:max-w-[290px] mx-auto p-2 sm:p-3 bg-rose-100/60 rounded-3xl border border-rose-200 shadow-inner">
        {board.map((cell, idx) => {
          const isWinningCell = winInfo && winInfo.line.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className={`w-full aspect-square rounded-2xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all duration-200 ${
                cell
                  ? isWinningCell
                    ? 'bg-rose-500 text-white shadow-lg scale-105 animate-bounce'
                    : 'bg-white shadow-sm'
                  : 'bg-white/80 hover:bg-white hover:scale-102 hover:shadow active:scale-95'
              }`}
            >
              {cell === 'X' && <span className="text-rose-500">👑</span>}
              {cell === 'O' && <span className="text-pink-500">💖</span>}
            </button>
          );
        })}
      </div>

      {/* Result & Sweet Punishment Box */}
      {winInfo && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-200 space-y-2 animate-in zoom-in-95">
          <div className="font-serif font-bold text-base md:text-lg text-rose-700 flex items-center justify-center gap-1.5">
            <Award className="w-5 h-5 text-rose-500" />
            <span>
              {winInfo.winner === 'X'
                ? `🎉 ${coupleData.boy.nickname || coupleData.boy.name} đã chiến thắng!`
                : winInfo.winner === 'O'
                ? `🎉 ${coupleData.girl.nickname || coupleData.girl.name} đã chiến thắng!`
                : 'Hai đứa mình ngang tài ngang sức! 💕'}
            </span>
          </div>

          {punishment && (
            <div className="text-xs md:text-sm text-slate-700 bg-white/90 p-2.5 rounded-xl border border-rose-100">
              <span className="font-semibold text-rose-600 block mb-0.5">Phần thưởng ngọt ngào:</span>
              <span>{punishment}</span>
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      <div>
        <button
          onClick={handleResetGame}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs md:text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{winInfo ? 'Chơi Ván Mới' : 'Làm Lại Bàn Cờ'}</span>
        </button>
      </div>
    </div>
  );
}
