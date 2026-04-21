import { ShieldCheck } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="glass-panel border-x-0 border-b-0 py-16 relative z-10">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Architect.ai
          </div>
          <div className="text-slate-500 text-xs font-mono uppercase tracking-widest">
            © 2024 Architectural Precision Inc.
          </div>
        </div>
        <div className="flex gap-10">
          {['隐私政策', '服务条款', '安全保障', '系统状态'].map((link) => (
            <a key={link} href="#" className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
