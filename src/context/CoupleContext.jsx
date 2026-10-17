import React, { createContext, useContext, useState, useEffect } from 'react';
import { coupleConfig as defaultConfig } from '../data/config';
import { saveSongToDB, getAllSongsFromDB, deleteSongFromDB } from '../utils/musicDB';
import { 
  syncPushToCloud, syncPullFromCloud, 
  subscribeToFirebase,
  generateSyncCode, parseSyncCode, 
  getFirebaseUrl, setFirebaseUrl 
} from '../utils/cloudSync';
import { notifyStatusUpdate, notifyUpcomingEvent } from '../utils/notificationService';

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
          events: Array.isArray(parsed.events) ? parsed.events : [],
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
  const [directPlayTrack, setDirectPlayTrack] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [firebaseUrl, setFirebaseUrlState] = useState(() => getFirebaseUrl());

  // Vai trò người dùng toàn cục ('boy' hoặc 'girl')
  const [myRole, setMyRoleState] = useState(() => {
    try {
      return localStorage.getItem('user_chat_role') || 'boy';
    } catch {
      return 'boy';
    }
  });

  const setMyRole = (newRole) => {
    setMyRoleState(newRole);
    try {
      localStorage.setItem('user_chat_role', newRole);
      localStorage.setItem('puzzle_my_role', newRole);
    } catch (e) {}
  };

  const playTrackDirectly = (track) => {
    if (!track) return;
    setDirectPlayTrack({ ...track, timestamp: Date.now() });
  };

  // Tải danh sách bài hát tự upload từ IndexedDB khi mở trang
  useEffect(() => {
    loadCustomSongs();
  }, []);

  // Tự động kéo dữ liệu từ đám mây (Cloud Sync) và lắng nghe SSE Realtime
  useEffect(() => {
    checkCloudUpdates();

    // Lắng nghe cập nhật thời gian thực bằng Firebase SSE (Real-time tức thì)
    const unsubscribe = subscribeToFirebase('coupleData', (remoteData) => {
      if (remoteData && remoteData.boy && remoteData.girl) {
        setCoupleData((prev) => {
          // Kiểm tra xem đối phương có vừa cập nhật status mới không
          try {
            const currentMyRole = localStorage.getItem('user_chat_role') || 'boy';
            const partnerRole = currentMyRole === 'boy' ? 'girl' : 'boy';
            const newStatus = remoteData[partnerRole]?.status;
            const oldStatus = prev[partnerRole]?.status;

            if (
              newStatus && 
              newStatus.updatedAt && 
              newStatus.updatedAt !== oldStatus?.updatedAt
            ) {
              const partnerName = partnerRole === 'boy' 
                ? (remoteData.boy?.nickname || remoteData.boy?.name || 'Bug')
                : (remoteData.girl?.nickname || remoteData.girl?.name || 'Heily');
              notifyStatusUpdate(partnerName, newStatus.text, newStatus.songTitle);
            }
          } catch (e) {
            console.warn('Lỗi kiểm tra thông báo status:', e);
          }

          const merged = {
            ...prev,
            ...remoteData,
            boy: { ...prev.boy, ...(remoteData.boy || {}) },
            girl: { ...prev.girl, ...(remoteData.girl || {}) },
            events: Array.isArray(remoteData.events) ? remoteData.events : prev.events,
          };
          try {
            localStorage.setItem('couple_custom_data', JSON.stringify(merged));
          } catch (e) {}
          setCloudStatus('synced');
          return merged;
        });
      }
    });

    const handleFocus = () => {
      checkCloudUpdates();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    const interval = setInterval(checkCloudUpdates, 8000); // 8s tự kiểm tra đồng bộ dự phòng

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const checkCloudUpdates = async () => {
    const cloudData = await syncPullFromCloud();
    if (cloudData && cloudData.boy && cloudData.girl) {
      setCoupleData((prev) => {
        // Chỉ cập nhật nếu cloud có ngày cập nhật mới hơn
        const prevTime = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
        const cloudTime = cloudData.lastUpdated ? new Date(cloudData.lastUpdated).getTime() : 0;

        if (cloudTime >= prevTime) {
          const merged = {
            ...prev,
            ...cloudData,
            boy: { ...prev.boy, ...(cloudData.boy || {}) },
            girl: { ...prev.girl, ...(cloudData.girl || {}) },
            events: Array.isArray(cloudData.events) ? cloudData.events : prev.events,
          };
          try {
            localStorage.setItem('couple_custom_data', JSON.stringify(merged));
          } catch (e) {}
          setCloudStatus('synced');
          return merged;
        }
        return prev;
      });
    }
  };

  const loadCustomSongs = async () => {
    try {
      const dbSongs = await getAllSongsFromDB();
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

    const playableSong = {
      ...newSong,
      url: URL.createObjectURL(file),
    };

    setCustomSongs((prev) => [...prev, playableSong]);
    setActivePlaylist((prev) => [...prev, playableSong]);
    return playableSong;
  };

  const removeCustomSong = async (id) => {
    await deleteSongFromDB(id);
    setCustomSongs((prev) => prev.filter((s) => s.id !== id));
    setActivePlaylist((prev) => prev.filter((s) => s.id !== id));
  };

  // Lưu thông tin và tự động đẩy lên Cloud Sync
  const saveCoupleData = (newData) => {
    const updated = {
      ...coupleData,
      ...newData,
      isConfigured: true,
      lastUpdated: new Date().toISOString(),
      boy: { ...coupleData.boy, ...(newData.boy || {}) },
      girl: { ...coupleData.girl, ...(newData.girl || {}) },
      events: Array.isArray(newData.events) ? newData.events : coupleData.events,
    };

    setCoupleData(updated);

    try {
      localStorage.setItem('couple_custom_data', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }

    // Đẩy lên đám mây ngay lập tức để thiết bị khác nhận được
    setCloudStatus('syncing');
    syncPushToCloud(updated).then((ok) => {
      setCloudStatus(ok ? 'synced' : 'idle');
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

  // Cập nhật Firebase Realtime Database URL
  const updateFirebaseUrl = async (url) => {
    setFirebaseUrl(url);
    setFirebaseUrlState(url);
    if (url.trim()) {
      setCloudStatus('syncing');
      // Đẩy dữ liệu hiện tại lên
      const ok = await syncPushToCloud(coupleData);
      setCloudStatus(ok ? 'synced' : 'error');
      // Kéo dữ liệu về thử
      await checkCloudUpdates();
    } else {
      setCloudStatus('idle');
    }
  };

  // Xuất mã đồng bộ 1 chạm
  const exportMySyncCode = () => {
    return generateSyncCode(coupleData);
  };

  // Nhập mã đồng bộ 1 chạm từ máy khác
  const importMySyncCode = (codeStr) => {
    const parsed = parseSyncCode(codeStr);
    if (!parsed || !parsed.boy || !parsed.girl) {
      throw new Error('Mã đồng bộ không hợp lệ hoặc bị lỗi!');
    }
    saveCoupleData(parsed);
    return true;
  };

  const resetToDefault = () => {
    localStorage.removeItem('couple_custom_data');
    setCoupleData(defaultConfig);
  };

  const getClosestEvent = () => {
    const list = coupleData.events || [];
    if (list.length === 0) {
      return coupleData.nextEvent || defaultConfig.nextEvent;
    }

    const now = Date.now();
    const upcoming = list.filter((e) => new Date(e.date).getTime() >= now - 86400000);

    if (upcoming.length > 0) {
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());
      return upcoming[0];
    }

    const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  };

  // Kiểm tra nhắc nhở ngày kỷ niệm sắp tới (chạy 1 lần/ngày)
  useEffect(() => {
    try {
      const closest = getClosestEvent();
      if (closest && closest.date) {
        const now = new Date();
        const target = new Date(closest.date);
        const diffMs = target.setHours(0,0,0,0) - now.setHours(0,0,0,0);
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft >= 0 && daysLeft <= 3) {
          const todayStr = new Date().toISOString().slice(0, 10);
          const key = `event_notified_${closest.title || 'event'}_${todayStr}`;
          const lastAlert = localStorage.getItem(key);
          if (!lastAlert) {
            localStorage.setItem(key, 'true');
            setTimeout(() => {
              notifyUpcomingEvent(closest.title, daysLeft);
            }, 3500);
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra sự kiện:', e);
    }
  }, [coupleData.events]);

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
        setActivePlaylist,
        customSongs,
        uploadCustomSong,
        removeCustomSong,
        directPlayTrack,
        playTrackDirectly,
        // Cloud Sync capabilities
        cloudStatus,
        firebaseUrl,
        updateFirebaseUrl,
        exportMySyncCode,
        importMySyncCode,
        checkCloudUpdates,
        myRole,
        setMyRole,
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
