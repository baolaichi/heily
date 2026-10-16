/**
 * Tiện ích định dạng ngày giờ theo phong cách Việt Nam
 */

export const formatVietnameseFull = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[d.getDay()];

  return `${dayName}, ngày ${day} tháng ${month} năm ${year} lúc ${hours}:${minutes}`;
};

export const formatVietnameseDateOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `Ngày ${day} tháng ${month} năm ${year}`;
};

export const formatVietnameseShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes} • ${day}/${month}/${year}`;
};

/**
 * Tách ngày giờ thành các thành phần Ngày, Tháng, Năm, Giờ, Phút
 */
export const parseDateComponents = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const valid = !isNaN(d.getTime()) ? d : new Date();

  return {
    day: valid.getDate(),
    month: valid.getMonth() + 1,
    year: valid.getFullYear(),
    hours: valid.getHours(),
    minutes: valid.getMinutes(),
  };
};

/**
 * Ghép các thành phần Ngày, Tháng, Năm, Giờ, Phút thành chuỗi ISO
 */
export const buildISOFromComponents = (day, month, year, hours = 0, minutes = 0) => {
  const d = new Date(year, month - 1, day, hours, minutes, 0);
  return d.toISOString();
};
