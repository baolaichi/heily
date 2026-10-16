import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { parseDateComponents, buildISOFromComponents, formatVietnameseFull } from '../utils/dateUtils';

export default function VietnameseDatePicker({ value, onChange, label = "Chọn Thời Gian" }) {
  const initial = parseDateComponents(value);

  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);

  useEffect(() => {
    const comp = parseDateComponents(value);
    setDay(comp.day);
    setMonth(comp.month);
    setYear(comp.year);
    setHours(comp.hours);
    setMinutes(comp.minutes);
  }, [value]);

  const handleUpdate = (newD, newM, newY, newH, newMin) => {
    const isoString = buildISOFromComponents(newD, newM, newY, newH, newMin);
    if (onChange) {
      onChange(isoString);
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const adjustedDay = Math.min(day, daysInMonth);

  return (
    <div className="bg-rose-50/70 p-3 sm:p-4 rounded-2xl border border-rose-200/80 space-y-2.5 sm:space-y-3">
      {label && (
        <label className="block text-xs font-semibold text-rose-700 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="line-clamp-1">{label}</span>
        </label>
      )}

      {/* Grid Ngày, Tháng, Năm */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Ngày */}
        <div>
          <span className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:mb-1">Ngày</span>
          <select
            value={adjustedDay}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setDay(val);
              handleUpdate(val, month, year, hours, minutes);
            }}
            className="w-full px-1.5 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Ngày {d}
              </option>
            ))}
          </select>
        </div>

        {/* Tháng */}
        <div>
          <span className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:mb-1">Tháng</span>
          <select
            value={month}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setMonth(val);
              handleUpdate(day, val, year, hours, minutes);
            }}
            className="w-full px-1.5 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>

        {/* Năm */}
        <div>
          <span className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:mb-1">Năm</span>
          <select
            value={year}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setYear(val);
              handleUpdate(day, month, val, hours, minutes);
            }}
            className="w-full px-1.5 sm:px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
          >
            {Array.from({ length: 30 }, (_, i) => 2015 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Giờ và Phút */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-100">
        <div>
          <span className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-400" />
            Giờ (24h)
          </span>
          <select
            value={hours}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setHours(val);
              handleUpdate(day, month, year, val, minutes);
            }}
            className="w-full px-2 py-1.5 text-[11px] sm:text-xs font-medium bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
          >
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')} giờ
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:mb-1">Phút</span>
          <select
            value={minutes}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setMinutes(val);
              handleUpdate(day, month, year, hours, val);
            }}
            className="w-full px-2 py-1.5 text-[11px] sm:text-xs font-medium bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-700"
          >
            {Array.from({ length: 60 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')} phút
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dòng xem trước tiếng Việt */}
      <div className="text-[10px] sm:text-[11px] text-rose-600 font-medium bg-white/90 px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1.5">
        <span>✨</span>
        <span className="line-clamp-1">{formatVietnameseFull(buildISOFromComponents(day, month, year, hours, minutes))}</span>
      </div>
    </div>
  );
}
