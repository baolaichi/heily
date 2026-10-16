/**
 * Tiện ích IndexedDB để lưu trữ file âm thanh (MP3/WAV) dung lượng lớn trực tiếp trên trình duyệt
 * Không bị giới hạn 5MB như LocalStorage, chạy mượt mà trên cả máy tính và điện thoại.
 */

const DB_NAME = 'HeilyMusicDB';
const STORE_NAME = 'custom_songs';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Lưu bài hát mới vào IndexedDB
 */
export async function saveSongToDB(song) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(song);

    request.onsuccess = () => resolve(song);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Lấy tất cả bài hát tự tải lên từ IndexedDB
 */
export async function getAllSongsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Xóa một bài hát theo ID
 */
export async function deleteSongFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}
