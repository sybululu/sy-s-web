import { useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';

interface MarketingNavbarProps {
  onGetStarted: () => void;
  currentPage: 'landing' | 'pricing';
  onPageChange: (page: 'landing' | 'pricing') => void;
}

export default function MarketingNavbar({ onGetStarted, currentPage, onPageChange }: MarketingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center px-6 py-3 justify-between glass-panel rounded-full w-[90%] max-w-5xl transition-all">
      <button 
        onClick={() => onPageChange('landing')}
        className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 bg-transparent border-none cursor-pointer"
      >
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
        Architect.ai
      </button>
      <div className="hidden md:flex items-center gap-8">
        <button 
          onClick={() => onPageChange('landing')}
          className={`text-sm font-medium bg-transparent border-none cursor-pointer transition-colors ${currentPage === 'landing' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
        >
          产品平台
        </button>
        <a className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">客户案例</a>
        <button 
          onClick={() => onPageChange('pricing')}
          className={`text-sm font-medium bg-transparent border-none cursor-pointer transition-colors ${currentPage === 'pricing' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
        >
          价格方案
        </button>
        <a className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">更新日志</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer">
          <Search className="w-5 h-5" />
        </button>
        <button 
          onClick={onGetStarted}
          className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          开始构建
        </button>
      </div>
    </nav>
  );
}
