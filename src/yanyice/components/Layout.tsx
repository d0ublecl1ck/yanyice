
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Search, 
  Download, 
  Settings, 
  LogOut,
  Plus,
  UserPlus,
  FilePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { GlobalSearch } from './GlobalSearch';
import { ToastContainer } from './ToastContainer';

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  label, 
  active, 
  collapsed, 
  onClick 
}: { 
  to?: string, 
  icon: any, 
  label: string, 
  active: boolean, 
  collapsed: boolean,
  onClick?: () => void 
}) => {
  const content = (
    <div 
      className={`flex items-center px-6 py-4 transition-all duration-300 relative group cursor-pointer ${
        collapsed ? 'justify-center px-0' : 'space-x-4'
      } ${
        active ? 'text-[#A62121] bg-[#A62121]/5' : 'text-[#2F2F2F] opacity-60 hover:opacity-100 hover:bg-black/5'
      }`}
      title={collapsed ? label : ''}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {!collapsed && (
        <>
          <span className={`text-[15px] whitespace-nowrap overflow-hidden transition-all duration-300 ${active ? 'font-bold' : 'font-medium'} chinese-font`}>
            {label}
          </span>
          {active && (
            <div className="absolute left-0 w-[3px] h-full bg-[#A62121]" />
          )}
          {!to && (
            <span className="absolute right-4 text-[9px] opacity-20 group-hover:opacity-40 font-bold uppercase tracking-tighter transition-opacity">Cmd K</span>
          )}
        </>
      )}
      {collapsed && active && (
        <div className="absolute left-0 w-[4px] h-8 top-1/2 -translate-y-1/2 bg-[#A62121]" />
      )}
    </div>
  );

  if (to) {
    return <Link to={to} onClick={onClick}>{content}</Link>;
  }
  return <div onClick={onClick}>{content}</div>;
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <ToastContainer />
      {/* Sidebar */}
      <aside 
        className={`bg-[#FAF7F2] border-r border-[#B37D56]/20 flex flex-col shrink-0 z-10 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-8 flex flex-col items-center relative ${isSidebarCollapsed ? 'p-6' : 'p-10'}`}>
          <div 
            onClick={toggleSidebar}
            className="absolute -right-3 top-10 w-6 h-6 bg-[#FAF7F2] border border-[#B37D56]/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#A62121] hover:text-white transition-all shadow-sm z-20 group"
          >
            {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </div>

          <div className="w-10 h-10 border border-[#A62121] flex items-center justify-center rotate-45 mb-4 group hover:bg-[#A62121] transition-all cursor-pointer rounded-none">
            <BookOpen className="text-[#A62121] group-hover:text-white -rotate-45" size={16} />
          </div>
          
          {!isSidebarCollapsed && (
            <>
              <h1 className="text-xl font-bold tracking-[0.2em] text-[#2F2F2F] chinese-font whitespace-nowrap animate-in fade-in duration-500">研易册</h1>
              <div className="w-8 h-[0.5px] bg-[#B37D56]/40 mt-3" />
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <SidebarItem to="/" icon={Home} label="首页" active={location.pathname === '/'} collapsed={isSidebarCollapsed} />
          <SidebarItem to="/customers" icon={Users} label="客户管理" active={location.pathname.startsWith('/customers')} collapsed={isSidebarCollapsed} />
          <SidebarItem to="/cases" icon={BookOpen} label="咨询记录" active={location.pathname.startsWith('/cases')} collapsed={isSidebarCollapsed} />
          <SidebarItem to="/rules" icon={ShieldCheck} label="规则系统" active={location.pathname.startsWith('/rules')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={Search} label="全局搜索" active={isSearchOpen} collapsed={isSidebarCollapsed} onClick={() => setIsSearchOpen(true)} />
          <SidebarItem to="/export" icon={Download} label="数据备份" active={location.pathname === '/export'} collapsed={isSidebarCollapsed} />
        </nav>

        <div className={`mt-auto p-4 border-t border-[#B37D56]/10 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <Link 
            to="/settings" 
            className={`flex items-center px-4 py-2 text-sm text-[#2F2F2F] opacity-60 hover:opacity-100 transition-opacity chinese-font ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3'}`}
            title={isSidebarCollapsed ? "个人设置" : ""}
          >
            <Settings size={16} />
            {!isSidebarCollapsed && <span>个人设置</span>}
          </Link>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-2 mt-2 text-sm text-[#A62121]/70 hover:text-[#A62121] transition-colors chinese-font ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3'}`}
            title={isSidebarCollapsed ? "退出登录" : ""}
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>退出登录</span>}
          </button>
          
          {!isSidebarCollapsed ? (
            <div className="mt-6 px-4 py-3 bg-white/40 border border-[#B37D56]/10 rounded-none animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] text-[#B37D56] uppercase tracking-widest font-bold">当前账号</p>
              <p className="text-sm font-bold text-[#2F2F2F] truncate chinese-font">{user?.username}</p>
            </div>
          ) : (
            <div className="mt-4 flex justify-center">
              <div className="w-8 h-8 bg-[#2F2F2F] text-[#FAF7F2] flex items-center justify-center text-xs font-bold chinese-font rounded-none">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#FAF7F2] transition-all duration-300">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#8DA399]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto p-12 min-h-full pb-32">
          {children}
        </div>
        
        {/* Floating Action Menu */}
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4" ref={fabRef}>
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <Link 
                to="/customers/new" 
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 bg-white border border-[#B37D56]/20 px-4 py-3 shadow-lg hover:border-[#A62121] transition-all group rounded-none"
              >
                <span className="text-xs font-bold text-[#2F2F2F] chinese-font tracking-widest group-hover:text-[#A62121]">登记新客户</span>
                <div className="w-10 h-10 bg-[#8DA399]/10 text-[#8DA399] flex items-center justify-center rounded-none group-hover:bg-[#8DA399] group-hover:text-white transition-all">
                  <UserPlus size={18} />
                </div>
              </Link>
              <Link 
                to="/cases/new" 
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 bg-white border border-[#B37D56]/20 px-4 py-3 shadow-lg hover:border-[#A62121] transition-all group rounded-none"
              >
                <span className="text-xs font-bold text-[#2F2F2F] chinese-font tracking-widest group-hover:text-[#A62121]">录入新咨询</span>
                <div className="w-10 h-10 bg-[#A62121]/10 text-[#A62121] flex items-center justify-center rounded-none group-hover:bg-[#A62121] group-hover:text-white transition-all">
                  <FilePlus size={18} />
                </div>
              </Link>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 bg-[#A62121] text-white flex items-center justify-center transition-all active:scale-95 shadow-[0_4px_12px_rgba(166,33,33,0.2)] rounded-[2px] ${isFabOpen ? 'rotate-45' : ''}`}
          >
            <Plus size={28} />
            <div className="absolute inset-1 border border-white/20 pointer-events-none rounded-[1px]" />
          </button>
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
