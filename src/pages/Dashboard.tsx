import { motion } from 'motion/react';
import { ShieldCheck, UploadCloud, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold text-slate-900 font-geist">工作台</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">免费版 (剩余 3 次)</span>
            <Link to="/pricing" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">升级专业版</Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 glass-panel rounded-[2rem] p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">上传隐私政策文件或粘贴 URL</h3>
            <p className="text-slate-500 mb-8">支持 PDF, DOC, TXT 格式上传，或直接输入应用官网网页地址</p>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors">
              选择文件或开始抓取
            </button>
          </motion.div>

          {/* Recent Scans */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-[2rem] p-8"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6">最近审查</h3>
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
              <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm">暂无审查记录</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
