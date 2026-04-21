import { motion, useScroll, useTransform } from 'motion/react';
import { 
  ShieldCheck, 
  Globe, 
  Database, 
  Lightbulb, 
  UploadCloud, 
  BrainCircuit, 
  FileText, 
  CheckCircle2,
  Star
} from 'lucide-react';

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: false, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 70, damping: 20, mass: 1, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* Liquid Background Blobs */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/30 blur-[120px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-200/30 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-purple-200/30 blur-[140px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex justify-center overflow-hidden bg-white">
        
        {/* Background Video */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover [transform:scaleY(-1)]"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4" type="video/mp4"/>
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-[rgba(255,255,255,0)] to-[66.943%] to-white pointer-events-none"></div>
        </div>
        
        {/* Main Content Container */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-[1200px] pt-[290px] px-6 flex flex-col items-center gap-[32px]"
        >
          
          <motion.h1 
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.1 }}
            className="font-geist font-medium tracking-[-0.04em] text-5xl md:text-[80px] leading-[1.1] text-center text-slate-900"
          >
            Intelligent <span className="font-serif italic text-6xl md:text-[100px] font-normal text-indigo-600">compliance</span><br />
            for your privacy policies
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.2 }}
            className="font-geist text-[18px] text-[#373a46] opacity-80 max-w-[554px] text-center"
          >
            Architect.ai 结合最先进的 AI 深度神经网络与法律专家经验，为企业提供毫秒级的全方位隐私风险监测与整改建议。
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.3 }}
            className="flex flex-col items-center gap-6 w-full max-w-md mt-4"
          >
            <div className="flex items-center w-full bg-[#fcfcfc] rounded-[40px] border border-gray-200/80 p-1.5 shadow-[0px_10px_40px_5px_rgba(194,194,194,0.25)]">
              <input 
                type="email" 
                placeholder="输入您的工作邮箱" 
                className="flex-1 bg-transparent border-none focus:ring-0 px-6 text-slate-700 font-geist outline-none"
              />
              <button
                onClick={onGetStarted}
                className="bg-slate-900 text-white rounded-full px-8 py-3.5 font-medium text-sm shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] whitespace-nowrap transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                免费试用
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm font-geist text-slate-500">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i + 10}/32/32`} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span className="font-medium text-slate-700 ml-1">1,020+ 企业信任</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl space-y-40">
          
          {/* Feature 1 */}
          <ScrollReveal className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 text-indigo-600">
                <span className="w-8 h-[1px] bg-indigo-600/50"></span>
                <span className="text-xs font-bold tracking-widest uppercase font-mono">Detection Engine</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                12类违规检测
              </h2>
              <p className="text-slate-600 text-xl leading-relaxed">
                不仅是关键词匹配。利用深度学习语义分析，精准识别非法收集、超范围索权、账号注销困难等 12 大类、200+ 细分隐私违规项。
              </p>
              <ul className="space-y-5">
                {[
                  '全自动静态与动态行为抓取',
                  '覆盖出境合规与权限滥用检测',
                  '毫秒级响应，支持 CI/CD 集成'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-800 font-medium text-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[2.5rem] glass-panel p-8 relative overflow-hidden flex items-center justify-center">
                 <motion.svg 
                    viewBox="0 0 200 200" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="absolute w-[120%] h-[120%] opacity-20 text-indigo-600"
                  >
                    <motion.path
                      fill="currentColor"
                      animate={{
                        d: [
                          "M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.9,-18.1,95.8,-3.2C94.7,11.7,86.4,26.1,76.5,38.8C66.6,51.5,55.1,62.5,41.8,70.5C28.5,78.5,13.4,83.5,-1.3,85.8C-16,88.1,-32,87.7,-45.4,79.8C-58.8,71.9,-69.6,56.5,-77.8,40.4C-86,24.3,-91.6,7.5,-89.6,-8.4C-87.6,-24.3,-78,-39.3,-65.9,-50.6C-53.8,-61.9,-39.2,-69.5,-24.9,-73.9C-10.6,-78.3,3.4,-79.5,17.7,-78.9C32,-78.3,44.7,-76.4,44.7,-76.4Z",
                          "M51.5,-74.5C65.5,-65.5,74.8,-49.6,81.1,-32.8C87.4,-16,90.7,1.7,86.5,17.6C82.3,33.5,70.6,47.6,56.8,58.3C43,69,27.1,76.3,10.6,79.5C-5.9,82.7,-23,81.8,-38.2,74.4C-53.4,67,-66.7,53.1,-75.4,37.1C-84.1,21.1,-88.2,3,-85.1,-13.7C-82,-30.4,-71.7,-45.7,-58.5,-56.3C-45.3,-66.9,-29.2,-72.8,-13.3,-75.4C2.6,-78,18.5,-77.3,34.1,-74.5C49.7,-71.7,51.5,-74.5,51.5,-74.5Z",
                          "M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.9,-18.1,95.8,-3.2C94.7,11.7,86.4,26.1,76.5,38.8C66.6,51.5,55.1,62.5,41.8,70.5C28.5,78.5,13.4,83.5,-1.3,85.8C-16,88.1,-32,87.7,-45.4,79.8C-58.8,71.9,-69.6,56.5,-77.8,40.4C-86,24.3,-91.6,7.5,-89.6,-8.4C-87.6,-24.3,-78,-39.3,-65.9,-50.6C-53.8,-61.9,-39.2,-69.5,-24.9,-73.9C-10.6,-78.3,3.4,-79.5,17.7,-78.9C32,-78.3,44.7,-76.4,44.7,-76.4Z"
                        ]
                      }}
                      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                 </motion.svg>
                 
                 <div className="relative h-full w-full flex flex-col justify-center gap-4 z-10">
                    <motion.div 
                      className="glass-panel p-5 rounded-2xl flex items-center justify-between"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600"><ShieldCheck className="w-6 h-6"/></div>
                        <div>
                          <div className="text-base font-semibold text-slate-900">超范围索权</div>
                          <div className="text-xs text-slate-500 font-mono mt-1">MainActivity.java</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-red-600 bg-red-500/10 px-3 py-1.5 rounded-lg font-semibold">High Risk</span>
                    </motion.div>
                    
                    <motion.div 
                      className="glass-panel p-5 rounded-2xl flex items-center justify-between opacity-90"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600"><Database className="w-6 h-6"/></div>
                        <div>
                          <div className="text-base font-semibold text-slate-900">数据未加密传输</div>
                          <div className="text-xs text-slate-500 font-mono mt-1">NetworkClient.kt</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-lg font-semibold">Medium</span>
                    </motion.div>
                 </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Feature 2 */}
          <ScrollReveal className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 grid grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-panel p-8 rounded-[2rem] space-y-6 md:translate-y-12"
              >
                <div className="w-14 h-14 bg-indigo-600/5 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">全球法规同步</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">支持中国《个人信息保护法》、GDPR、CCPA 等全球主流隐私法规。</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-panel p-8 rounded-[2rem] space-y-6"
              >
                <div className="w-14 h-14 bg-indigo-600/5 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Database className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">专家级 RAG</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">基于 CAPP-130 论文与向量数据库的法律检索，提供具备法理依据的检测判词。</p>
              </motion.div>
            </div>
            <div className="order-1 md:order-2 space-y-8">
              <div className="inline-flex items-center gap-3 text-indigo-600">
                <span className="w-8 h-[1px] bg-indigo-600/50"></span>
                <span className="text-xs font-bold tracking-widest uppercase font-mono">Intelligence Base</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                RAG 法律知识库
              </h2>
              <p className="text-slate-600 text-xl leading-relaxed">
                内置千万级隐私法律文书与行政处罚案例。通过 Retrieval-Augmented Generation 技术，为每一个检测项提供精准的法律溯源与解读。
              </p>
              <blockquote className="p-8 glass-panel rounded-3xl border-l-4 border-l-indigo-600 text-slate-700 italic font-serif text-2xl">
                "AI 不再是黑盒，每一处违规建议皆有法可依。"
              </blockquote>
            </div>
          </ScrollReveal>

          {/* Feature 3 - Code Fixes */}
          <ScrollReveal className="glass-panel-dark rounded-[3rem] p-10 md:p-16 overflow-hidden relative text-white">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Lightbulb className="w-64 h-64" />
            </div>
            <div className="grid md:grid-cols-12 gap-16 relative z-10 items-center">
              <div className="col-span-12 md:col-span-5 space-y-8">
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight">AI 整改建议</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  自动生成针对开发者的代码级修复方案。无需法律背景，一键理解合规要求并完成技术整改。
                </p>
                
                <div className="pt-8 w-full">
                  <div className="flex justify-between mb-4 items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">当前合规评分</span>
                    <span className="text-5xl font-bold text-white tracking-tight">98.5<span className="text-xl text-slate-500 ml-1">%</span></span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div 
                      className="h-full bg-indigo-500 rounded-full relative"
                      initial={{ width: 0 }}
                      whileInView={{ width: '98.5%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                       <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-7 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-900/80 px-5 py-4 border-b border-slate-800/80 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-3 tracking-wider">App.kt</span>
                </div>
                <div className="p-8 overflow-x-auto font-mono text-sm leading-relaxed">
                  <div className="text-slate-500 mb-3">// ❌ 违规：未判断用户同意即获取设备ID</div>
                  <div className="text-rose-400 bg-rose-500/10 px-3 py-1 -mx-3 mb-5 line-through opacity-80 border-l-2 border-rose-500/50">
                    val deviceId = TelephonyManager.getDeviceId()
                  </div>
                  <div className="text-slate-500 mb-3">// ✅ 修复：添加同意状态前置判断</div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-3 py-1 -mx-3 border-l-2 border-emerald-500/50">
                    if (PrivacyManager.hasUserConsented()) {'{'}
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-3 py-1 -mx-3 pl-8 border-l-2 border-emerald-500/50">
                    val deviceId = TelephonyManager.getDeviceId()
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-3 py-1 -mx-3 border-l-2 border-emerald-500/50">
                    {'}'} else {'{'}
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-3 py-1 -mx-3 pl-8 text-slate-400 border-l-2 border-emerald-500/50">
                    // 处理未授权逻辑
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-3 py-1 -mx-3 border-l-2 border-emerald-500/50">
                    {'}'}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* Step Guide */}
      <section className="py-32 relative z-10">
        <ScrollReveal className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-24">
            <span className="inline-block uppercase tracking-widest text-indigo-600 mb-4 text-xs font-bold font-mono">Workflow</span>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">如何开始</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-[2px] z-0">
               <svg width="100%" height="100%" preserveAspectRatio="none">
                  <motion.line 
                    x1="0" y1="0" x2="100%" y2="0" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeDasharray="8 8"
                    className="text-indigo-200"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
               </svg>
            </div>

            {[
              { icon: UploadCloud, title: '上传应用包', desc: '支持 APK, IPA, SDK 以及小程序源码包的直接上传，秒级识别。' },
              { icon: BrainCircuit, title: 'AI 深度分析', desc: '系统自动启动沙盒模拟运行，并结合 RAG 法律大模型进行多维比对。' },
              { icon: FileText, title: '获取合规报告', desc: '一键下载全方位的合规审查报告与修复建议，助您从容面对监管。' }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10 glass-panel p-12 rounded-[3rem] flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-white flex items-center justify-center text-indigo-600 mb-8">
                  <step.icon className="w-10 h-10" />
                </div>
                <span className="text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4 font-mono">Step 0{i + 1}</span>
                <h3 className="text-3xl font-bold text-slate-900 mb-6">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-10 py-4 font-medium text-lg shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              立即开始使用
            </button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
