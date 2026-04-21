import { motion } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PricingProps {
  onGetStarted: () => void;
}

export default function Pricing({ onGetStarted }: PricingProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 font-geist"
          >
            简单透明的<span className="font-serif italic text-indigo-600 font-normal ml-2">定价方案</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            无论您是独立开发者还是大型企业，都能找到适合您的合规审查方案。
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.02, y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.2 }}
            className="glass-panel p-10 rounded-[2.5rem] flex flex-col h-full"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">免费版</h3>
              <p className="text-slate-500 text-sm">适合个人开发者与小型项目体验</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-bold text-slate-900">¥0</span>
              <span className="text-slate-500 font-medium"> / 月</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>每月 3 次应用审查</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>基础 12 类违规检测</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>RAG 法律依据溯源</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>完整合规报告导出</span>
              </li>
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-center hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              免费开始
            </button>
          </motion.div>

          {/* Pro Tier (Highlighted) */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.02, y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.3 }}
            className="bg-slate-900 text-white p-10 rounded-[2.5rem] flex flex-col h-full relative shadow-2xl md:-translate-y-4 border border-slate-800"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">
                最受欢迎
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">专业版</h3>
              <p className="text-slate-400 text-sm">适合中小型企业与合规团队</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">¥299</span>
              <span className="text-slate-400 font-medium"> / 月</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>每月 50 次应用审查</span>
              </li>
              <li className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>全量违规检测与 AI 修复建议</span>
              </li>
              <li className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>RAG 法律依据溯源 (CAPP-130)</span>
              </li>
              <li className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>完整合规审查报告导出 (PDF/Word)</span>
              </li>
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-500 transition-all shadow-[inset_-4px_-6px_25px_0px_rgba(255,255,255,0.1),inset_4px_4px_10px_0px_rgba(0,0,0,0.2)]"
            >
              立即订阅
            </button>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.02, y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.4 }}
            className="glass-panel p-10 rounded-[2.5rem] flex flex-col h-full"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">企业版</h3>
              <p className="text-slate-500 text-sm">适合大型企业与 CI/CD 深度集成</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-bold text-slate-900">定制</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>不限次数应用审查</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>开发者 API 接入 (CI/CD)</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>私有化部署与专属模型微调</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <span>专属合规专家支持 (SLA)</span>
              </li>
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-center hover:bg-slate-900 hover:text-white transition-all"
            >
              联系销售
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
