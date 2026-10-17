import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, Unlock, KeyRound, Sparkles, 
  Clock, Calendar, Heart, Send, CheckCircle2, 
  AlertCircle, Edit3, Trash2, Plus, RotateCcw, Save, X 
} from 'lucide-react';
import { coupleConfig } from '../data/config';
import { syncPushCapsules, syncPullCapsules, subscribeToFirebase } from '../utils/cloudSync';
import { notifyNewCapsule, notifyCapsuleUnlocked } from '../utils/notificationService';
import VietnameseDatePicker from './VietnameseDatePicker';
import { formatVietnameseFull, formatVietnameseDateOnly } from '../utils/dateUtils';

export default function TimeCapsule() {
  const [capsules, setCapsules] = useState(() => {
    try {
      const saved = localStorage.getItem('heily_time_capsules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return coupleConfig.timeCapsules || [];
  });

  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [unlockedIds, setUnlockedIds] = useState([]);

  // Form Thêm Thư Mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 86400000 * 30).toISOString());
  const [newTeaser, setNewTeaser] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPasscode, setNewPasscode] = useState('');

  // Form Chỉnh Sửa Thư
  const [editingCapsule, setEditingCapsule] = useState(null);

  const initialCapsuleCountRef = React.useRef(0);
  // Track capsules already notified on unlock so we don't spam on refresh
  const notifiedUnlockRef = React.useRef(new Set(
    (() => { try { return JSON.parse(localStorage.getItem('heily_notified_unlocks') || '[]'); } catch { return []; } })()
  ));

  // Kéo thư từ Firebase & lắng nghe thời gian thực tức thì
  useEffect(() => {
    syncPullCapsules().then((remoteList) => {
      if (Array.isArray(remoteList) && remoteList.length > 0) {
        setCapsules(remoteList);
        initialCapsuleCountRef.current = remoteList.length;
        try {
          localStorage.setItem('heily_time_capsules', JSON.stringify(remoteList));
        } catch (e) {}
      }
    });

    const unsubscribe = subscribeToFirebase('capsules', (remoteList) => {
      if (Array.isArray(remoteList)) {
        if (initialCapsuleCountRef.current > 0 && remoteList.length > initialCapsuleCountRef.current) {
          const newest = remoteList[remoteList.length - 1];
          notifyNewCapsule('Người Yêu', newest?.title);
        }
        initialCapsuleCountRef.current = remoteList.length;
        setCapsules(remoteList);
        try {
          localStorage.setItem('heily_time_capsules', JSON.stringify(remoteList));
        } catch (e) {}
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Scheduler: kiem tra thu den ngay mo khoa moi 60 giay
  useEffect(() => {
    const checkUnlocks = () => {
      const now = new Date();
      capsules.forEach((capsule) => {
        if (!capsule.isLocked) return;
        const unlockDate = new Date(capsule.unlockDate);
        if (unlockDate <= now && !notifiedUnlockRef.current.has(capsule.id)) {
          notifyCapsuleUnlocked(capsule.title);
          notifiedUnlockRef.current.add(capsule.id);
          try {
            localStorage.setItem(
              'heily_notified_unlocks',
              JSON.stringify([...notifiedUnlockRef.current])
            );
          } catch (e) {}
        }
      });
    };
    checkUnlocks(); // Kiem tra ngay khi mount
    const interval = setInterval(checkUnlocks, 60_000);
    return () => clearInterval(interval);
  }, [capsules]);

  // Luu tu dong vao LocalStorage va day len Firebase dong bo 2 may
  const saveAllCapsules = (newList) => {
    setCapsules(newList);
    try {
      localStorage.setItem('heily_time_capsules', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save capsules:', e);
    }
    syncPushCapsules(newList);
  };

  const handleUnlockWithPasscode = (capsule) => {
    if (!passcodeInput.trim()) {
      setPasscodeError('Vui lòng nhập mật mã nhé!');
      return;
    }
    if (capsule.passcode && passcodeInput.trim().toLowerCase() === capsule.passcode.toLowerCase()) {
      setUnlockedIds((prev) => [...prev, capsule.id]);
      setPasscodeError('');
      setPasscodeInput('');
    } else {
      setPasscodeError('Mật mã chưa chính xác rồi nè! Thử kiểm tra lại nhé.');
    }
  };

  // Thêm thư mới
  const handleSaveNewLetter = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem = {
      id: `capsule-${Date.now()}`,
      title: newTitle.trim(),
      unlockDate: newDate,
      isLocked: true,
      passcode: newPasscode.trim() || 'yeuthuong',
      teaser: newTeaser.trim() || 'Bức thư đặc biệt do tụi mình vừa viết và cất vào hộp thời gian.',
      letterContent: newContent.trim(),
    };

    saveAllCapsules([...capsules, newItem]);

    // Reset form
    setNewTitle('');
    setNewTeaser('');
    setNewContent('');
    setNewPasscode('');
    setShowAddForm(false);
  };

  // Mở form chỉnh sửa
  const handleStartEdit = (capsule, e) => {
    if (e) e.stopPropagation();
    setEditingCapsule({ ...capsule });
    setSelectedCapsule(null); // Đóng modal đọc thư nếu đang mở
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCapsule || !editingCapsule.title.trim()) return;

    const updated = capsules.map((c) => (c.id === editingCapsule.id ? editingCapsule : c));
    saveAllCapsules(updated);
    setEditingCapsule(null);
  };

  // Xóa thư
  const handleDeleteCapsule = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa bức thư này khỏi hộp thời gian?')) {
      const updated = capsules.filter((c) => c.id !== id);
      saveAllCapsules(updated);
      if (selectedCapsule?.id === id) setSelectedCapsule(null);
    }
  };

  // Khôi phục mặc định
  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về danh sách hộp thư mẫu ban đầu?')) {
      saveAllCapsules(coupleConfig.timeCapsules);
    }
  };

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-rose-100/80 px-4 py-1.5 rounded-full text-rose-700 text-xs font-semibold">
          <Mail className="w-4 h-4 text-rose-500" />
          <span>Hẹn Ước Tương Lai</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-800">
          Hộp Thư Tương Lai (Time Capsule) 💌
        </h2>
        <p className="text-sm md:text-base text-slate-600 max-w-md mx-auto">
          Nơi cất giữ những bức thư bí mật, tự do viết mới, chỉnh sửa hoặc hẹn giờ mở khóa ngọt ngào!
        </p>

        {/* Nút viết thư mới & khôi phục */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white text-xs md:text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Đóng Form Viết Thư' : '+ Viết Bức Thư Hẹn Giờ Mới'}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white text-slate-500 border border-rose-200 text-xs font-medium hover:bg-rose-50 transition"
            title="Khôi phục thư mẫu ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục thư mẫu</span>
          </button>
        </div>
      </div>

      {/* FORM THÊM THƯ MỚI */}
      {showAddForm && (
        <form onSubmit={handleSaveNewLetter} className="glass-card rounded-3xl p-6 md:p-8 border border-rose-200 shadow-xl space-y-4 animate-in fade-in">
          <h3 className="font-serif font-bold text-slate-800 text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-500" />
            Gửi Một Bức Thư Hẹn Giờ Vào Tương Lai
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiêu đề bức thư: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Mở vào sinh nhật 21 tuổi của em..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs md:text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mật mã mở khóa sớm (nếu không muốn đợi):
              </label>
              <input
                type="text"
                placeholder="VD: heily2026, maiyeuem..."
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs md:text-sm bg-white"
              />
            </div>
          </div>

          {/* Chọn ngày hẹn giờ mở thư (Chuẩn tiếng Việt) */}
          <VietnameseDatePicker
            value={newDate}
            onChange={setNewDate}
            label="Chọn Ngày & Giờ Hẹn Khóa Mở Thư (Chuẩn Tiếng Việt)"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Lời nhắn tóm tắt / Teaser (hiện khi thư đang khóa):
            </label>
            <input
              type="text"
              placeholder="VD: Chứa đựng điều ước bí mật và món quà bất ngờ anh muốn dành tặng em..."
              value={newTeaser}
              onChange={(e) => setNewTeaser(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs md:text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nội dung bức thư: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Viết những lời dặn dò, yêu thương chân thành nhất gửi cho người ấy ở tương lai..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              className="w-full p-4 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs md:text-sm bg-white leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs md:text-sm font-semibold shadow-md hover:scale-105 transition"
            >
              Khóa Vào Hộp Thời Gian 🔐
            </button>
          </div>
        </form>
      )}

      {/* MODAL CHỈNH SỬA THƯ (EDIT CAPSULE MODAL) */}
      {editingCapsule && (
        <div
          onClick={() => setEditingCapsule(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 relative"
          >
            <button
              onClick={() => setEditingCapsule(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1.5">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-slate-800 text-xl">
                Chỉnh Sửa Bức Thư Hẹn Giờ
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu đề thư:</label>
                <input
                  type="text"
                  value={editingCapsule.title}
                  onChange={(e) => setEditingCapsule({ ...editingCapsule, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mật mã mở sớm:</label>
                <input
                  type="text"
                  value={editingCapsule.passcode || ''}
                  onChange={(e) => setEditingCapsule({ ...editingCapsule, passcode: e.target.value })}
                  placeholder="Để trống nếu không đặt mật mã"
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              {/* Bộ chọn ngày mở khóa chuẩn tiếng Việt */}
              <VietnameseDatePicker
                value={editingCapsule.unlockDate}
                onChange={(d) => setEditingCapsule({ ...editingCapsule, unlockDate: d })}
                label="Ngày & Giờ Mở Khóa Thư (Chuẩn Tiếng Việt)"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lời nhắn tóm tắt / Teaser:</label>
                <input
                  type="text"
                  value={editingCapsule.teaser || ''}
                  onChange={(e) => setEditingCapsule({ ...editingCapsule, teaser: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung bức thư:</label>
                <textarea
                  rows={5}
                  value={editingCapsule.letterContent || ''}
                  onChange={(e) => setEditingCapsule({ ...editingCapsule, letterContent: e.target.value })}
                  required
                  className="w-full p-3 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCapsule(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-6 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs md:text-sm font-semibold shadow hover:scale-105 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Chỉnh Sửa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DANH SÁCH CÁC HỘP THƯ (CAPSULES GRID) */}
      {capsules.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto border border-rose-200 shadow-md space-y-4 my-4 animate-in fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            💌
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-lg sm:text-2xl text-slate-800">
              Hộp thư thời gian đang trống
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Hãy viết một bức thư ngọt ngào gửi gắm tâm sự cho người ấy và đặt lịch hẹn mở vào sinh nhật, lễ kỷ niệm hay một ngày đặc biệt trong tương lai nhé! 🔐
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Viết Bức Thư Hẹn Giờ Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capsules.map((capsule) => {
            const isDatePassed = new Date(capsule.unlockDate) <= new Date();
            const isManuallyUnlocked = unlockedIds.includes(capsule.id);
            const isUnlocked = !capsule.isLocked || isDatePassed || isManuallyUnlocked;

          return (
            <div
              key={capsule.id}
              className={`glass-card rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                isUnlocked
                  ? 'border-rose-300 bg-white/95 shadow-md hover:shadow-xl'
                  : 'border-slate-200 bg-slate-50/70 shadow-xs'
              }`}
            >
              <div>
                {/* Header Status & Action Buttons (SỬA & XÓA) */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2.5 rounded-2xl ${
                      isUnlocked ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isUnlocked ? 'Đã Mở Khóa' : 'Đang Khóa Hẹn Giờ'}
                    </span>
                    {/* Badge: vua mo khoa trong 24h qua */}
                    {isDatePassed && capsule.isLocked && (new Date() - new Date(capsule.unlockDate)) < 86400000 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                        🎉 Vừa mở hôm nay!
                      </span>
                    )}
                  </div>

                  {/* Nút Chỉnh Sửa & Xóa */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleStartEdit(capsule, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Chỉnh sửa bức thư này"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCapsule(capsule.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa bức thư này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Teaser */}
                <h3 className="font-serif font-bold text-slate-800 text-lg mb-2">
                  {capsule.title}
                </h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4">
                  {capsule.teaser}
                </p>
              </div>

              {/* Bottom details */}
              <div className="pt-4 border-t border-rose-100/70">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    Mở vào: {formatVietnameseDateOnly(capsule.unlockDate)}
                  </span>
                  {capsule.passcode && !isUnlocked && (
                    <span className="text-rose-500 font-medium text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">
                      Mở bằng Passcode
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedCapsule(capsule);
                    setPasscodeError('');
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs md:text-sm transition flex items-center justify-center space-x-2 ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md hover:scale-102'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Đọc Bức Thư Này</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Nhập Mật Mã Mở Khóa Sớm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Capsule Content / Passcode Dialog Modal */}
      {selectedCapsule && (
        <div
          onClick={() => setSelectedCapsule(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-rose-100 animate-in zoom-in-95 relative"
          >
            <button
              onClick={() => setSelectedCapsule(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              ✕
            </button>

            {/* If unlocked: show sweet letter */}
            {(!selectedCapsule.isLocked || new Date(selectedCapsule.unlockDate) <= new Date() || unlockedIds.includes(selectedCapsule.id)) ? (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 fill-rose-500" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-800 text-xl">
                    {selectedCapsule.title}
                  </h3>
                  <p className="text-xs text-rose-500 font-cursive mt-1">
                    Thư gửi từ trái tim yêu thương
                  </p>
                </div>

                <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 font-serif text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                  {selectedCapsule.letterContent}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {/* Nút sửa nhanh ngay trong lúc đọc thư */}
                  <button
                    onClick={() => handleStartEdit(selectedCapsule)}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa bức thư này</span>
                  </button>

                  <button
                    onClick={() => setSelectedCapsule(null)}
                    className="px-6 py-2 bg-rose-500 text-white rounded-full text-xs md:text-sm font-semibold shadow hover:bg-rose-600"
                  >
                    Đóng Thư
                  </button>
                </div>
              </div>
            ) : (
              /* If locked: show passcode input */
              <div className="space-y-5 text-center">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-800 text-xl">
                    {selectedCapsule.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Bức thư sẽ tự động mở vào {formatVietnameseFull(selectedCapsule.unlockDate)}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-rose-600">
                    Muốn đọc ngay bây giờ? Nhập mật khẩu tình yêu:
                  </p>
                  <input
                    type="text"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Nhập mật mã bí mật..."
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-center font-medium text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  {passcodeError && (
                    <p className="text-xs text-rose-600 flex items-center justify-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {passcodeError}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleUnlockWithPasscode(selectedCapsule)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs md:text-sm rounded-xl shadow-md hover:scale-102 transition"
                    >
                      Mở Khóa Ngay 🔓
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleStartEdit(selectedCapsule)}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1 mx-auto"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Chỉnh sửa ngày hẹn hoặc mật mã</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
