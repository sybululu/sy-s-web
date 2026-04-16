import { ShieldCheck, LayoutDashboard, PlusSquare, Gavel, History, LogOut } from 'lucide-react';
import { ViewType, User } from '../types';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  currentUser?: User | null;
}

export default function Sidebar({ currentView, onViewChange, onLogout, currentUser }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: '总览仪表盘', icon: LayoutDashboard },
    { id: 'new-task', label: '新建审查任务', icon: PlusSquare },
    { id: 'details', label: '违规条款明细', icon: Gavel },
    { id: 'history', label: '历史审查报告', icon: History },
  ];

  // 获取用户显示名称
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || '用户';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-64 glass-panel flex flex-col h-screen py-6 px-4 shrink-0 border-r border-white/50 z-10"
    >
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xl font-serif text-ink tracking-tight">智审合规</div>
        </div>
        <div className="text-ink-muted text-xs font-medium mt-1">NLP 隐私政策审查</div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm relative ${
                isActive
                  ? 'bg-white/60 text-ink font-medium shadow-sm border border-white/60'
                  : 'text-ink-muted hover:bg-white/40 hover:text-ink border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-ink rounded-r-full" 
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-ink' : 'text-ink-muted'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 px-4 border-t border-white/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-ink font-medium text-xs border border-white/60 shadow-sm">
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{displayName}</div>
            <div className="text-[10px] text-ink-muted">合规审计员</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-ink-muted hover:text-ink hover:bg-white/40 transition-colors text-sm font-medium border border-transparent"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </motion.aside>
  );
}
