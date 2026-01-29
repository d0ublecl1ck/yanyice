"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen,
  Search, 
  Download, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  UserPlus,
  FilePlus,
  type LucideIcon
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { GlobalSearch } from './GlobalSearch';
import { ToastContainer } from './ToastContainer';
import { coerceModuleType } from '@/lib/moduleParam';

type SidebarIconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

const makeSidebarImageIcon = (src: string): SidebarIconComponent => {
  const SidebarImageIcon: SidebarIconComponent = ({ size = 18, className }) => (
    <Image src={src} width={size} height={size} alt="" aria-hidden className={className} />
  );
  SidebarImageIcon.displayName = `SidebarImageIcon(${src})`;
  (SidebarImageIcon as { __isSidebarImageIcon?: true }).__isSidebarImageIcon = true;
  return SidebarImageIcon;
};

const BaziCasesIcon = makeSidebarImageIcon('/icons/sidebar/bazi-cases.svg');
const BaziRulesIcon = makeSidebarImageIcon('/icons/sidebar/bazi-rules.svg');
const LiuyaoExamplesIcon = makeSidebarImageIcon('/icons/sidebar/liuyao-examples.svg');
const LiuyaoRulesIcon = makeSidebarImageIcon('/icons/sidebar/liuyao-rules.svg');

const SidebarItem = ({ 
  href, 
  icon: Icon, 
  label, 
  active, 
  collapsed, 
  onClick
}: { 
  href?: string, 
  icon: LucideIcon | SidebarIconComponent, 
  label: string, 
  active: boolean, 
  collapsed: boolean,
  onClick?: () => void
}) => {
  const isSidebarImageIcon = (Icon as { __isSidebarImageIcon?: true }).__isSidebarImageIcon === true;
  const iconClassName = isSidebarImageIcon
    ? `shrink-0 ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`
    : 'shrink-0';

  const content = (
    <div 
      className={`flex items-center px-6 py-4 transition-all duration-300 relative group cursor-pointer select-none ${
        collapsed ? 'justify-center px-0' : 'space-x-4'
      } ${
        active ? 'text-[#2F2F2F] bg-black/5' : 'text-[#2F2F2F]/60 hover:text-[#2F2F2F] hover:bg-black/5'
      }`}
      title={collapsed ? label : ''}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={iconClassName} />
      {!collapsed && (
        <>
          <span className={`text-[15px] whitespace-nowrap overflow-hidden transition-all duration-300 chinese-font ${active ? 'font-bold' : 'font-medium'}`}>
            {label}
          </span>
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return <div onClick={onClick}>{content}</div>;
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const rulesModule = (() => {
    if (pathname !== '/rules') return null;
    return coerceModuleType(searchParams.get('module')) ?? 'liuyao';
  })();

  const isBaziRulesActive = pathname === '/bazi/rules' || (pathname === '/rules' && rulesModule === 'bazi');
  const isLiuyaoRulesActive = pathname === '/liuyao/rules' || (pathname === '/rules' && rulesModule === 'liuyao');

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
      <aside 
        className={`bg-[#FAF7F2] border-r border-[#B37D56]/20 flex flex-col shrink-0 z-10 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex flex-col items-center relative ${isSidebarCollapsed ? 'p-6' : 'p-10'}`}>
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
              <h1 className="text-lg font-bold tracking-[0.3em] text-[#2F2F2F] chinese-font whitespace-nowrap animate-in fade-in duration-500">
                研易册
              </h1>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <SidebarItem href="/" icon={Home} label="首页工作台" active={pathname === '/'} collapsed={isSidebarCollapsed} />
          <SidebarItem href="/customers" icon={Users} label="客户档案" active={pathname.startsWith('/customers')} collapsed={isSidebarCollapsed} />
          
          <div className="mt-3 px-6 mb-1">
            {!isSidebarCollapsed && <p className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest opacity-40">Bazi Module</p>}
            {isSidebarCollapsed && <div className="h-[1px] bg-[#B37D56]/10 w-full" />}
          </div>
          <SidebarItem
            href="/bazi"
            icon={BaziCasesIcon}
            label="八字案卷"
            active={
              pathname === "/bazi" ||
              pathname.startsWith("/bazi/edit") ||
              pathname.startsWith("/bazi/new") ||
              pathname.startsWith("/bazi/analysis")
            }
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            href="/bazi/rules"
            icon={BaziRulesIcon}
            label="八字断诀"
            active={isBaziRulesActive}
            collapsed={isSidebarCollapsed}
          />

          <div className="mt-3 px-6 mb-1">
            {!isSidebarCollapsed && <p className="text-[10px] font-bold text-[#A62121] uppercase tracking-widest opacity-40">Liuyao Module</p>}
            {isSidebarCollapsed && <div className="h-[1px] bg-[#A62121]/10 w-full" />}
          </div>
          <SidebarItem
            href="/liuyao"
            icon={LiuyaoExamplesIcon}
            label="六爻卦例"
            active={
              pathname === "/liuyao" ||
              pathname.startsWith("/liuyao/edit") ||
              pathname.startsWith("/liuyao/new") ||
              pathname.startsWith("/liuyao/analysis")
            }
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            href="/liuyao/rules"
            icon={LiuyaoRulesIcon}
            label="六爻断诀"
            active={isLiuyaoRulesActive}
            collapsed={isSidebarCollapsed}
          />

          <div className="mt-3">
            <SidebarItem
              icon={Search}
              label="全局搜索 (Ctrl+K)"
              active={isSearchOpen}
              collapsed={isSidebarCollapsed}
              onClick={() => setIsSearchOpen(true)}
            />
            <SidebarItem href="/export" icon={Download} label="数据同步" active={pathname === '/export'} collapsed={isSidebarCollapsed} />
            <SidebarItem href="/settings" icon={Settings} label="个人设置" active={pathname === '/settings'} collapsed={isSidebarCollapsed} />
          </div>
        </nav>

      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#FAF7F2] transition-all duration-300">
        <div className="max-w-[90vw] mx-auto p-12 min-h-full pb-32 relative z-0">
          {children}
        </div>
        
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4" ref={fabRef}>
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <Link 
                href="/customers/new" 
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 bg-white border border-[#B37D56]/20 px-4 py-3 shadow-lg hover:border-[#A62121] transition-all group rounded-none"
              >
                <span className="text-xs font-bold text-[#2F2F2F] chinese-font tracking-widest group-hover:text-[#A62121]">登记客户</span>
                <div className="w-10 h-10 bg-[#8DA399]/10 text-[#8DA399] flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
              </Link>
              <Link 
                href="/bazi/new" 
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 bg-white border border-[#B37D56]/20 px-4 py-3 shadow-lg hover:border-[#A62121] transition-all group rounded-none"
              >
                <span className="text-xs font-bold text-[#2F2F2F] chinese-font tracking-widest group-hover:text-[#A62121]">排盘八字</span>
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                  <FilePlus size={18} />
                </div>
              </Link>
              <Link 
                href="/liuyao/new"
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 bg-white border border-[#B37D56]/20 px-4 py-3 shadow-lg hover:border-[#A62121] transition-all group rounded-none"
              >
                <span className="text-xs font-bold text-[#2F2F2F] chinese-font tracking-widest group-hover:text-[#A62121]">起卦六爻</span>
                <div className="w-10 h-10 bg-[#A62121] text-white flex items-center justify-center">
                  <Plus size={18} />
                </div>
              </Link>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 bg-[#A62121] text-white flex items-center justify-center transition-all active:scale-95 shadow-xl rounded-sm ${isFabOpen ? 'rotate-45' : ''}`}
          >
            <Plus size={28} />
          </button>
        </div>
      </main>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
