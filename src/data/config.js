export const coupleConfig = {
  // Cờ báo hiệu chưa thiết lập (để người dùng tự nhập 100%)
  isConfigured: false,

  // Đường link Firebase Realtime Database kết nối chung cho 2 máy (Tự động đồng bộ tức thì)
  firebaseUrl: "https://bimatdoita-default-rtdb.firebaseio.com/",

  // Thông tin cặp đôi mặc định sạch (Không có bất kỳ thông tin giả nào)
  boy: {
    name: "Chàng Trai",
    nickname: "Anh người yêu 👑",
    avatar: "/images/avatar-boy.svg",
    pin: "1234",
  },
  girl: {
    name: "Cô Gái",
    nickname: "Bé cưng 🎀",
    avatar: "/images/avatar-girl.svg",
    pin: "5678",
  },

  // Ngày bắt đầu yêu nhau (Mặc định ngày hôm nay, người dùng tự chọn lại)
  startDate: new Date().toISOString(),

  // Danh sách sự kiện trống (Để hai bạn tự thêm)
  events: [],

  // Sự kiện mặc định nếu chưa thêm sự kiện nào
  nextEvent: {
    title: "Ngày Kỷ Niệm Tiếp Theo",
    date: new Date(Date.now() + 86400000 * 30).toISOString(),
    description: "Sắp tới ngày hẹn ước ngọt ngào của hai đứa!",
  },

  // Câu châm ngôn tình yêu ngọt ngào
  romanticQuote: {
    text: "Hạnh phúc không phải là đích đến, mà là hành trình mỗi ngày được yêu thương và cùng em già đi.",
    author: "Bí Mật Đôi Ta ✨",
  },

  // Danh sách bài hát tình yêu thật 100%
  playlist: [
    {
      id: "real-song-1",
      title: "Dôi Lời",
      artist: "Hoàng Dũng",
      url: "/music/doi-loi.mp3",
      cover: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "real-song-2",
      title: "Đừng Làm Trái Tim Anh Đau",
      artist: "Sơn Tùng M-TP / Obito",
      url: "/music/dung-lam-trai-tim-anh-dau.mp3",
      cover: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "real-song-3",
      title: "Dancing In The Dark",
      artist: "SOOBIN",
      url: "/music/dancing-in-the-dark.mp3",
      cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "real-song-4",
      title: "Một Ngày Nào Đó",
      artist: "Hoàng Dũng ft. Đen Vâu",
      url: "/music/mot-ngay-nao-do.mp3",
      cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "real-song-5",
      title: "Lý Giải",
      artist: "Hoàng Dũng",
      url: "/music/ly-giai.mp3",
      cover: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop",
    },
  ],

  // Trạm thử thách lãng mạn trung tính (không chứa tên người lạ)
  gameStages: [
    {
      id: 1,
      title: "Trạm 1: Tia Sáng Đầu Tiên",
      subtitle: "Điều gì ở đối phương đã làm tim bạn xao xuyến từ ánh nhìn đầu tiên?",
      hint: "Bật mí: Nụ cười tỏa nắng hay ánh mắt biết nói nào?",
      options: [
        { id: "a", text: "Nụ cười rạng rỡ và ánh mắt ngọt ngào", isCorrect: true, comment: "Chính xác! Nụ cười ấy làm tim mình xao xuyến ngay từ giây phút đầu tiên 💖" },
        { id: "b", text: "Sự dịu dàng và ấm áp vô cùng đáng yêu", isCorrect: true, comment: "Thật ấm áp! Sự chân thành luôn là sợi dây gắn kết hai trái tim 🥰" },
        { id: "c", text: "Giọng nói truyền cảm làm mình rung động", isCorrect: true, comment: "Giọng nói ngọt ngào nghe mãi không bao giờ chán! 💕" },
      ],
    },
    {
      id: 2,
      title: "Trạm 2: Dấu Chân Yêu Thương",
      subtitle: "Nơi nào là nơi tuyệt vời nhất trên đời đối với hai bạn?",
      hint: "Nơi đó không nhất thiết phải xa xôi...",
      options: [
        { id: "a", text: "Bất cứ nơi đâu chỉ cần có người ấy ở bên cạnh", isCorrect: true, comment: "Đáp án tuyệt vời nhất! Có người yêu thì nơi nào cũng ngập tràn hạnh phúc ❤️" },
        { id: "b", text: "Góc quán cafe quen ngắm phố phường", isCorrect: true, comment: "Bình yên và giản dị nhưng chan chứa kỷ niệm ngọt ngào! ☕" },
        { id: "c", text: "Những chuyến đi xa cùng nhau khám phá miền đất mới", isCorrect: true, comment: "Cùng nhau đi khắp thế gian và lưu giữ thật nhiều ảnh đẹp! ✈️" },
      ],
    },
    {
      id: 3,
      title: "Trạm 3: Lời Ước Từ Trái Tim",
      subtitle: "Hoàn thiện câu nói từ tận đáy lòng:",
      template: "Tình yêu của chúng mình sẽ luôn...",
      hint: "Gợi ý: Càng đi cùng nhau, càng thương nhau sâu sắc hơn!",
      options: [
        { id: "a", text: "Bền chặt, thấu hiểu và ngọt ngào qua năm tháng", isCorrect: true, comment: "Chuẩn xác 100%! Cùng nhau vun đắp tình yêu mãi mãi vững bền ✨" },
        { id: "b", text: "Ngập tràn tiếng cười và những cái ôm ấm áp", isCorrect: true, comment: "Tiếng cười và sự sẻ chia là chìa khóa của hạnh phúc! 🤗" },
        { id: "c", text: "Yêu thương trọn vẹn và mãi mãi không đổi thay", isCorrect: true, comment: "Lời hẹn ước thiêng liêng và chân thành nhất trần đời! 🌹" },
      ],
    },
    {
      id: 4,
      title: "Trạm 4: Chiếc Chìa Khóa Định Mệnh",
      subtitle: "Mật mã mở khóa trái tim ngọt ngào:",
      type: "secretKey",
      prompt: "Chọn chiếc chìa khóa gắn kết hai trái tim:",
      keys: [
        { id: "key-1", name: "Chìa khóa Chung Thủy", symbol: "🔑", valid: true },
        { id: "key-2", name: "Chìa khóa Thấu Hiểu", symbol: "🗝️", valid: true },
        { id: "key-3", name: "Chìa khóa Yêu Vô Điều Kiện", symbol: "💖", valid: true },
      ],
      successMessage: "Tất cả chìa khóa đều mở ra vì tình yêu của hai bạn luôn trọn vẹn!"
    }
  ],

  // Bức tâm thư trang trọng
  loveLetter: {
    title: "Bức Tâm Thư Gửi Người Thương",
    date: "Hành trình yêu thương",
    paragraphs: [
      "Gửi người yêu thương của anh/em, cảm ơn vì đã bước vào cuộc đời nhau và cùng nhau tạo nên những ngày tháng rực rỡ nhất.",
      "Mỗi khoảnh khắc được cùng nhau trò chuyện, cùng nhau đi qua những nốt thăng trầm của cuộc sống đều là món quà vô giá.",
      "Chúc cho tình yêu của hai đứa mình luôn dịu dàng, bền chặt và cùng nhau đi qua thật nhiều năm tháng bình yên phía trước.",
      "Yêu thương đong đầy và mãi mãi bên nhau! ❤️"
    ],
    sign: "Dành trọn cả trái tim 💕",
  },

  // Danh sách dòng thời gian trống
  timeline: [],

  // Danh sách ảnh Polaroid trống
  polaroids: [],

  // Danh sách hộp thư tương lai trống
  timeCapsules: [],
};
