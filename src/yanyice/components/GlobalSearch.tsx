
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, ChevronRight, X, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useCaseStore } from '../stores/useCaseStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const customers = useCustomerStore(state => state.customers);
  const records = useCaseStore(state => state.records);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 快捷键监听：ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const filteredCustomers = query ? customers.filter(c => 
    c.name.includes(query) || (c.phone && c.phone.includes(query))
  ).slice(0, 5) : [];

  const filteredRecords = query ? records.filter(r => 
    r.subject.includes(query) || r.notes.includes(query)
  ).slice(0, 5) : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#2F2F2F]/20 backdrop-blur-md" onClick={onClose} />
      
      {/* Search Content */}
      <div className="relative w-full max-w-2xl bg-white border border-[#B37D56]/30 shadow-[0_24px_64px_rgba(0,0,0,0.2)] overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-[#B37D56]/10">
          <Search size={20} className="text-[#A62121] mr-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索客户、咨询记录、断语笔记..."
            className="flex-1 bg-transparent border-none outline-none text-lg chinese-font placeholder:text-[#2F2F2F]/20"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 bg-[#FAF7F2] border border-[#B37D56]/20 text-[#B37D56] font-bold rounded-[2px]">ESC</span>
            <button onClick={onClose} className="text-[#2F2F2F]/20 hover:text-[#A62121] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {!query ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 border border-[#B37D56]/10 flex items-center justify-center rotate-45 mx-auto mb-6">
                <Command size={20} className="text-[#B37D56]/30 -rotate-45" />
              </div>
              <p className="text-sm text-[#2F2F2F]/40 chinese-font italic tracking-widest">
                输入姓名、手机号或咨询关键词进行全库检索
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#B37D56]/5">
              {/* Customers Section */}
              {filteredCustomers.length > 0 && (
                <div className="p-4">
                  <h3 className="px-4 text-[10px] font-bold text-[#B37D56] uppercase tracking-[0.3em] mb-2">匹配客户</h3>
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/customers/edit/${c.id}`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#FAF7F2] group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#A62121]/5 border border-[#A62121]/10 flex items-center justify-center text-[#A62121]">
                          <User size={14} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#2F2F2F] chinese-font">{c.name}</p>
                          <p className="text-[10px] text-[#2F2F2F]/40">{c.gender === 'male' ? '乾造' : '坤造'} · {c.phone || '未录入电话'}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#B37D56]/20 group-hover:text-[#A62121] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {/* Records Section */}
              {filteredRecords.length > 0 && (
                <div className="p-4">
                  <h3 className="px-4 text-[10px] font-bold text-[#B37D56] uppercase tracking-[0.3em] mb-2">咨询卷宗</h3>
                  {filteredRecords.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(`/cases/edit/${r.id}`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#FAF7F2] group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#8DA399]/5 border border-[#8DA399]/10 flex items-center justify-center text-[#8DA399]">
                          <FileText size={14} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#2F2F2F] chinese-font">{r.subject}</p>
                          <p className="text-[10px] text-[#2F2F2F]/40">
                            {new Date(r.createdAt).toLocaleDateString()} · {r.module === 'liuyao' ? '六爻' : '八字'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#B37D56]/20 group-hover:text-[#A62121] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {filteredCustomers.length === 0 && filteredRecords.length === 0 && (
                <div className="p-20 text-center text-[#2F2F2F]/20 italic chinese-font">
                  未发现匹配的记录，请尝试其他关键词
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#B37D56]/10 flex items-center justify-between text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ChevronRight size={10}/> 选择结果</span>
            <span className="flex items-center gap-1"><X size={10}/> 关闭搜索</span>
          </div>
          <p>研易册 · 快捷搜索</p>
        </div>
      </div>
    </div>
  );
};
