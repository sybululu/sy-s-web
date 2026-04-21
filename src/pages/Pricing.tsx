import { motion } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="container mx-auto px-6 max-w-[1400px]">
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

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 w-full mx-auto items-stretch">
          
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg rounded-3xl p-8 xl:p-10 flex flex-col relative z-0"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">基础探索版</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">降低门槛，适合个人体验 AI 效果与基础自查。</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-slate-900">¥0</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow font-medium text-slate-600 text-sm">
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />3 次/天合规扫描 (极速响应)</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />单次最高支持 2,000 字纯文本</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />完整的违规检测和基础评分</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />展示前 5 条违规详情 (后续屏蔽)</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />赠送 1 次 AI 条文重写体验</li>
              <li className="flex gap-3 items-start text-slate-400"><XCircle className="w-5 h-5 shrink-0 mt-0.5" />不支持文件上传与 URL 抓取</li>
              <li className="flex gap-3 items-start text-slate-400"><XCircle className="w-5 h-5 shrink-0 mt-0.5" />带水印不可导出报告</li>
            </ul>
            <button className="w-full py-4 rounded-full border border-slate-300 text-slate-800 font-bold text-center hover:bg-slate-100 transition-colors">
              免费体验
            </button>
          </motion.div>

          {/* Pro Tier (Highlighted) */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.3 }}
            className="bg-white/95 backdrop-blur-xl shadow-2xl shadow-indigo-900/5 rounded-3xl p-8 xl:p-10 flex flex-col relative z-10 xl:-mt-4 xl:mb-4 border-2 border-indigo-500/20"
          >
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-indigo-600 text-white text-[14px] font-bold py-1.5 px-4 rounded-full border-2 border-white shadow-lg">
                推荐方案
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">专业合规版</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">法务团队与中小企业首选，≈ 半个实习生薪资。</p>
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-2xl font-medium text-slate-500">¥</span>
              <span className="text-5xl font-extrabold text-slate-900">499</span>
              <span className="text-slate-500 font-medium">/月</span>
            </div>
            <div className="mb-6 text-sm text-indigo-600 font-medium bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100">
              年付 ¥4,999 (省17%)
            </div>
            <ul className="space-y-4 mb-10 flex-grow font-medium text-slate-700 text-sm">
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />50 次/天高频合规扫描</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />单次长度飙升至 20,000 字</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />全面解锁 URL 抓取与 PDF/Word 上传</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />包含 20次/天 本地大模型整改生成</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />历史版本对比支持 (最近 5 版)</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />无限制导出完整 PDF & Word 报告</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />支持最高 5 人小团队协作及账号管理</li>
            </ul>
            <button className="w-full py-4 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-transform shadow-[0_8px_20px_rgba(79,70,229,0.2)]">
              升级专业版
            </button>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg rounded-3xl p-8 xl:p-10 flex flex-col relative z-0"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">企业 API 版</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">面向大厂与上市公司的核心业务流极速引擎。</p>
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-2xl font-medium text-slate-500">¥</span>
              <span className="text-5xl font-extrabold text-slate-900">1,999</span>
              <span className="text-slate-500 font-medium">/月</span>
            </div>
            <div className="mb-6 text-sm text-slate-500 font-medium">
              年付 ¥19,999 (省17%)
            </div>
            <ul className="space-y-4 mb-10 flex-grow font-medium text-slate-600 text-sm">
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />无限制扫描与全文本大模型重写</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />单次长度支持最高极限 100,000 字</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />无限制历史版本对比与留痕溯源</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />每周定时扫描指定官网协议更新并告警</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />无限席位组织架构管理</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />开放 FastAPI 调用 (导出/自动化集成)</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />7×24 极速工作流专属客服联络</li>
            </ul>
            <button className="w-full py-4 rounded-full border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 transition-colors">
              立即升级
            </button>
          </motion.div>

          {/* Gov Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.5 }}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg rounded-3xl p-8 xl:p-10 flex flex-col relative z-0"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">政企信创版</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">专为政府单位与央国企打造，符合国家信创安全规范。</p>
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-2xl font-medium text-slate-500">¥</span>
              <span className="text-5xl font-extrabold text-slate-900">定制</span>
            </div>
            <div className="mb-6 text-sm text-slate-600 font-medium tracking-wide">
              100% 内网物理私有化部署
            </div>
            <ul className="space-y-4 mb-10 flex-grow font-medium text-slate-600 text-sm">
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />全面适配鲲鹏、海光等信创硬件架构</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />内置国密加密环境，防篡改与数据投毒</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />政府红头公文等涉密文本专属独立智库</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />支持政务云深信服 VPN/OA 等安全对接</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />军政企最高级别万字文献并发解析</li>
              <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />原厂红蓝对抗安全测试与私有驻场支撑</li>
            </ul>
            <button className="w-full py-4 rounded-full border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 transition-colors">
              获取政企方案
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
