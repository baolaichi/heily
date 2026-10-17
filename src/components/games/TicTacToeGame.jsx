import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, Crown, RotateCcw, Sparkles, Award, 
  Users, User, Radio 
} from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';
import { 
  syncPushGameState, syncPullGameState, subscribeToGame 
} from '../../utils/cloudSync';

export default function TicTacToeGame() {
  const { coupleData } = useCouple();

  // Mode: 'online' | 'local'
  const [playMode, setPlayMode] = useState('online');
  const [myRole, setMyRole] = useState(() => {
    try {
      return localStorage.getItem('tictactoe_my_role') || 'boy';
    } catch {
      return 'boy';
    }
  });

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

  // Lưu role
  const handleRoleChange = (role) => {
    setMyRole(role);
    try {
      localStorage.setItem('tictactoe_my_role', role);
    } catch {}
  };

  // Đồng bộ Online Realtime qua Firebase
  useEffect(() => {
    if (playMode !== 'online') return;

    // Kéo ván cờ hiện tại
    syncPullGameState('love_tictactoe').then((state) => {
      if (state && Array.isArray(state.board)) {
        setBoard(state.board);
        setIsXNext(state.isXNext ?? true);
        if (state.scores) setScores(state.scores);
        if (state.punishment) setPunishment(state.punishment);
      }
    });

    // Lắng nghe realtime từ đối phương
    const unsubscribe = subscribeToGame('love_tictactoe', (remoteState) => {
      if (!remoteState || !Array.isArray(remoteState.board)) return;
      setBoard(remoteState.board);
      setIsXNext(remoteState.isXNext ?? true);
      if (remoteState.scores) setScores(remoteState.scores);
      if (remoteState.punishment) setPunishment(remoteState.punishment);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [playMode]);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
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

  // Kiểm tra xem có đúng lượt người chơi không (khi chơi online)
  const isMyTurn = playMode === 'local' 
    ? true 
    : (myRole === 'boy' && isXNext) || (myRole === 'girl' && !isXNext);

  const handleClick = async (index) => {
    if (board[index] || winInfo) return;
    if (playMode === 'online' && !isMyTurn) return; // Chưa tới lượt

    const newBoard = [...board];
    const mark = isXNext ? 'X' : 'O';
    newBoard[index] = mark;
    const nextTurn = !isXNext;

    setBoard(newBoard);
    setIsXNext(nextTurn);

    let updatedScores = { ...scores };
    let currentPunishment = punishment;

    const result = checkWinner(newBoard);
    if (result) {
      currentPunishment = sweetRewards[Math.floor(Math.random() * sweetRewards.length)];
      setPunishment(currentPunishment);

      if (result.winner === 'X') {
        updatedScores.boy += 1;
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      } else if (result.winner === 'O') {
        updatedScores.girl += 1;
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      } else {
        updatedScores.ties += 1;
      }
      setScores(updatedScores);
    }

    if (playMode === 'online') {
      await syncPushGameState('love_tictactoe', {
        board: newBoard,
        isXNext: nextTurn,
        scores: updatedScores,
        punishment: currentPunishment,
      });
    }
  };

  const handleResetGame = async () => {
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setIsXNext(true);
    setPunishment('');

    if (playMode === 'online') {
      await syncPushGameState('love_tictactoe', {
        board: emptyBoard,
        isXNext: true,
        scores,
        punishment: '',
      });
    }
  };

  const boyName = coupleData.boy.nickname || coupleData.boy.name || 'Chàng Trai';
  const girlName = coupleData.girl.nickname || coupleData.girl.name || 'Cô Gái';

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-7 md:p-8 border border-rose-200 shadow-xl max-w-xl mx-auto space-y-5 text-center animate-in fade-in">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 px-3.5 py-1 rounded-full text-rose-700 text-xs font-semibold mb-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Mini-game Đối Kháng Ngọt Ngào</span>
        </div>
        <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
          Cờ Caro X/O Tình Yêu 💕
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hỗ trợ chơi trực tuyến 2 người từ 2 điện thoại khác nhau!
        </p>
      </div>

      {/* Mode Selector & Role Tabs */}
      <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-200/80 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-rose-200">
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
              <span>Chơi Trực Tuyến (Online)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayMode('local')}
              className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 ${
                playMode === 'local'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Chung 1 Máy (Offline)</span>
            </button>
          </div>

          {playMode === 'online' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Bạn là:</span>
              <button
                type="button"
                onClick={() => handleRoleChange('boy')}
                className={`px-2 py-0.5 rounded-lg border transition ${
                  myRole === 'boy'
                    ? 'bg-rose-500 text-white font-bold border-rose-500'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                👑 {boyName} (X)
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('girl')}
                className={`px-2 py-0.5 rounded-lg border transition ${
                  myRole === 'girl'
                    ? 'bg-pink-500 text-white font-bold border-pink-500'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                💖 {girlName} (O)
              </button>
            </div>
          )}
        </div>

        {/* Turn indicator in Online Mode */}
        {playMode === 'online' && !winInfo && (
          <div className="pt-1.5 border-t border-rose-100 flex items-center justify-center gap-2 text-xs">
            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
            <span className="font-semibold text-slate-700">
              {isMyTurn ? (
                <span className="text-emerald-600 font-bold">👉 Đến lượt bạn đánh cờ!</span>
              ) : (
                <span className="text-slate-500 italic">
                  Đang đợi {isXNext ? boyName : girlName} đi nước tiếp theo...
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-2 bg-white/90 p-3 rounded-2xl border border-rose-100 shadow-xs items-center">
        {/* Boy */}
        <div className={`p-2 rounded-xl transition ${isXNext && !winInfo ? 'bg-rose-50 border border-rose-300 ring-2 ring-rose-200' : ''}`}>
          <div className="text-xl">👑</div>
          <div className="font-bold text-xs sm:text-sm text-slate-800 truncate">
            {boyName}
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
          <div className="text-xl">💖</div>
          <div className="font-bold text-xs sm:text-sm text-slate-800 truncate">
            {girlName}
          </div>
          <div className="text-lg font-serif font-bold text-pink-600">{scores.girl}</div>
        </div>
      </div>

      {/* Board 3x3 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[250px] sm:max-w-[300px] mx-auto p-2.5 sm:p-3 bg-rose-100/60 rounded-3xl border border-rose-200 shadow-inner">
        {board.map((cell, idx) => {
          const isWinningCell = winInfo && winInfo.line.includes(idx);
          const canClick = !cell && !winInfo && (playMode === 'local' || isMyTurn);

          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={!canClick && !cell}
              className={`w-full aspect-square rounded-2xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all duration-200 select-none ${
                cell
                  ? isWinningCell
                    ? 'bg-rose-500 text-white shadow-lg scale-105 animate-bounce'
                    : 'bg-white shadow-sm'
                  : canClick
                  ? 'bg-white/85 hover:bg-white hover:scale-102 hover:shadow active:scale-95 cursor-pointer'
                  : 'bg-white/50 cursor-not-allowed opacity-75'
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
          <div className="font-serif font-bold text-base sm:text-lg text-rose-700 flex items-center justify-center gap-1.5">
            <Award className="w-5 h-5 text-rose-500" />
            <span>
              {winInfo.winner === 'X'
                ? `🎉 ${boyName} đã chiến thắng!`
                : winInfo.winner === 'O'
                ? `🎉 ${girlName} đã chiến thắng!`
                : 'Hai đứa mình ngang tài ngang sức! 💕'}
            </span>
          </div>

          {punishment && (
            <div className="text-xs sm:text-sm text-slate-700 bg-white/90 p-2.5 rounded-xl border border-rose-100">
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
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{winInfo ? 'Chơi Ván Mới' : 'Làm Lại Bàn Cờ'}</span>
        </button>
      </div>
    </div>
  );
}
