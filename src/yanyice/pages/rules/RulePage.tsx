
import React, { useState } from 'react';
import { Plus, Shield, ToggleLeft, ToggleRight, Trash2, BookOpen, Layers } from 'lucide-react';
import { useRuleStore } from '../../stores/useRuleStore';

type ModuleType = 'liuyao' | 'bazi';

export const RulePage: React.FC = () => {
  const { rules, addRule, updateRule, deleteRule } = useRuleStore();
  const [activeTab, setActiveTab] = useState<ModuleType>('liuyao');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMsg, setNewMsg] = useState('');

  const filteredRules = rules.filter(r => r.module === activeTab);

  const handleAdd = () => {
    if (!newName || !newMsg) return;
    addRule({
      module: activeTab,
      name: newName,
      enabled: true,
      condition: '自定义条件',
      message: newMsg
    });
    setNewName('');
    setNewMsg('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">断诀规则系统</h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">Deduction Rules Library</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
        >
          <Plus size={16} />
          新增规则
        </button>
      </header>

      {/* 子页面切换选项卡 */}
      <div className="flex border-b border-[#B37D56]/10">
        {[
          { id: 'liuyao', label: '六爻断诀', icon: Layers },
          { id: 'bazi', label: '八字断诀', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ModuleType)}
            className={`flex items-center gap-3 px-8 py-4 text-xs font-bold tracking-[0.2em] transition-all relative ${
              activeTab === tab.id 
              ? 'text-[#A62121] bg-white' 
              : 'text-[#2F2F2F]/40 hover:text-[#2F2F2F] hover:bg-black/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#A62121]" />
            )}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="bg-white p-8 border border-[#A62121]/30 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-[#2F2F2F] chinese-font">新建{activeTab === 'liuyao' ? '六爻' : '八字'}规则</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">规则名称</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="例如：财爻持世"
                className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">匹配提示语</label>
              <input 
                type="text" 
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="匹配后自动弹出的提示..."
                className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button onClick={() => setIsAdding(false)} className="text-xs font-bold text-[#2F2F2F]/40 hover:text-[#2F2F2F]">取消</button>
            <button onClick={handleAdd} className="bg-[#2F2F2F] text-white px-8 py-2 text-xs font-bold tracking-widest hover:bg-black transition-all">保存规则</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredRules.length > 0 ? filteredRules.map(rule => (
          <div key={rule.id} className={`bg-white p-6 border transition-all flex items-center gap-6 shadow-sm ${rule.enabled ? 'border-[#B37D56]/10' : 'opacity-50 border-[#B37D56]/5'}`}>
            <div className={`p-3 rounded-none border shrink-0 ${rule.enabled ? 'bg-[#A62121]/5 border-[#A62121]/20 text-[#A62121]' : 'bg-[#2F2F2F]/5 border-[#2F2F2F]/10 text-[#2F2F2F]/20'}`}>
              <Shield size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-base font-bold text-[#2F2F2F] chinese-font">{rule.name}</h4>
              <p className="text-xs text-[#2F2F2F]/60 italic leading-relaxed">“{rule.message}”</p>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                className={`transition-colors ${rule.enabled ? 'text-[#8DA399]' : 'text-[#2F2F2F]/20'}`}
              >
                {rule.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
              <button 
                onClick={() => deleteRule(rule.id)}
                className="text-[#A62121]/20 hover:text-[#A62121] transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-[#B37D56]/10">
            <p className="text-xs text-[#2F2F2F]/20 chinese-font italic">该分类下暂无规则</p>
          </div>
        )}
      </div>
      
      <div className="p-8 bg-[#FAF7F2] border border-[#B37D56]/5 text-center">
        <p className="text-[10px] text-[#2F2F2F]/30 chinese-font leading-loose tracking-widest uppercase">
          规则将作用于相应的录入模块。八字规则正在适配智能提取逻辑。
        </p>
      </div>
    </div>
  );
};
