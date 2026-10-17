/**
 * Quản lý lưu trữ Kỷ Niệm (Hình ảnh & Video) bằng IndexedDB
 * Lưu ảnh/video dưới dạng Blob thực (binary) — nhẹ hơn base64 ~30%
 * Không bị giới hạn 5MB của localStorage
 */

const DB_NAME = 'HeilyMemoriesDB';
const STORE_NAME = 'memories';
const DB_VERSION = 2; // v2: hỗ trợ mediaBlob (Blob binary)

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // v1 → v2: không cần tạo lại store, field mới (mediaBlob) tự thêm khi put()
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Nén ảnh thành Blob thực (binary) — nhẹ hơn base64 ~30%
 * Video: trả nguyên Blob gốc (không nén)
 */
export async function compressImageToBlob(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);

    // Video: giữ nguyên
    if (file.type && file.type.startsWith('video/')) {
      resolve(file);
      return;
    }

    // Ảnh: nén qua Canvas → Blob
    if (file.type && file.type.startsWith('image/')) {
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
          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
      return;
    }

    resolve(file);
  });
}

/**
 * Lấy thông tin dung lượng lưu trữ IndexedDB
 */
export async function getMemoriesStorageInfo() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(1);
      const totalMB = ((estimate.quota || 0) / 1024 / 1024 / 1024).toFixed(1);
      const percent = estimate.quota
        ? Math.round(((estimate.usage || 0) / estimate.quota) * 100)
        : 0;
      return { used: `${usedMB} MB`, total: `${totalMB} GB`, percent };
    }
  } catch (e) {}
  return { used: 'N/A', total: 'N/A', percent: 0 };
}

/**
 * Lấy tất cả kỷ niệm từ IndexedDB
 * Tự động tạo ObjectURL từ Blob để hiển thị ảnh/video
 */
export async function getMemoriesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      const mapped = results.map((item) => {
        let displayUrl = item.mediaUrl;
        // Ưu tiên Blob binary (v2+) → ObjectURL
        if (item.mediaBlob instanceof Blob) {
          try {
            displayUrl = URL.createObjectURL(item.mediaBlob);
          } catch (e) {
            console.error('Error creating ObjectURL for media:', e);
          }
        } else if (item.mediaBlob) {
          // Tương thích ngược với dữ liệu cũ
          try {
            const blob = new Blob([item.mediaBlob], { type: item.mediaMimeType || 'image/jpeg' });
            displayUrl = URL.createObjectURL(blob);
          } catch (e) {}
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
 * Không lưu displayUrl (URL tạm từ createObjectURL) vào DB
 */
export async function saveMemoryToDB(memory) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // Loại bỏ displayUrl trước khi lưu (là URL tạm thời)
    const { displayUrl, ...cleanMemory } = memory;
    const request = store.put(cleanMemory);

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
