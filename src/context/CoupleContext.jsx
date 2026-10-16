import React, { createContext, useContext, useState, useEffect } from 'react';
import { coupleConfig as defaultConfig } from '../data/config';
import { saveSongToDB, getAllSongsFromDB, deleteSongFromDB } from '../utils/musicDB';

const CoupleContext = createContext(null);

export function CoupleProvider({ children }) {
  const [coupleData, setCoupleData] = useState(() => {
    try {
      const saved = localStorage.getItem('couple_custom_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultConfig,
          ...parsed,
          boy: { ...defaultConfig.boy, ...(parsed.boy || {}) },
          girl: { ...defaultConfig.girl, ...(parsed.girl || {}) },
          events: Array.isArray(parsed.events) && parsed.events.length > 0
            ? parsed.events
            : defaultConfig.events,
        };
      }
    } catch (e) {
      console.error('Failed to load couple data from localStorage:', e);
    }
    return defaultConfig;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customSongs, setCustomSongs] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(defaultConfig.playlist);

  // Tải danh sách bài hát tự upload từ IndexedDB khi mở trang
  useEffect(() => {
    loadCustomSongs();
  }, []);

  const loadCustomSongs = async () => {
    try {
      const dbSongs = await getAllSongsFromDB();
      // Chuyển Blob thành URL phát nhạc
      const formatted = dbSongs.map((s) => ({
        ...s,
        url: URL.createObjectURL(s.blob),
      }));
      setCustomSongs(formatted);
      setActivePlaylist([...defaultConfig.playlist, ...formatted]);
    } catch (err) {
      console.error('Lỗi khi tải nhạc từ IndexedDB:', err);
    }
  };

  // Upload bài hát mới
  const uploadCustomSong = async (file, title, artist) => {
    if (!file) return;

    const newSong = {
      id: `custom-song-${Date.now()}`,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      artist: artist || coupleData.girl.nickname || "Giai điệu đôi ta",
      blob: file,
      cover: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=400&auto=format&fit=crop",
      isCustom: true,
      addedAt: new Date().toISOString(),
    };

    await saveSongToDB(newSong);

    // Cập nhật state
    const playableSong = {
      ...newSong,
      url: URL.createObjectURL(file),
    };

    setCustomSongs((prev) => [...prev, playableSong]);
    setActivePlaylist((prev) => [...prev, playableSong]);
    return playableSong;
  };

  // Xóa bài hát tự tải lên
  const removeCustomSong = async (id) => {
    await deleteSongFromDB(id);
    setCustomSongs((prev) => prev.filter((s) => s.id !== id));
    setActivePlaylist((prev) => prev.filter((s) => s.id !== id));
  };

  // Lưu tự động vào localStorage mỗi khi coupleData thay đổi
  const saveCoupleData = (newData) => {
    setCoupleData((prev) => {
      const updated = {
        ...prev,
        ...newData,
        boy: { ...prev.boy, ...(newData.boy || {}) },
        girl: { ...prev.girl, ...(newData.girl || {}) },
        events: Array.isArray(newData.events) ? newData.events : prev.events,
      };
      try {
        localStorage.setItem('couple_custom_data', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      return updated;
    });
  };

  // Thêm sự kiện mới
  const addEvent = (newEvent) => {
    const eventWithId = {
      id: `event-${Date.now()}`,
      icon: '💖',
      ...newEvent,
    };
    const updatedEvents = [...(coupleData.events || []), eventWithId];
    saveCoupleData({ events: updatedEvents });
  };

  // Xóa sự kiện
  const deleteEvent = (id) => {
    const updatedEvents = (coupleData.events || []).filter((e) => e.id !== id);
    saveCoupleData({ events: updatedEvents });
  };

  // Khôi phục mặc định
  const resetToDefault = () => {
    localStorage.removeItem('couple_custom_data');
    setCoupleData(defaultConfig);
  };

  // Hàm tính toán sự kiện sắp diễn ra gần nhất
  const getClosestEvent = () => {
    const list = coupleData.events || defaultConfig.events || [];
    if (list.length === 0) {
      return coupleData.nextEvent || defaultConfig.nextEvent;
    }

    const now = Date.now();
    const upcoming = list.filter((e) => new Date(e.date).getTime() >= now - 86400000);

    if (upcoming.length > 0) {
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return upcoming[0];
    }

    const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  };

  return (
    <CoupleContext.Provider
      value={{
        coupleData,
        saveCoupleData,
        addEvent,
        deleteEvent,
        getClosestEvent,
        resetToDefault,
        isSettingsOpen,
        setIsSettingsOpen,
        activePlaylist,
        customSongs,
        uploadCustomSong,
        removeCustomSong,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
}
