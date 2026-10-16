/**
 * Tiện ích Đồng Bộ Đa Thiết Bị (Cross-Device Cloud Sync)
 * Hỗ trợ 2 phương thức:
 * 1. Đồng bộ đám mây tự động qua Firebase Realtime Database (Real-time sync 24/7)
 * 2. Mã đồng bộ 1 chạm (Sync Code): Sao chép từ máy này và Dán vào máy kia
 */

import { coupleConfig } from '../data/config';

const FIREBASE_URL_KEY = 'heily_firebase_sync_url';

export function getFirebaseUrl() {
  try {
    return (
      localStorage.getItem(FIREBASE_URL_KEY) ||
      import.meta.env.VITE_FIREBASE_URL ||
      coupleConfig.firebaseUrl ||
      'https://bimatdoita-default-rtdb.firebaseio.com/'
    );
  } catch {
    return coupleConfig?.firebaseUrl || 'https://bimatdoita-default-rtdb.firebaseio.com/';
  }
}

export function setFirebaseUrl(url) {
  try {
    localStorage.setItem(FIREBASE_URL_KEY, (url || '').trim());
  } catch (e) {
    console.error('Failed to save firebase URL:', e);
  }
}

function getEndpointUrl(nodePath = 'coupleData') {
  const base = getFirebaseUrl().trim().replace(/\/$/, '');
  return `${base}/${nodePath}.json`;
}

/**
 * Đẩy dữ liệu Couple Profile lên Firebase
 */
export async function syncPushCoupleData(payload) {
  try {
    const url = getEndpointUrl('coupleData');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        syncedAt: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Lỗi khi đẩy thông tin đôi lên Cloud:', err);
    return false;
  }
}

/**
 * Kéo dữ liệu Couple Profile từ Firebase
 */
export async function syncPullCoupleData() {
  try {
    const url = getEndpointUrl('coupleData');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi kéo thông tin đôi từ Cloud:', err);
    return null;
  }
}

/**
 * Đẩy danh sách Thư bí mật (Time Capsules) lên Firebase
 */
export async function syncPushCapsules(capsulesList) {
  try {
    const url = getEndpointUrl('capsules');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capsulesList || []),
    });
    return res.ok;
  } catch (err) {
    console.error('Lỗi khi đẩy thư lên Cloud:', err);
    return false;
  }
}

/**
 * Kéo danh sách Thư bí mật từ Firebase
 */
export async function syncPullCapsules() {
  try {
    const url = getEndpointUrl('capsules');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Lỗi khi kéo thư từ Cloud:', err);
    return null;
  }
}

/**
 * Đẩy danh sách Kỷ niệm (Memories) lên Firebase
 */
export async function syncPushMemories(memoriesList) {
  try {
    const url = getEndpointUrl('memories');
    // Lọc bỏ blob nhị phân không serialize được
    const cleanMemories = (memoriesList || []).map((m) => {
      const { mediaBlob, ...rest } = m;
      return rest;
    });

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanMemories),
    });
    return res.ok;
  } catch (err) {
    console.error('Lỗi khi đẩy kỷ niệm lên Cloud:', err);
    return false;
  }
}

/**
 * Kéo danh sách Kỷ niệm từ Firebase
 */
export async function syncPullMemories() {
  try {
    const url = getEndpointUrl('memories');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Lỗi khi kéo kỷ niệm từ Cloud:', err);
    return null;
  }
}

/**
 * Lắng nghe cập nhật thời gian thực bằng EventSource (Server-Sent Events)
 */
export function subscribeToFirebase(nodePath, onUpdate) {
  const url = getFirebaseUrl();
  if (!url || typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }

  const sseUrl = getEndpointUrl(nodePath);
  let es = null;

  try {
    es = new EventSource(sseUrl);

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.data !== undefined && payload.data !== null) {
          onUpdate(payload.data);
        }
      } catch (e) {
        console.error(`Error handling SSE for ${nodePath}:`, e);
      }
    };

    es.addEventListener('put', handleMessage);
    es.addEventListener('patch', handleMessage);
    es.onerror = () => {
      // EventSource sẽ tự động thử kết nối lại
    };
  } catch (err) {
    console.error('Failed to create EventSource:', err);
  }

  return () => {
    if (es) {
      es.close();
      es = null;
    }
  };
}

/**
 * Tối ưu hóa ảnh tải lên thành Base64 nhẹ để lưu trực tiếp lên Firebase
 */
export async function compressImageToBase64(file, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Giữ tương thích ngược với code cũ
export const syncPushToCloud = syncPushCoupleData;
export const syncPullFromCloud = syncPullCoupleData;

/**
 * Xuất Mã Đồng Bộ Nhanh 1 chạm (Base64)
 */
export function generateSyncCode(data) {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error('Error generating sync code:', e);
    return '';
  }
}

/**
 * Nhập dữ liệu từ Mã Đồng Bộ Nhanh
 */
export function parseSyncCode(code) {
  try {
    const jsonStr = decodeURIComponent(atob(code.trim()));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Invalid sync code:', e);
    return null;
  }
}
