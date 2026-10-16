# 🎵 Thư mục chứa nhạc cố định của website

Bạn có thể copy trực tiếp các file nhạc yêu thích định dạng `.mp3` vào thư mục này:
- Ví dụ:
  - `public/music/doi-muoi.mp3`
  - `public/music/nang-tho.mp3`
  - `public/music/sweet-love.mp3`

### Cách sử dụng trong code:
Mở file `src/data/config.js`, sửa đường dẫn bài hát:
```javascript
{
  title: "Đôi Mươi",
  artist: "Hoàng Dũng",
  url: "/music/doi-muoi.mp3", // <-- Trỏ thẳng vào thư mục public/music/
  cover: "https://..."
}
```

Khi deploy lên Vercel hoặc GitHub, các bài hát này sẽ được phát trực tiếp cực kỳ mượt mà 24/7!
