import React, { useState, useRef } from 'react';
import { 
  X, Camera, Video, MapPin, Tag, Calendar, 
  Sparkles, Upload, Save, Check, Link 
} from 'lucide-react';
import { compressImageToBlob } from '../utils/memoriesDB';
import { notifyNewMemory } from '../utils/notificationService';
import VietnameseDatePicker from './VietnameseDatePicker';
import { formatVietnameseFull } from '../utils/dateUtils';

export default function AddMemoryModal({ isOpen, onClose, onSaveMemory }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [location, setLocation] = useState('');
  const [tag, setTag] = useState('Hẹn hò lãng mạn');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const popularTags = [
    'Cột mốc thiêng liêng',
    'Chuyến đi xa',
    'Hẹn hò lãng mạn',
    'Valentine',
    'Sinh nhật',
    'Đời thường đáng yêu',
    'Khoảnh khắc ngọt ngào'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');

    const preview = URL.createObjectURL(file);
    setPreviewSrc(preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      let newMemory;

      if (uploadMode === 'file' && selectedFile) {
        // Lưu dạng Blob thực (binary) — tiết kiệm ~30% so với base64
        const blob = await compressImageToBlob(
          selectedFile,
          mediaType === 'video' ? undefined : 1200,
          0.82
        );
        newMemory = {
          id: `memory-${Date.now()}`,
          title: title.trim(),
          date: date,
          location: location.trim() || 'Nơi quen thuộc',
          tag: tag,
          description: description.trim(),
          mediaType: mediaType,
          mediaUrl: null,        // Không dùng base64 nữa
          mediaBlob: blob,       // Lưu Blob thực vào IndexedDB
          mediaMimeType: blob?.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
          likes: 0,
          createdAt: new Date().toISOString(),
        };
      } else {
        // Chế độ URL: vẫn dùng mediaUrl bình thường
        let finalUrl = mediaUrl.trim();
        if (!finalUrl) {
          finalUrl = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop';
        }
        newMemory = {
          id: `memory-${Date.now()}`,
          title: title.trim(),
          date: date,
          location: location.trim() || 'Nơi quen thuộc',
          tag: tag,
          description: description.trim(),
          mediaType: mediaType,
          mediaUrl: finalUrl,
          mediaBlob: null,
          likes: 0,
          createdAt: new Date().toISOString(),
        };
      }

      await onSaveMemory(newMemory);
      notifyNewMemory(newMemory.title);

      // Reset form
      setTitle('');
      setLocation('');
      setDescription('');
      setSelectedFile(null);
      setPreviewSrc('');
      setMediaUrl('');
      onClose();
    } catch (err) {
      alert('Lỗi khi lưu kỷ niệm: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-white via-rose-50/50 to-pink-50/30 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-rose-200 shadow-2xl relative pb-safe">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500 text-white shadow-md shadow-rose-200 mb-2">
            <Camera className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">
            Thêm Kỷ Niệm Mới Của Hai Đứa 💖
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Ghi lại những câu chuyện, chuyến đi cùng hình ảnh hoặc video ngọt ngào
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tiêu đề & Địa điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tiêu đề kỷ niệm: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Chuyến đi Hà Giang săn mây..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                Địa điểm:
              </label>
              <input
                type="text"
                placeholder="VD: Đèo Mã Pí Lèng, Hà Nội, Đà Lạt..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              />
            </div>
          </div>

          {/* Chọn ngày diễn ra (Chuẩn tiếng Việt) */}
          <VietnameseDatePicker
            value={date}
            onChange={setDate}
            label="Thời Gian Diễn Ra Kỷ Niệm (Chuẩn Tiếng Việt)"
          />

          {/* Tag / Nhãn phân loại */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-rose-400" />
              Chọn thẻ phân loại:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    tag === t
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Phần Tải Lên: HÌNH ẢNH hoặc VIDEO */}
          <div className="bg-white/90 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                {mediaType === 'video' ? <Video className="w-4 h-4 text-purple-500" /> : <Camera className="w-4 h-4 text-rose-500" />}
                <span>Chọn Hình Ảnh Hoặc Video</span>
              </span>

              {/* Mode Switcher */}
              <div className="inline-flex p-0.5 bg-rose-50 rounded-lg text-[11px] border border-rose-100">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    uploadMode === 'file' ? 'bg-rose-500 text-white' : 'text-slate-600'
                  }`}
                >
                  Tải từ máy/điện thoại
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    uploadMode === 'url' ? 'bg-rose-500 text-white' : 'text-slate-600'
                  }`}
                >
                  Dán đường link URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
                />
              <p className="text-[10px] text-slate-400 mt-1">
                Ảnh lưu dạng Blob binary (tiết kiệm ~30% so với base64). Video giữ nguyên chất lượng gốc. Tất cả lưu an toàn trên thiết bị bằng IndexedDB 🔒
              </p>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  placeholder="Dán đường dẫn ảnh hoặc video online (VD: https://...)"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setPreviewSrc(e.target.value);
                    if (e.target.value.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                      setMediaType('video');
                    } else {
                      setMediaType('image');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
              </div>
            )}

            {/* PREVIEW CONTAINER */}
            {previewSrc && (
              <div className="mt-2 rounded-2xl overflow-hidden max-h-48 bg-black/5 border border-rose-200 flex items-center justify-center relative">
                {mediaType === 'video' ? (
                  <video
                    src={previewSrc}
                    controls
                    className="max-h-48 w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewSrc}
                    alt="Xem trước"
                    className="max-h-48 w-full object-cover"
                  />
                )}
                <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {mediaType === 'video' ? '🎬 Video' : '📸 Hình ảnh'}
                </span>
              </div>
            )}
          </div>

          {/* Lời tự sự / Câu chuyện */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Câu chuyện kỷ niệm & Cảm xúc của hai bạn:
            </label>
            <textarea
              rows={3}
              placeholder="Kể lại khoảnh khắc đáng nhớ hôm ấy... (VD: Cùng nhau đón cơn gió lạnh đầu mùa và cái ôm thật ấm...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs md:text-sm rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-slate-700"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang Lưu Kỷ Niệm...' : 'Lưu Vào Dòng Thời Gian 💖'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
