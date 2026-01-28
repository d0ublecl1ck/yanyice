import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Shield, Info, User, LogOut } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">个人设置</h2>
        <p className="text-slate-500 mt-1 chinese-font">管理您的账号安全与 AI 配置</p>
      </header>

      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="p-2 bg-[#A62121]/5 text-[#A62121] rounded-none border border-[#A62121]/10">
              <User size={20} />
            </div>
            <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">账号信息</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#FAF7F2] border border-[#B37D56]/5">
            <div>
              <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1">当前登录账号</p>
              <p className="font-bold text-[#2F2F2F] text-lg chinese-font">{user?.username}</p>
            </div>
            <div className="w-10 h-10 bg-[#2F2F2F] text-white flex items-center justify-center font-bold text-xl chinese-font">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </section>

        {/* AI & Privacy Section */}
        <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#B37D56]/10 pb-4">
            <div className="p-2 bg-[#8DA399]/10 text-[#8DA399] rounded-none border border-[#8DA399]/20">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-lg text-[#2F2F2F] chinese-font">隐私与安全</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-4 rounded-none border border-[#B37D56]/5 flex items-start gap-3 mb-4">
              <Info className="text-indigo-600 shrink-0" size={18} />
              <div className="text-xs text-[#2F2F2F]/60">
                <p className="font-bold mb-1 text-[#2F2F2F]">AI 助手状态</p>
                <p>当前 AI 助手已通过全局环境配置。图片识别与文本提取功能已就绪。</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">云同步加密 (开发中)</p>
                <p className="text-xs text-[#2F2F2F]/40">所有命例数据将通过您的主密码进行端到端加密。</p>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-none relative cursor-not-allowed opacity-50">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white shadow-sm"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FAF7F2]/50 border border-[#B37D56]/5">
              <div>
                <p className="font-bold text-[#2F2F2F] chinese-font">发送 AI 确认</p>
                <p className="text-xs text-[#2F2F2F]/40">在将文本/图片发送给 Google 之前始终弹出确认提示。</p>
              </div>
              <div className="w-12 h-6 bg-[#A62121]/60 rounded-none relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white shadow-sm"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-[#A62121]/20 text-[#A62121] font-bold tracking-[0.4em] hover:bg-[#A62121] hover:text-white transition-all chinese-font"
          >
            <LogOut size={18} />
            退出当前账号
          </button>
          <p className="text-center text-[10px] text-[#2F2F2F]/20 mt-4 uppercase tracking-[0.2em]">
            Yan Yi Ce - Professional Astrology Workspace
          </p>
        </section>
      </div>
    </div>
  );
};

