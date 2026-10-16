import React, { useEffect, useState } from 'react';

export default function FloatingHearts() {
  const [clickHearts, setClickHearts] = useState([]);

  // Bắt sự kiện click trên màn hình để tạo hiệu ứng tim bay nở rộ
  useEffect(() => {
    const handleClick = (e) => {
      // Bỏ qua nếu bấm vào nút tương tác để không che giao diện
      const target = e.target;
      if (target.closest('button') || target.closest('input') || target.closest('a')) {
        // Vẫn tạo tim nhỏ quanh nút
      }

      const sweetWords = ["💖", "✨", "Yêu em", "💕", "Thương em", "❤️", "Bé cưng", "🌸", "🌹", "Mãi yêu"];
      const randomWord = sweetWords[Math.floor(Math.random() * sweetWords.length)];
      
      const newHeart = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        text: randomWord,
      };

      setClickHearts((prev) => [...prev.slice(-15), newHeart]);

      setTimeout(() => {
        setClickHearts((prev) => prev.filter((item) => item.id !== newHeart.id));
      }, 1500);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Tạo các cánh hoa và trái tim bay ngẫu nhiên nền
  const backgroundItems = [
    { left: '5%', delay: '0s', duration: '14s', size: '1.2rem', symbol: '🌸' },
    { left: '15%', delay: '3s', duration: '18s', size: '1.5rem', symbol: '💖' },
    { left: '28%', delay: '7s', duration: '15s', size: '1rem', symbol: '✨' },
    { left: '42%', delay: '2s', duration: '20s', size: '1.4rem', symbol: '💕' },
    { left: '58%', delay: '5s', duration: '16s', size: '1.2rem', symbol: '🌸' },
    { left: '72%', delay: '1s', duration: '19s', size: '1.6rem', symbol: '❤️' },
    { left: '85%', delay: '8s', duration: '14s', size: '1.1rem', symbol: '✨' },
    { left: '94%', delay: '4s', duration: '21s', size: '1.3rem', symbol: '💖' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Background ambient floating hearts */}
      {backgroundItems.map((item, index) => (
        <span
          key={index}
          className="floating-heart select-none opacity-60"
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            fontSize: item.size,
          }}
        >
          {item.symbol}
        </span>
      ))}

      {/* Click pop up hearts with sweet text */}
      {clickHearts.map((h) => (
        <div
          key={h.id}
          className="fixed pointer-events-none text-rose-500 font-bold font-cursive select-none animate-float-slow text-lg md:text-xl drop-shadow-md z-50 transition-all"
          style={{
            left: `${h.x - 20}px`,
            top: `${h.y - 25}px`,
            animation: 'popAndFade 1.4s ease-out forwards',
          }}
        >
          {h.text}
        </div>
      ))}

      <style>{`
        @keyframes popAndFade {
          0% {
            opacity: 1;
            transform: scale(0.6) translateY(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translateY(-25px);
          }
          100% {
            opacity: 0;
            transform: scale(1.4) translateY(-60px);
          }
        }
      `}</style>
    </div>
  );
}
