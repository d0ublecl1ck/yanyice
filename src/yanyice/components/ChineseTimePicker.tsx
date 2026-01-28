
import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  value: string; // Format: "HH:mm"
  onChange: (time: string) => void;
  label?: string;
}

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const ChineseTimePicker: React.FC<Props> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hour, setHour] = useState(value ? value.split(':')[0] : '12');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '00');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHour = (h: string) => {
    const newTime = `${h}:${minute}`;
    setHour(h);
    onChange(newTime);
  };

  const handleSelectMinute = (m: string) => {
    const newTime = `${hour}:${m}`;
    setMinute(m);
    onChange(newTime);
  };

  const getShichen = (h: number) => {
    // 时辰计算逻辑
    const index = Math.floor((h + 1) / 2) % 12;
    return SHICHEN[index] + '时';
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1 block">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent border-b border-[#2F2F2F]/10 py-1.5 outline-none focus:border-[#A62121] transition-colors chinese-font text-sm text-left group"
      >
        <span className={value ? 'text-[#2F2F2F] font-medium' : 'text-[#2F2F2F]/30'}>
          {value ? `${value} (${getShichen(parseInt(hour))})` : '请选择出生时间'}
        </span>
        <Clock size={14} className="text-[#B37D56]/40 group-hover:text-[#A62121] transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 p-6 bg-white border border-[#B37D56]/20 shadow-[0_12px_40px_rgba(0,0,0,0.1)] z-50 w-80 rounded-[4px]">
          <div className="flex gap-6 h-64">
            {/* Hours Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-3 sticky top-0 bg-white py-1">小时</p>
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = i.toString().padStart(2, '0');
                  return (
                    <button
                      key={h}
                      onClick={() => handleSelectHour(h)}
                      className={`py-1.5 text-xs rounded-[2px] border ${
                        hour === h 
                        ? 'bg-[#A62121] text-white border-[#A62121]' 
                        : 'text-[#2F2F2F] border-transparent hover:border-[#B37D56]/20 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {h} <span className="text-[8px] opacity-40 ml-0.5">{getShichen(i)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-3 sticky top-0 bg-white py-1">分钟</p>
              <div className="grid grid-cols-2 gap-1">
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                  <button
                    key={m}
                    onClick={() => handleSelectMinute(m)}
                    className={`py-1.5 text-xs rounded-[2px] border ${
                      minute === m 
                      ? 'bg-[#A62121] text-white border-[#A62121]' 
                      : 'text-[#2F2F2F] border-transparent hover:border-[#B37D56]/20 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#B37D56]/10 flex justify-between items-center">
            <button 
              onClick={() => {
                const now = new Date();
                const h = now.getHours().toString().padStart(2, '0');
                const m = now.getMinutes().toString().padStart(2, '0');
                setHour(h);
                setMinute(m);
                onChange(`${h}:${m}`);
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-[#A62121] uppercase tracking-widest hover:underline"
            >
              设为现在
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-[#2F2F2F]/40 uppercase tracking-widest hover:text-[#2F2F2F]"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
