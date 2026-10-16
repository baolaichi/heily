# 📸 Thư mục chứa hình ảnh kỷ niệm của hai bạn

Bạn có thể copy các bức ảnh thật của hai đứa vào đây:
- Ví dụ:
  - `public/images/avatar-boy.jpg`
  - `public/images/avatar-girl.jpg`
  - `public/images/ha-giang.jpg`
  - `public/images/hen-ho.jpg`

### Cách sử dụng trong code:
Mở file `src/data/config.js`, sửa đường dẫn ảnh trong `timeline` hoặc `polaroids`:
```javascript
{
  date: "2024-05-18",
  title: "Chuyến Đi Hà Giang",
  image: "/images/ha-giang.jpg", // <-- Tự động nhận từ public/images/
}
```
Deploy lên Vercel không bao giờ bị lỗi ảnh hay hết hạn link!
