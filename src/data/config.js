export const coupleConfig = {
  // Thông tin cặp đôi
  boy: {
    name: "Quốc Bảo",
    nickname: "Anh người yêu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
  },
  girl: {
    name: "Bảo Thy (Heily)",
    nickname: "Bé cưng của anh",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
  },

  // Ngày bắt đầu yêu nhau (Năm-Tháng-NgàyTHi:Phút:Giây)
  startDate: "2023-10-20T20:00:00",

  // Danh sách các sự kiện đặc biệt (Tự động tìm sự kiện gần nhất trong tương lai để đếm ngược)
  events: [
    {
      id: "event-1",
      title: "Chuyến Du Lịch Hẹn Trước ✈️",
      date: "2026-11-15T09:00:00",
      description: "Cùng nhau xách balo lên và đi đến vùng đất mới ngập tràn nắng ấm!",
      icon: "✈️",
    },
    {
      id: "event-2",
      title: "Giáng Sinh Ngọt Ngào Bên Em 🎄",
      date: "2026-12-24T19:00:00",
      description: "Đón đêm Noel ấm áp, dạo phố đèn hoa và trao nhau những món quà bất ngờ.",
      icon: "🎄",
    },
    {
      id: "event-3",
      title: "Sinh Nhật Bé Cưng (Heily) 🎂",
      date: "2026-12-25T00:00:00",
      description: "Ngày thiên thần nhỏ đáng yêu nhất bước đến thế giới này ✨",
      icon: "🎂",
    },
    {
      id: "event-4",
      title: "Đón Giao Thừa Cùng Nhau 🎆",
      date: "2027-01-01T00:00:00",
      description: "Khoảnh khắc đếm ngược sang năm mới tay trong tay cầu chúc vạn điều bình an.",
      icon: "🎆",
    },
    {
      id: "event-5",
      title: "Lễ Tình Nhân (Valentine) 🌹",
      date: "2027-02-14T00:00:00",
      description: "Ngày của chúng mình, hoa hồng đỏ và những lời thì thầm yêu thương bất tận.",
      icon: "🌹",
    },
  ],

  // Sự kiện mặc định ban đầu nếu danh sách rỗng
  nextEvent: {
    title: "Sinh Nhật Bé Yêu",
    date: "2026-12-25T00:00:00",
    description: "Ngày thiên thần nhỏ đáng yêu nhất bước đến thế giới này 🎂✨",
  },

  // Câu quote tình yêu ở trang chủ
  romanticQuote: {
    text: "Cảm ơn em đã bước vào cuộc đời anh, biến những ngày bình thường thành những khoảnh khắc lấp lánh như cổ tích.",
    author: "Gửi em - Tình yêu to bự nhất",
  },

  // Danh sách bài hát du dương
  playlist: [

  ],

  // Các trạm câu hỏi trong Romantic Game
  gameStages: [
    {
      id: 1,
      title: "Trạm 1: Tia Sáng Đầu Tiên",
      subtitle: "Nụ cười của ai làm anh/em tan chảy từ lần gặp đầu tiên?",
      hint: "Bật mí: Ai là người có nụ cười tỏa nắng nhất quả đất nào?",
      options: [
        { id: "a", text: "Nụ cười của Heily má lúm đáng yêu", isCorrect: true, comment: "Chính xác 100%! Nụ cười của em làm tim anh lỡ nhịp ngay giây đầu tiên 💖" },
        { id: "b", text: "Cả hai đứa nhìn nhau ngơ ngác", isCorrect: false, comment: "Dễ thương nhưng lúc đó ánh mắt anh chỉ dính chặt vào nụ cười em thôi nè!" },
        { id: "c", text: "Anh cười duyên trước", isCorrect: false, comment: "Anh lúng túng muốn xỉu luôn á chớ!" },
      ],
    },
    {
      id: 2,
      title: "Trạm 2: Dấu Chân Kỷ Niệm",
      subtitle: "Kỷ niệm đáng nhớ nhất của tụi mình là ở đâu?",
      hint: "Nơi có sương mù, có hoàng hôn và những cái nắm tay thật chặt...",
      options: [
        { id: "a", text: "Chuyến đi Hà Giang săn mây ôm nhau ấm áp", isCorrect: true, comment: "Chuẩn luôn! Cái lạnh ở đó chẳng là gì so với hơi ấm khi em ôm anh từ đằng sau 🥰" },
        { id: "b", text: "Quán cà phê quen góc phố ngắm mưa", isCorrect: true, comment: "Góc quán quen lưu giữ biết bao lời thầm thì ngọt ngào của tụi mình!" },
        { id: "c", text: "Bất cứ nơi nào chỉ cần có em ở bên cạnh", isCorrect: true, comment: "Đáp án tuyệt đối nhất! Có em thì nơi nào cũng là thiên đường 💕" },
      ],
    },
    {
      id: 3,
      title: "Trạm 3: Điền Vào Ô Trống",
      subtitle: "Hoàn thiện câu nói từ tận đáy lòng:",
      template: "Anh yêu em nhiều hơn cả...",
      hint: "Gợi ý: Cả vũ trụ rộng lớn này cũng không đong đếm hết!",
      options: [
        { id: "a", text: "Cả dải ngân hà và muôn ngàn vì sao", isCorrect: true, comment: "Chính xác! Tình yêu này vượt qua mọi giới hạn không gian ✨" },
        { id: "b", text: "Cả trà sữa full topping và mọi món ngon trên đời", isCorrect: true, comment: "Haha đúng chuẩn sở thích của bé rồi nha! 🧋" },
        { id: "c", text: "Chính bản thân anh mỗi ngày một nhiều hơn", isCorrect: true, comment: "Thật lòng nhất trần đời! Yêu em hơn tất cả mọi thứ ❤️" },
      ],
    },
    {
      id: 4,
      title: "Trạm 4: Chiếc Chìa Khóa Định Mệnh",
      subtitle: "Mật mã mở khóa trái tim ngọt ngào:",
      type: "secretKey",
      prompt: "Chọn chiếc chìa khóa duy nhất gắn kết hai trái tim:",
      keys: [
        { id: "key-1", name: "Chìa khóa Chung Thủy", symbol: "🔑", valid: true },
        { id: "key-2", name: "Chìa khóa Thấu Hiểu", symbol: "🗝️", valid: true },
        { id: "key-3", name: "Chìa khóa Yêu Vô Điều Kiện", symbol: "💖", valid: true },
      ],
      successMessage: "Tất cả chìa khóa đều mở ra vì anh yêu em trọn vẹn mọi mặt!"
    }
  ],

  // Bức tâm thư / Thư tình trang trọng khi vượt qua mini-game
  loveLetter: {
    title: "Gửi Thiên Thần Nhỏ Của Anh - Heily",
    date: "Mãi mãi bên nhau",
    paragraphs: [
      "Em yêu à, khi em đang đọc những dòng chữ này thì chắc hẳn em đã hoàn thành chuyến hành trình tình yêu nhỏ mà anh kỳ công chuẩn bị riêng cho em.",
      "Mỗi ngày trôi qua có em bên cạnh đối với anh đều là một món quà vô giá. Từ cái nắm tay đầu tiên rụt rè, những chuyến đi cùng ngắm hoàng hôn, cho đến những tối cùng nhau tâm sự thâu đêm... tất cả đã dệt nên một bức tranh thanh xuân đẹp đẽ nhất cuộc đời anh.",
      "Cảm ơn em vì đã luôn dịu dàng, luôn bao dung cho những lúc anh vụng về, và đã cùng anh vượt qua những nốt thăng trầm. Anh hứa sẽ luôn là chỗ dựa vững chãi, luôn lắng nghe, chở che và làm em cười mỗi ngày.",
      "Cho dù mai này vật đổi sao dời, tình cảm anh dành cho em vẫn vẹn nguyên như ngày đầu tiên, và sẽ mỗi ngày một nhiều hơn nữa. Yêu em vô cùng, bé cưng của anh! ❤️"
    ],
    sign: "Người thương em nhất trần đời 🌹",
  },

  // Dòng thời gian kỷ niệm (Timeline)
  timeline: [
    {
      date: "2023-10-20",
      title: "Lời Tỏ Tình Dưới Phố Đèn Hoa",
      location: "Hà Nội",
      image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop",
      description: "Khoảnh khắc anh lấy hết dũng khí nắm tay em và nói: 'Làm người yêu anh nhé!'. Ánh mắt em gật đầu chính là điều kỳ diệu nhất.",
      tag: "Cột mốc thiêng liêng",
    },
    {
      date: "2024-02-14",
      title: "Lễ Tình Nhân Đầu Tiên (Valentine)",
      location: "Bữa tối ấm cúng",
      image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop",
      description: "Bó hoa hồng đỏ thắm và chiếc bánh kem ngọt ngào. Nụ cười hạnh phúc của em khi nhận quà làm anh nhớ mãi không quên.",
      tag: "Valentine",
    },
    {
      date: "2024-05-18",
      title: "Chuyến Đi Hà Giang Đầy Cảm Xúc",
      location: "Đèo Mã Pí Lèng - Hà Giang",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop",
      description: "Cùng nhau vượt qua những con đèo uốn lượn, đón sương mù và chạm tay vào mây trời. Tay trong tay giữa đất trời bao la.",
      tag: "Chuyến đi xa",
    },
    {
      date: "2024-10-20",
      title: "Kỷ Niệm 1 Năm Ngày Yêu",
      location: "Skyline View",
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop",
      description: "365 ngày trôi qua trong chớp mắt nhưng đong đầy hàng triệu kỷ niệm ngọt ngào. Tụi mình đã cùng nhau trưởng thành hơn rất nhiều.",
      tag: "1st Anniversary",
    },
    {
      date: "2025-07-15",
      title: "Hoàng Hôn Biển Vũng Tàu",
      location: "Bãi biển đầy cát vàng",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
      description: "Đi dạo chân trần trên cát, ngắm sóng biển dập dềnh và cùng nguyện ước về tương lai của một mái ấm ngập tràn tiếng cười.",
      tag: "Vitamin Sea",
    },
    {
      date: "2025-10-20",
      title: "Cột Mốc 2 Năm - Yêu Thương Bền Chặt",
      location: "Nơi quen thuộc của hai đứa",
      image: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=800&auto=format&fit=crop",
      description: "730 ngày bên nhau, mỗi ngày càng hiểu và thương nhau sâu sắc hơn. Cảm ơn em vì đã luôn là ngọn hải đăng bình yên trong đời anh.",
      tag: "2nd Anniversary",
    },
  ],

  // Album ảnh Polaroid
  polaroids: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
      caption: "Buổi hẹn hò đầu tiên ✨",
      date: "Tháng 10/2023",
      rotation: "-rotate-2",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop",
      caption: "Nụ cười tỏa nắng của em 🌻",
      date: "Mùa hè rực rỡ",
      rotation: "rotate-3",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
      caption: "Bé cưng dễ thương nhất trần đời 💖",
      date: "Khoảnh khắc ngẫu hứng",
      rotation: "-rotate-1",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
      caption: "Cái nắm tay ấm áp giữa mùa đông ❄️",
      date: "Đông 2024",
      rotation: "rotate-2",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
      caption: "Hành trình phượt cùng nhau 🏍️",
      date: "Mùa thu mát lành",
      rotation: "-rotate-3",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
      caption: "Uống trà chiều & ngắm phố phường ☕",
      date: "Cuối tuần bình yên",
      rotation: "rotate-1",
    },
  ],

  // Hộp thư tương lai (Time Capsule)
  timeCapsules: [
    {
      id: "capsule-1",
      title: "Bức Thư Mở Vào Sinh Nhật Tới Của Em 🎂",
      unlockDate: "2026-12-25T00:00:00",
      isLocked: true,
      passcode: "heily2026", // Có thể mở sớm bằng passcode nếu thích
      teaser: "Chứa đựng điều ước bí mật và món quà bất ngờ anh muốn dành tặng tuổi mới của bé cưng.",
      letterContent: "Chúc mừng sinh nhật thiên thần của anh! Lại thêm một tuổi mới, chúc em luôn rạng rỡ, bình an và mãi là cô gái hạnh phúc nhất thế gian. Món quà anh chuẩn bị cho em đang đợi em dưới gối đó nha!",
    },
    {
      id: "capsule-2",
      title: "Khi Em Cảm Thấy Giận Dỗi Hoặc Buồn Bực 🥺",
      unlockDate: "2024-01-01T00:00:00", // Mở sẵn cho những lúc cần đọc
      isLocked: false,
      teaser: "Hãy mở chiếc hộp này khi em thấy giận anh hoặc một ngày không mấy suôn sẻ nhé...",
      letterContent: "Bé cưng ơi, nếu em đang buồn vì anh vụng về hay làm em phật ý, cho anh xin lỗi thật nhiều nhé! Đừng ôm nỗi buồn một mình. Hít một hơi thật sâu, anh vẫn luôn ở đây yêu thương em vô điều kiện. Cho anh ôm em một cái thật chặt để tan biến hết muộn phiền nha! Anh thương em nhất trên đời. 💕",
    },
    {
      id: "capsule-3",
      title: "Hẹn Ước Cột Mốc 5 Năm Bên Nhau 💍",
      unlockDate: "2028-10-20T20:00:00",
      isLocked: true,
      passcode: "maiyeuem",
      teaser: "Bức thư gửi cho tương lai năm 2028 khi tụi mình tròn 5 năm bên nhau.",
      letterContent: "Chào anh và em ở năm thứ 5 của tình yêu! Nếu tụi mình đang cùng nhau mở bức thư này, thì xin chúc mừng tụi mình vì đã chứng minh tình yêu chân thành có thể vượt qua mọi thử thách. Anh tin lúc này tụi mình đã có một ngôi nhà nhỏ xinh ngập tràn hoa hồng và tiếng cười. Yêu em mãi mãi!",
    },
  ],
};
