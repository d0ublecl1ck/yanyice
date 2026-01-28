
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User as UserIcon, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      login(username);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-none border border-[#B37D56]/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        {/* Left Side */}
        <div className="bg-[#2F2F2F] p-12 text-[#FAF7F2] flex flex-col justify-center items-center relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 border border-[#FAF7F2]/30 flex items-center justify-center rotate-45 mx-auto mb-10 rounded-none">
              <BookOpen size={32} className="-rotate-45" />
            </div>
            <h1 className="text-4xl font-bold chinese-font tracking-[0.4em] mb-4">研易册</h1>
            <p className="text-sm opacity-60 chinese-font tracking-widest uppercase">专业命理案例管理工作台</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-12 md:p-16 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-[#2F2F2F] mb-8 chinese-font">{isRegister ? '注册账号' : '用户登录'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-[#B37D56] uppercase tracking-widest">用户名</label>
              <div className="relative border-b border-[#2F2F2F]/10 group-focus-within:border-[#A62121] transition-colors">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-3 bg-transparent text-[#2F2F2F] outline-none placeholder:text-[#2F2F2F]/20 rounded-none"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-xs font-bold text-[#B37D56] uppercase tracking-widest">密码</label>
              <div className="relative border-b border-[#2F2F2F]/10 group-focus-within:border-[#A62121] transition-colors">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 bg-transparent text-[#2F2F2F] outline-none placeholder:text-[#2F2F2F]/20 rounded-none"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#A62121] text-white py-4 font-bold tracking-widest hover:bg-[#8B1A1A] transition-colors rounded-[2px] chinese-font"
            >
              {isRegister ? '立即注册' : '立即登录'}
            </button>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-[#2F2F2F]/40 hover:text-[#A62121] transition-colors chinese-font"
              >
                {isRegister ? '已有账号？去登录' : '没有账号？点击注册'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
