import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value: string; 
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const ChineseDatePicker: React.FC<Props> = ({ value, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [mode, setMode] = useState<'day' | 'year'>('day');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  const selectedDate = value ? new Date(value) : null;

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMode('day');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 关键优化：当切换到年份模式时，确保立即滚动到当前年份，消除跳变感
  useEffect(() => {
    if (mode === 'year' && activeYearRef.current) {
      // 使用 requestAnimationFrame 或 0延迟的 setTimeout 确保元素已在 DOM 中布局
      const scrollTimer = setTimeout(() => {
        activeYearRef.current?.scrollIntoView({ 
          block: 'center', 
          behavior: 'auto' // 使用 auto 而非 smooth，确保瞬间到达
        });
      }, 0);
      return () => clearTimeout(scrollTimer);
    }
  }, [mode]);

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
  
  const handleYearClick = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setMode('day');
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const isSelected = selectedDate?.getFullYear() === year && 
                         selectedDate?.getMonth() === month && 
                         selectedDate?.getDate() === d;
      const isToday = new Date().getFullYear() === year && 
                      new Date().getMonth() === month && 
                      new Date().getDate() === d;

      days.push(
        <button
          key={d}
          onClick={() => {
            const newDate = new Date(year, month, d);
            onChange(newDate.toISOString());
            setIsOpen(false);
          }}
          className={`h-8 w-8 text-xs flex items-center justify-center transition-colors rounded-[2px] ${
            isSelected 
              ? 'bg-[#A62121] text-white font-bold' 
              : isToday 
                ? 'text-[#A62121] border border-[#A62121]/20' 
                : 'text-[#2F2F2F] hover:bg-[#A62121]/5'
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const renderYearPicker = () => {
    const currentYear = viewDate.getFullYear();
    const years = [];
    // 覆盖更广的范围
    for (let y = 1900; y <= 2100; y++) {
      const isActive = y === currentYear;
      years.push(
        <button
          key={y}
          ref={isActive ? activeYearRef : null}
          onClick={() => handleYearClick(y)}
          className={`py-3 text-xs flex items-center justify-center transition-all border ${
            isActive 
            ? 'bg-[#A62121] text-white border-[#A62121] font-bold z-10 shadow-sm' 
            : 'text-[#2F2F2F] border-transparent hover:border-[#B37D56]/20 hover:bg-[#FAF7F2]'
          }`}
        >
          {y}年
        </button>
      );
    }
    return (
      <div 
        className="grid grid-cols-3 gap-1 py-1 overflow-y-auto h-[240px] custom-scrollbar"
      >
        {years}
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1 block">{label}</label>}
      <button
        onClick={() => {
          if (!isOpen && value) {
            setViewDate(new Date(value));
          }
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between bg-transparent border-b border-[#2F2F2F]/10 py-1.5 outline-none focus:border-[#A62121] transition-colors chinese-font text-sm text-left group"
      >
        <span className={value ? 'text-[#2F2F2F] font-medium' : 'text-[#2F2F2F]/30'}>
          {value ? new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder}
        </span>
        <CalendarIcon size={14} className="text-[#B37D56]/40 group-hover:text-[#A62121] transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 p-4 bg-white border border-[#B37D56]/20 shadow-[0_12px_40px_rgba(0,0,0,0.1)] z-50 w-72 rounded-[4px] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-[#B37D56]/5 pb-3">
            <button 
              onClick={handlePrevMonth} 
              className={`p-1 hover:text-[#A62121] transition-colors ${mode === 'year' ? 'invisible' : ''}`}
            >
              <ChevronLeft size={16}/>
            </button>
            <button 
              onClick={() => setMode(mode === 'year' ? 'day' : 'year')}
              className="text-sm font-bold text-[#2F2F2F] chinese-font tracking-widest hover:text-[#A62121] flex items-center gap-1 group"
            >
              {viewDate.getFullYear()}年 {mode === 'day' && `${viewDate.getMonth() + 1}月`}
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity ml-1">
                {mode === 'day' ? '修改年份' : '返回'}
              </span>
            </button>
            <button 
              onClick={handleNextMonth} 
              className={`p-1 hover:text-[#A62121] transition-colors ${mode === 'year' ? 'invisible' : ''}`}
            >
              <ChevronRight size={16}/>
            </button>
          </div>
          
          {mode === 'day' ? (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] text-[#B37D56] font-bold">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderDays()}
              </div>
            </>
          ) : renderYearPicker()}

          <div className="mt-4 pt-3 border-t border-[#B37D56]/5 flex justify-between items-center">
            <button 
              onClick={() => { 
                const now = new Date();
                setViewDate(now);
                onChange(now.toISOString()); 
                setIsOpen(false); 
                setMode('day');
              }}
              className="text-[10px] font-bold text-[#A62121] uppercase tracking-widest hover:underline"
            >
              今日
            </button>
            <button 
              onClick={() => { setIsOpen(false); setMode('day'); }}
              className="text-[10px] font-bold text-[#2F2F2F]/40 uppercase tracking-widest hover:text-[#2F2F2F]"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
