/**
 * Quản lý lưu trữ Kỷ Niệm (Hình ảnh & Video) bằng IndexedDB
 * Giúp lưu trữ video và ảnh dung lượng lớn trực tiếp trên thiết bị, không bị giới hạn 5MB
 */

const DB_NAME = 'HeilyMemoriesDB';
const STORE_NAME = 'memories';
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
 * Lấy tất cả kỷ niệm từ IndexedDB
 */
export async function getMemoriesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      // Chuyển đổi blob thành URL có thể phát/hiển thị
      const mapped = results.map((item) => {
        let displayUrl = item.mediaUrl;
        if (item.mediaBlob) {
          try {
            displayUrl = URL.createObjectURL(item.mediaBlob);
          } catch (e) {
            console.error('Error creating ObjectURL for media:', e);
          }
        }
        return {
          ...item,
          displayUrl: displayUrl || item.mediaUrl,
        };
      });
      resolve(mapped);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Thêm hoặc cập nhật một kỷ niệm
 */
export async function saveMemoryToDB(memory) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(memory);

    request.onsuccess = () => resolve(memory);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Xóa một kỷ niệm theo ID
 */
export async function deleteMemoryFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Xóa tất cả các kỷ niệm mẫu (hardcode) nếu còn sót lại
 */
export async function clearAllDefaultMemories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result || [];
      items.forEach((item) => {
        if (typeof item.id === 'string' && (item.id.startsWith('default-') || item.isMock)) {
          store.delete(item.id);
        }
      });
      resolve(true);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}
