/**
 * Tiện ích Đồng Bộ Đa Thiết Bị (Cross-Device Cloud Sync)
 * Hỗ trợ 2 phương thức:
 * 1. Đồng bộ đám mây tự động qua Firebase Realtime Database (Real-time sync 24/7)
 * 2. Mã đồng bộ 1 chạm (Sync Code): Sao chép từ máy này và Dán vào máy kia
 */

const FIREBASE_URL_KEY = 'heily_firebase_sync_url';

export function getFirebaseUrl() {
  try {
    return localStorage.getItem(FIREBASE_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setFirebaseUrl(url) {
  try {
    localStorage.setItem(FIREBASE_URL_KEY, (url || '').trim());
  } catch (e) {
    console.error('Failed to save firebase URL:', e);
  }
}

/**
 * Đẩy dữ liệu mới nhất lên đám mây Firebase
 */
export async function syncPushToCloud(payload) {
  const firebaseUrl = getFirebaseUrl();
  if (!firebaseUrl) return false;

  try {
    let cleanUrl = firebaseUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.endsWith('.json')) {
      cleanUrl = `${cleanUrl}/bimatdoita.json`;
    }

    const res = await fetch(cleanUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        syncedAt: new Date().toISOString(),
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Lỗi khi đẩy dữ liệu lên Cloud:', err);
    return false;
  }
}

/**
 * Kéo dữ liệu mới nhất từ đám mây Firebase về thiết bị
 */
export async function syncPullFromCloud() {
  const firebaseUrl = getFirebaseUrl();
  if (!firebaseUrl) return null;

  try {
    let cleanUrl = firebaseUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.endsWith('.json')) {
      cleanUrl = `${cleanUrl}/bimatdoita.json`;
    }

    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Lỗi khi kéo dữ liệu từ Cloud:', err);
    return null;
  }
}

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
