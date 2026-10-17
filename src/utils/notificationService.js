/**
 * Dịch vụ Thông Báo Điện Thoại (Web Push Notification Service)
 * Hỗ trợ rung chuông, phát âm thanh và hiển thị thông báo tức thì trên điện thoại khi:
 * 1. Có tin nhắn mới từ người yêu
 * 2. Người yêu đổi status / bài hát
 * 3. Có bức thư bí mật mới (Time Capsule)
 * 4. Có kỷ niệm mới (Memory)
 * 5. Sắp đến ngày kỷ niệm tình yêu
 */

// Kiểm tra trình duyệt có hỗ trợ Notification không
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Kiểm tra trạng thái cấp quyền hiện tại
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

// Yêu cầu người dùng cho phép nhận thông báo
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationChime();
      sendLocalNotification({
        title: '🔔 Thông báo đã được bật!',
        body: 'Bạn sẽ nhận được thông báo ngay khi người ấy nhắn tin, đổi status hoặc gửi thư tình 💕',
        tag: 'welcome_notify',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Lỗi khi xin quyền thông báo:', err);
    return false;
  }
}

// Phát âm thanh chuông "Ting... Ting! 🎵" êm tai và rung điện thoại
export function playNotificationChime() {
  try {
    // Rung điện thoại nếu là thiết bị di động
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 70, 180]);
    }

    // Phát âm thanh chuông bằng Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Hợp âm ngọt ngào C5 - E5 - G5
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
    });
  } catch (e) {
    // Bỏ qua nếu người dùng chưa tương tác trang web
  }
}

// Gửi thông báo trực tiếp lên điện thoại / màn hình
export async function sendLocalNotification({ title, body, icon = '/img/logo.png', tag = 'love_alert', image = null }) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  playNotificationChime();

  const options = {
    body: body || 'Có cập nhật mới từ tình yêu của bạn 💕',
    icon: icon,
    badge: '/img/logo.png',
    tag: tag,
    vibrate: [200, 100, 200],
    renotify: true,
    ...(image ? { image } : {}),
  };

  // Ưu tiên Service Worker (bắt buộc đối với Chrome trên Android để hiển thị notification)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !reg.active) {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(null), 1200))
        ]);
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) {
      console.warn('Lỗi gửi qua Service Worker:', e);
    }
  }

  // Fallback sang Web Notification chuẩn (cho Desktop Chrome/Firefox/Edge/Safari)
  try {
    new Notification(title, options);
  } catch (e) {
    console.warn('Không thể gửi thông báo qua Notification API:', e);
  }
}

// 1. Thông báo tin nhắn mới
export function notifyNewMessage(senderName, text) {
  let title = `💬 Tin nhắn mới từ ${senderName}`;
  let body = text || 'Gửi cho bạn một tin nhắn ngọt ngào 💕';

  if (text && text.includes('[Trả lời ảnh Locket')) {
    title = `📸 ${senderName} đã trả lời ảnh Locket!`;
    body = text.replace(/📸\s*\[Trả lời ảnh Locket[^\]]*\]\s*/i, '').trim() || 'Vừa gửi câu trả lời về bức ảnh 💕';
  }

  sendLocalNotification({
    title,
    body,
    tag: `msg_${Date.now()}`,
  });
}

// 2. Thông báo đổi status / bài hát
export function notifyStatusUpdate(partnerName, statusText, songTitle) {
  const content = statusText || (songTitle ? `Đang nghe: ${songTitle} 🎵` : 'Vừa cập nhật cảm xúc hôm nay 💕');
  sendLocalNotification({
    title: `💭 ${partnerName} vừa cập nhật suy nghĩ`,
    body: content,
    tag: 'status_update',
  });
}

// 3. Thông báo thư bí mật mới (Time Capsule)
export function notifyNewCapsule(senderName, title) {
  sendLocalNotification({
    title: `💌 Bức thư tình mới từ ${senderName}`,
    body: title ? `Tiêu đề: "${title}"` : 'Người ấy vừa gửi một bức thư bí mật vào Hộp Thư Đôi Ta!',
    tag: 'new_capsule',
  });
}

// 4. Thông báo kỷ niệm mới (Memory Timeline)
export function notifyNewMemory(title) {
  sendLocalNotification({
    title: `📸 Khoảnh khắc kỷ niệm mới`,
    body: title ? `"${title}" vừa được thêm vào dòng thời gian!` : 'Một hình ảnh / video ngọt ngào mới vừa được lưu giữ!',
    tag: 'new_memory',
  });
}

// 5. Thông báo sự kiện đến
export function notifyUpcomingEvent(eventName, daysLeft) {
  sendLocalNotification({
    title: `🎉 Nhắc nhở sự kiện: ${eventName}`,
    body: daysLeft === 0 
      ? 'Hôm nay chính là ngày đặc biệt của hai bạn! Hãy dành cho nhau những điều ngọt ngào nhất nhé 💕' 
      : `Chỉ còn ${daysLeft} ngày nữa là đến ngày đặc biệt rồi!`,
    tag: 'event_reminder',
  });
}

// 6. Thông báo ảnh Locket Live Photo mới
export function notifyNewLocketPhoto(senderName, caption, imageUrl) {
  sendLocalNotification({
    title: `📸 ${senderName} vừa gửi ảnh Locket mới!`,
    body: caption ? `"${caption}"` : 'Vừa gửi một khoảnh khắc tức thì đến màn hình của bạn 💕',
    tag: `locket_${Date.now()}`,
    image: imageUrl || undefined,
  });
}

// 7. Thông báo cảm xúc trên ảnh Locket
export function notifyLocketReaction(partnerName, emoji, caption) {
  sendLocalNotification({
    title: `${emoji} ${partnerName} đã thả cảm xúc vào ảnh Locket`,
    body: caption ? `Biểu cảm "${emoji}" cho ảnh: "${caption}"` : `Đã thả biểu cảm ${emoji} lên ảnh của bạn 💕`,
    tag: `locket_react_${Date.now()}`,
  });
}
// 8. Thông báo thư vừa mở khóa đúng ngày
export function notifyCapsuleUnlocked(title) {
  sendLocalNotification({
    title: `📨 Hộp Thư Đã Mở Khóa Hôm Nay!`,
    body: title
      ? `Bức thư “${title}” đã đến ngày mở. Hãy vào Hộp Thư để đọc nhé 💕`
      : 'Một bức thư bí mật đã đến ngày mở khóa. Hãy vào đọc ngày nhé 💕',
    tag: `capsule_unlock_${Date.now()}`,
  });
}
