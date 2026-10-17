import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Heart, X, Image, Trash2, 
  Smile, Sparkles, UserCheck, RefreshCw, ChevronDown, CheckCheck
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { 
  syncSendMessage, syncPullMessages, syncDeleteMessage, 
  syncReactToMessage, subscribeToMessages, compressImageToBase64 
} from '../utils/cloudSync';
import { notifyNewMessage } from '../utils/notificationService';

const CHAT_ROLE_KEY = 'bimatdoita_chat_sender_role';
const LAST_READ_KEY = 'bimatdoita_chat_last_read';

export default function CoupleChat() {
  const { coupleData } = useCouple();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Role: 'boy' | 'girl'
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem(CHAT_ROLE_KEY) || '';
  });

  // Đóng khung chat khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowRolePicker(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Đóng khung chat khi bấm chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isOpen) return;
      if (
        chatBoxRef.current && 
        !chatBoxRef.current.contains(e.target) && 
        !e.target.closest('#chat-trigger-btn')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const boyName = coupleData?.boy?.nickname || coupleData?.boy?.name || 'Anh';
  const girlName = coupleData?.girl?.nickname || coupleData?.girl?.name || 'Em';
  const boyAvatar = coupleData?.boy?.avatar || '/images/avatar-boy.svg';
  const girlAvatar = coupleData?.girl?.avatar || '/images/avatar-girl.svg';

  const currentName = userRole === 'boy' ? boyName : girlName;
  const currentAvatar = userRole === 'boy' ? boyAvatar : girlAvatar;

  const lastKnownMsgTimeRef = useRef(Date.now());

  // Lắng nghe và kéo tin nhắn từ Firebase Realtime Database
  useEffect(() => {
    // 1. Kéo tin nhắn khi vừa mở web
    syncPullMessages().then((list) => {
      setMessages(list);
      updateUnread(list);
      if (Array.isArray(list) && list.length > 0) {
        lastKnownMsgTimeRef.current = list[list.length - 1].timestamp || Date.now();
      }
    });

    // 2. Lắng nghe cập nhật thời gian thực bằng SSE
    const unsubscribe = subscribeToMessages((updatedList) => {
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        const latest = updatedList[updatedList.length - 1];
        if (latest && (latest.timestamp || 0) > lastKnownMsgTimeRef.current) {
          lastKnownMsgTimeRef.current = latest.timestamp;
          // Nếu tin nhắn từ đối phương và không phải do mình đang mở chat
          if (latest.senderRole !== userRole) {
            const partnerSenderName = latest.senderName || (userRole === 'boy' ? girlName : boyName);
            notifyNewMessage(partnerSenderName, latest.text || 'Đã gửi một hình ảnh 📸');
          }
        }
      }
      setMessages(updatedList);
      updateUnread(updatedList);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isOpen, userRole, boyName, girlName]);

  const updateUnread = (list) => {
    if (isOpen) {
      localStorage.setItem(LAST_READ_KEY, String(Date.now()));
      setUnreadCount(0);
    } else {
      const lastRead = Number(localStorage.getItem(LAST_READ_KEY) || 0);
      const unread = list.filter((m) => (m.timestamp || 0) > lastRead);
      setUnreadCount(unread.length);
    }
  };

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(LAST_READ_KEY, String(Date.now()));
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectRole = (role) => {
    setUserRole(role);
    localStorage.setItem(CHAT_ROLE_KEY, role);
    setShowRolePicker(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    if (!userRole) {
      setShowRolePicker(true);
      return;
    }

    setIsSending(true);
    try {
      let mediaUrl = '';
      if (selectedImage) {
        mediaUrl = await compressImageToBase64(selectedImage, 800, 0.7);
      }

      const newMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        senderRole: userRole,
        senderName: currentName,
        senderAvatar: currentAvatar,
        text: inputText.trim(),
        mediaUrl: mediaUrl || '',
        timestamp: Date.now(),
        reactions: {},
      };

      // Đẩy lên Firebase Realtime Database
      await syncSendMessage(newMsg);

      setInputText('');
      setSelectedImage(null);
      setImagePreview('');
      scrollToBottom();
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendHeartBomb = async () => {
    if (!userRole) {
      setShowRolePicker(true);
      return;
    }

    // Spawn tim trên màn hình hiện tại
    triggerScreenHearts();

    const heartMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderRole: userRole,
      senderName: currentName,
      senderAvatar: currentAvatar,
      text: '💖 Vừa gửi một bão tim yêu thương đến người ấy! 💖',
      isHeartBomb: true,
      timestamp: Date.now(),
      reactions: { [userRole]: '🥰' },
    };

    await syncSendMessage(heartMsg);
    scrollToBottom();
  };

  const triggerScreenHearts = () => {
    const newHearts = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
      size: Math.random() * 20 + 20,
      duration: Math.random() * 1.5 + 1.8,
    }));
    setFloatingHearts(newHearts);
    setTimeout(() => setFloatingHearts([]), 3500);
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm('Bạn có muốn thu hồi tin nhắn này?')) {
      await syncDeleteMessage(msgId);
    }
  };

  const handleReact = async (msgId, emoji) => {
    if (!userRole) {
      setShowRolePicker(true);
      return;
    }
    await syncReactToMessage(msgId, userRole, emoji);
  };

  const formatMessageTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Hiệu ứng bão tim bay khi ấn Bắn Tim */}
      {floatingHearts.map((h) => (
        <div
          key={h.id}
          className="fixed pointer-events-none z-[9999] animate-float-heart"
          style={{
            left: `${h.left}%`,
            bottom: '50px',
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
          }}
        >
          💖
        </div>
      ))}

      {/* NÚT BÓNG CHAT NỔI (Floating Chat Trigger) */}
      <button
        id="chat-trigger-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!userRole) setShowRolePicker(true);
        }}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-40 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full shadow-lg shadow-rose-400/40 hover:shadow-xl hover:shadow-rose-400/60 active:scale-95 transition-all duration-300 border border-white/40 backdrop-blur-md"
        aria-label="Mở khung chat đôi ta"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 text-white animate-pulse" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-[20px] h-5 px-1 bg-amber-400 text-rose-950 font-bold text-xs rounded-full flex items-center justify-center shadow-md animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="hidden sm:inline font-medium text-sm tracking-wide text-rose-50">
          Chat Đôi Ta 💕
        </span>
      </button>

      {/* KHUNG CHAT (Bottom Sheet on Mobile / Compact Popup on Desktop) */}
      {isOpen && (
        <>
          {/* Backdrop tối nhẹ trên mobile - chạm ra ngoài là đóng ngay */}
          <div
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Cửa sổ chat nhỏ gọn vừa vặn mọi màn hình laptop/desktop */}
          <div
            ref={chatBoxRef}
            className="fixed z-50 bottom-0 sm:bottom-20 left-0 sm:left-6 w-full sm:w-[360px] h-[82vh] sm:h-[480px] max-h-[calc(100vh-95px)] bg-gradient-to-b from-rose-50/98 via-white/98 to-pink-50/98 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-rose-200/90 flex flex-col overflow-hidden pb-safe animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-md select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1.5">
                  <img
                    src={boyAvatar}
                    alt={boyName}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover bg-white shadow-sm"
                  />
                  <img
                    src={girlAvatar}
                    alt={girlName}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover bg-white shadow-sm"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 leading-tight">
                    Hộp Chat Đôi Ta
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <button
                    onClick={() => setShowRolePicker(true)}
                    className="text-[11px] text-rose-100 hover:text-white flex items-center gap-1 mt-0.5 underline decoration-dotted"
                  >
                    Là: <span className="font-bold">{currentName}</span>
                    <RefreshCw className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSendHeartBomb}
                  title="Bắn tim cho người ấy"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center transition text-white"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Đóng chat (Esc hoặc chạm ra ngoài)"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 active:scale-90 flex items-center justify-center transition text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DANH SÁCH TIN NHẮN */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-rose-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-3 shadow-inner">
                    <Heart className="w-8 h-8 fill-rose-400 text-rose-500 animate-pulse" />
                  </div>
                  <p className="font-medium text-slate-700 text-sm">Chưa có tin nhắn nào</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Hãy gửi lời nhắn yêu thương đầu tiên cho người ấy nhé! Tin nhắn sẽ đồng bộ 24/7 ngay lập tức 💕
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = userRole ? msg.senderRole === userRole : false;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                    >
                      {/* Avatar */}
                      <img
                        src={msg.senderAvatar || (msg.senderRole === 'boy' ? boyAvatar : girlAvatar)}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-rose-200 bg-white flex-shrink-0"
                      />

                      {/* Bubble */}
                      <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium">
                          {msg.senderName}
                        </span>

                        <div
                          className={`relative p-3 rounded-2xl text-sm break-words shadow-sm ${
                            msg.isHeartBomb
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium border border-rose-300'
                              : isMe
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-none shadow-rose-200'
                              : 'bg-white text-slate-800 border border-rose-100 rounded-bl-none shadow-slate-100'
                          }`}
                        >
                          {/* Ảnh đính kèm */}
                          {msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="media"
                              className="rounded-xl max-h-48 w-auto object-cover mb-1.5 cursor-pointer hover:opacity-95"
                              onClick={() => window.open(msg.mediaUrl, '_blank')}
                            />
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                          {/* Giờ gửi */}
                          <div
                            className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                              isMe || msg.isHeartBomb ? 'text-rose-100' : 'text-slate-500'
                            }`}
                          >
                            <span>{formatMessageTime(msg.timestamp)}</span>
                            {isMe && <CheckCheck className="w-3 h-3 opacity-80" />}
                          </div>

                          {/* Reaction emojis hiển thị dưới bong bóng */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="absolute -bottom-2.5 right-2 bg-white/95 border border-rose-200 rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-0.5 text-xs">
                              {Object.entries(msg.reactions).map(([role, emoji]) => (
                                <span key={role} title={`${role === 'boy' ? boyName : girlName}`}>
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Thanh công cụ thả tim / xóa nhanh khi hover hoặc click */}
                        <div
                          className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <button
                            onClick={() => handleReact(msg.id, '❤️')}
                            className="text-xs hover:scale-125 transition"
                            title="Thả tim"
                          >
                            ❤️
                          </button>
                          <button
                            onClick={() => handleReact(msg.id, '🥰')}
                            className="text-xs hover:scale-125 transition"
                            title="Thương thương"
                          >
                            🥰
                          </button>
                          <button
                            onClick={() => handleReact(msg.id, '😘')}
                            className="text-xs hover:scale-125 transition"
                            title="Hôn"
                          >
                            😘
                          </button>
                          {isMe && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-slate-500 hover:text-rose-500 p-0.5 rounded transition"
                              title="Thu hồi tin nhắn"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Bar */}
            <div className="px-3 py-1.5 bg-rose-50/70 border-t border-rose-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-rose-500 font-medium flex items-center gap-0.5 whitespace-nowrap">
                <Sparkles className="w-3 h-3" /> Thả nhanh:
              </span>
              {['❤️', '😘', '💖', '🌹', '💌', '🥺', '🥰', '💍'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="hover:scale-125 active:scale-95 transition text-sm flex-shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Preview ảnh nếu đang chọn */}
            {imagePreview && (
              <div className="p-2 bg-rose-100/60 border-t border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-12 h-12 object-cover rounded-lg border border-rose-300"
                  />
                  <span className="text-xs text-rose-700 font-medium">Đã chọn 1 ảnh</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                  }}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* FORM NHẬP TIN NHẮN */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-rose-200/80 flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center transition flex-shrink-0"
                title="Gửi ảnh"
              >
                <Image className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhắn gửi yêu thương..."
                className="flex-1 py-2 px-3.5 bg-rose-50/50 border border-rose-200 rounded-full text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
              />

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !selectedImage)}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* BẢNG CHỌN DANH TÍNH (Role Picker Modal) */}
            {showRolePicker && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center border border-rose-200 shadow-2xl">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 mx-auto flex items-center justify-center mb-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">Bạn là ai nè? 🥰</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Chọn danh tính để tin nhắn hiển thị đúng tên và ảnh đại diện của bạn nhé:
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleSelectRole('boy')}
                      className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition ${
                        userRole === 'boy'
                          ? 'border-rose-500 bg-rose-50/80 text-rose-700 font-bold'
                          : 'border-slate-200 hover:border-rose-300 text-slate-700'
                      }`}
                    >
                      <img
                        src={boyAvatar}
                        alt="boy"
                        className="w-9 h-9 rounded-full object-cover border border-rose-300 bg-white"
                      />
                      <div className="text-left flex-1">
                        <div className="text-xs font-semibold text-slate-800">{boyName}</div>
                        <div className="text-[10px] text-slate-500">Chàng trai 👑</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectRole('girl')}
                      className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition ${
                        userRole === 'girl'
                          ? 'border-pink-500 bg-pink-50/80 text-pink-700 font-bold'
                          : 'border-slate-200 hover:border-pink-300 text-slate-700'
                      }`}
                    >
                      <img
                        src={girlAvatar}
                        alt="girl"
                        className="w-9 h-9 rounded-full object-cover border border-pink-300 bg-white"
                      />
                      <div className="text-left flex-1">
                        <div className="text-xs font-semibold text-slate-800">{girlName}</div>
                        <div className="text-[10px] text-slate-500">Cô gái 🎀</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </>
  );
}
