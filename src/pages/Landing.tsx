import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Globe, 
  Database, 
  Lightbulb, 
  UploadCloud, 
  BrainCircuit, 
  FileText, 
  CheckCircle2,
  XCircle,
  ArrowDown,
  Share2,
  Clock,
  UserCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollFloat from '../components/ScrollFloat';
import Folder from '../components/Folder';
import Threads from '../components/Threads';
import ColorBends from '../components/ColorBends';
import Stack from '../components/Stack';

function MagneticButton({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

function ScrollUnfold({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -90, y: 50, transformPerspective: 1000, transformOrigin: "top" }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: false, margin: "-20%" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScrollSlide({ children, className = "", direction = "left" }: { children: React.ReactNode, className?: string, direction?: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === "left" ? -150 : 150 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false, margin: "-10%" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScrollFlip({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90, transformPerspective: 1000 }}
      whileInView={{ opacity: 1, rotateY: 0 }}
      viewport={{ once: false, margin: "-20%" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function InteractiveFlipCard({ frontIcon: Icon, frontTitle, frontDesc, backContent, delay = 0, className = "" }: { frontIcon: any, frontTitle: string, frontDesc: string, backContent: React.ReactNode, delay?: number, className?: string }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <ScrollFlip delay={delay} className={`relative h-[340px] cursor-pointer group perspective-[1000px] ${className}`}>
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d] transition-shadow duration-300"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 rounded-[2rem] flex flex-col justify-center space-y-6 hover:from-slate-100/80 hover:to-slate-200/60 transition-colors">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800">
            <Icon className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-xl text-slate-900">{frontTitle}</h3>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{frontDesc}</p>
          <div className="absolute bottom-6 right-6 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <span className="text-xs font-mono font-bold tracking-widest uppercase">Click to flip</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-900 border border-slate-800 shadow-xl p-8 rounded-[2rem] flex flex-col justify-center text-white [transform:rotateY(180deg)]">
          <h3 className="font-bold text-xl mb-4">{frontTitle} - 详情</h3>
          <div className="text-sm text-slate-300 leading-relaxed font-medium">
            {backContent}
          </div>
          <div className="absolute bottom-6 right-6 text-slate-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
            <span className="text-xs font-mono font-bold tracking-widest uppercase">Back</span>
          </div>
        </div>
      </motion.div>
    </ScrollFlip>
  );
}

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

const complianceData = [
  {
    id: 'collection',
    title: '数据收集',
    count: 4,
    icon: Database,
    items: [
      { name: '过度收集敏感数据', desc: '是否收集与服务无关的生物识别、金融账户、医疗健康、未成年人等敏感个人信息', law: '《个人信息保护法》第六条"最小必要"原则' },
      { name: '未说明收集目的', desc: '是否清晰、具体披露每项数据收集的实际用途，是否存在"为未来业务拓展"等模糊表述', law: '《个人信息保护法》第十七条信息披露要求' },
      { name: '未获得明示同意', desc: '是否通过默认勾选、捆绑服务等方式变相强制授权，未以显著方式获取用户明确同意', law: '《个人信息保护法》第十四条明示同意要求' },
      { name: '收集范围超出服务需求', desc: '是否收集与产品/服务核心功能无直接关联的非敏感个人信息', law: '《个人信息保护法》第六条数据收集必要性要求' }
    ]
  },
  {
    id: 'sharing',
    title: '数据共享',
    count: 3,
    icon: Share2,
    items: [
      { name: '未明确第三方共享范围', desc: '是否未披露向第三方共享的个人信息具体类型、数量及使用场景', law: '《个人信息保护法》第二十三条共享信息披露要求' },
      { name: '未获得单独共享授权', desc: '是否在共享用户信息前未取得用户单独同意，仅以整体隐私政策同意替代', law: '《个人信息保护法》第二十三条单独同意要求' },
      { name: '未明确共享数据用途', desc: '是否未向用户告知第三方使用共享数据的具体目的，存在用途模糊/扩大情形', law: '《个人信息保护法》第二十三条' }
    ]
  },
  {
    id: 'retention',
    title: '数据留存',
    count: 2,
    icon: Clock,
    items: [
      { name: '未明确留存期限', desc: '是否未披露数据留存的具体时长，或留存期限与服务目的实现不匹配', law: '《个人信息保护法》第十九条' },
      { name: '未说明数据销毁机制', desc: '是否未明确留存期限届满后，数据销毁/匿名化的具体方式、流程及责任主体', law: '《个人信息保护法》第四十七条数据删除要求' }
    ]
  },
  {
    id: 'rights',
    title: '用户权利保障',
    count: 3,
    icon: UserCheck,
    items: [
      { name: '未明确用户权利范围', desc: '是否未完整告知用户查询、更正、删除、撤回同意、解释说明等法定权利', law: '《个人信息保护法》第四十四条至第四十八条用户权利相关规定' },
      { name: '未提供便捷权利行使途径', desc: '是否未设置在线申请、客服对接等简易渠道，存在繁琐流程阻碍用户行使权利', law: '《个人信息保护法》第五十条权利行使便捷性要求' },
      { name: '未明确权利响应时限', desc: '是否未披露收到用户权利行使申请后，完成处理并反馈结果的具体时限', law: '《个人信息保护法》相关规定' }
    ]
  }
];

const MOCK_CLAUSES = [
  {
    id: "I1",
    name: "过度收集敏感数据",
    original: "本公司可能收集您的位置信息、设备信息、联系人信息等。",
    rewrite: "为实现服务目的，我们仅收集必要信息：位置信息——仅限导航功能使用。您可随时在「设置」中关闭授权，关闭后不会影响核心业务。",
    summaryOutline: "这条条款收集了定位和通讯录，却没有告诉你具体用途，明显范围超标。",
    summaryDetail: [
      { q: "实际在做什么？", a: "像你进店买水，店员却强行抄走了你手机的家庭住址。" },
      { q: "影响？", a: "你的核心敏感隐私被不合理获取，存在泄露风险。" },
      { q: "合规版该长啥样？", a: "必须只针对特定需求说明“收集什么、用在哪”。" }
    ],
    colors: { icon: "text-rose-500", bg: "bg-rose-50/50", border: "border-rose-100" }
  },
  {
    id: "I3",
    name: "未获得明示同意",
    original: "使用本服务或浏览本网站，即表示您无条件同意我们收集并处理上述所有个人信息。",
    rewrite: "在收集您的个人信息前，我们将通过弹窗等显著方式告知您处理目的及范围，并在获取您的明示同意后收集。您有权拒绝提供。",
    summaryOutline: "强行绑定同意，只要用App就视为交出所有隐私，属于典型霸王条款。",
    summaryDetail: [
      { q: "实际在做什么？", a: "你在App啥也没点，系统就默认你全权授权了。" },
      { q: "影响？", a: "完全剥夺了你的知情同意权。" },
      { q: "合规版该长啥样？", a: "必须弹出明确选项，由你本人主动点击“同意”才算数。" }
    ],
    colors: { icon: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-100" }
  },
  {
    id: "I8",
    name: "未明确留存期限",
    original: "我们将长期保存您的服务日志和实名认证数据，以优化产品体验。",
    rewrite: "我们仅在实现服务目的所必需的最短时间内保存您的个人信息。超出法定期限后，我们将依法对数据进行删除或匿名化处理。",
    summaryOutline: "声称“长期保存”却不说存多久，违反了数据最小化保留原则。",
    summaryDetail: [
      { q: "实际在做什么？", a: "注销账号后，他们可能还在服务器存着你的脸和身份证。" },
      { q: "影响？", a: "被黑客攻击时，你的陈年旧账数据就会惨遭泄露。" },
      { q: "合规版该长啥样？", a: "必须说清楚具体留存时间和逾期销毁机制。" }
    ],
    colors: { icon: "text-purple-500", bg: "bg-purple-50/50", border: "border-purple-100" }
  }
];

function DemoClauseCard({ clause }: { clause: typeof MOCK_CLAUSES[0]; key?: string | number }) {
  const [demoMode, setDemoMode] = useState<"summary" | "rewrite">("rewrite");

  return (
    <div className="w-full h-[600px] bg-slate-50/95 backdrop-blur-[40px] border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col pointer-events-auto rounded-[2rem] overflow-hidden">
      {/* Header */}
      <div className="bg-white/40 px-5 py-4 border-b border-white/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-400"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
          </div>
          <span className="text-xs font-mono text-slate-500 ml-3 tracking-wider hidden sm:inline-block">条款整改视图</span>
        </div>
        <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setDemoMode("summary")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all duration-300 ${demoMode === "summary" ? "bg-slate-800 text-white shadow-md shadow-slate-900/20 scale-105" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
          >
            SUMMARY
          </button>
          <button 
            onClick={() => setDemoMode("rewrite")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all duration-300 ${demoMode === "rewrite" ? "bg-slate-800 text-white shadow-md shadow-slate-900/20 scale-105" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
          >
            REWRITE
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="p-6 md:p-8 flex flex-col gap-5 text-sm leading-relaxed overflow-y-auto w-full h-full custom-scrollbar">
        <div className="space-y-3 shrink-0">
          <div className="text-slate-500 font-semibold flex items-center gap-2 text-xs uppercase tracking-wider">
            <XCircle className={`w-4 h-4 ${clause.colors.icon}`} /> 
            <span className="truncate">原条款 (风险项: {clause.id} {clause.name})</span>
          </div>
          <div className={`${clause.colors.bg} border ${clause.colors.border} rounded-xl p-5 text-slate-600 leading-relaxed text-[15px]`}>
            "{clause.original}"
          </div>
        </div>
        
        <div className="flex justify-center -my-3 relative z-10 hidden sm:flex shrink-0">
           <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
             <ArrowDown className="w-4 h-4" />
           </div>
        </div>

        <div className="min-h-[250px] w-full shrink-0">
          <AnimatePresence mode="wait">
            {demoMode === "rewrite" ? (
              <motion.div 
                key="rewrite" 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.98 }} 
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="text-slate-500 font-semibold flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 合规重写模式 (Rewrite)
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 text-slate-700 leading-relaxed text-[15px] shadow-sm">
                  "{clause.rewrite}"
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="summary" 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.98 }} 
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="text-slate-500 font-semibold flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> 摘要解读模式 (Summary)
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 text-slate-700 leading-relaxed text-[14px] shadow-sm space-y-4">
                  <div>
                    <div className="font-bold text-amber-900 mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>一句话概括</div>
                    <div className="text-amber-800/80">{clause.summaryOutline}</div>
                  </div>
                  <div className="h-px w-full bg-amber-200/60"></div>
                  <div>
                    <div className="font-bold text-amber-900 mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>通俗解读</div>
                    <ol className="list-decimal pl-4 space-y-1.5 text-amber-800/80 marker:font-bold marker:text-amber-500/70">
                      {clause.summaryDetail.map((d, i) => (
                        <li key={i}>
                          <strong className="text-amber-900">{d.q}</strong> {d.a}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 1000], [0, 150]);
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const handleExperienceClick = () => {
    setToastMessage("请先登录");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-zinc-100 selection:bg-slate-200 selection:text-slate-900 relative overflow-x-hidden">
      
      {/* Cinematic Noise Grain */}
      <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.04] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Liquid Background Blobs */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-slate-400/30 blur-[120px] animate-blob"></div>
        <div className="absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-zinc-400/30 blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-stone-400/30 blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Background Waves (Replaces Video) */}
      <section className="relative min-h-screen flex justify-center overflow-hidden">
        
        {/* Background Waves */}
        <motion.div 
          className="absolute top-0 left-0 right-0 bottom-0 z-0 pointer-events-auto h-full w-full opacity-100"
          style={{ 
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
          }}
        >
          <motion.div style={{ y: videoY }} className="w-full h-full relative" >
            <ColorBends 
              colors={["#a78bfa", "#818cf8", "#3b82f6"]}
              rotation={90}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={2.0}
              noise={0.0}
              parallax={0.5}
              iterations={1}
              intensity={0.9}
              bandWidth={6}
              transparent={true}
              className="w-full h-full absolute inset-0 opacity-100 pointer-events-none"
            />
          </motion.div>
        </motion.div>
        
        {/* Main Content Container */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-[1200px] pt-[160px] pb-[100px] px-6 flex flex-col items-center gap-[32px]"
        >
          
          {/* Noomo-style Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-800 border border-slate-200 shadow-sm mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase font-mono">PrivacyGuard 1.0 is live</span>
          </motion.div>

          {/* Heading */}
          <h1 className="font-geist font-medium tracking-tighter text-5xl md:text-[72px] leading-[1.05] text-center text-slate-900 flex flex-col items-center">
            <div className="overflow-hidden py-1">
              <motion.div
                initial={{ y: "100%", rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
                className="origin-left"
              >
                智能高效的 <span className="font-serif italic text-6xl md:text-[84px] font-normal text-slate-800 pr-2">隐私政策</span>
              </motion.div>
            </div>
            <div className="overflow-hidden py-1">
              <motion.div
                initial={{ y: "100%", rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
                className="origin-left"
              >
                合规审查平台
              </motion.div>
            </div>
          </h1>

          {/* Description */}
          <div className="overflow-hidden mt-2">
            <motion.p 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.25 }}
              className="font-geist text-[20px] text-slate-800 font-medium max-w-[600px] text-center mix-blend-color-burn"
            >
              支持多项隐私保护法规 · 快速生成合规报告
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full mt-8"
          >
            <MagneticButton 
              onClick={handleExperienceClick}
              className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 text-white rounded-full px-10 py-5 font-semibold text-lg overflow-hidden transition-colors hover:bg-slate-800 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                立即体验
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </MagneticButton>
            <MagneticButton 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-xl border border-white/40 text-slate-800 rounded-full px-10 py-5 font-semibold text-lg transition-colors hover:bg-white/40 hover:border-white/60"
            >
              了解更多
            </MagneticButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-48 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl space-y-56">
          
          {/* Feature 1 */}
          <div className="space-y-16">
            <ScrollReveal className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-3 text-slate-500">
                <span className="w-8 h-[1px] bg-slate-300"></span>
                <span className="text-xs font-bold tracking-widest uppercase font-mono">Detection Engine</span>
                <span className="w-8 h-[1px] bg-slate-300"></span>
              </div>
              <ScrollFloat 
                animationDuration={1} 
                ease='back.inOut(2)' 
                stagger={0.03}
                containerClassName="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-0"
              >
                12大违规检测维度
              </ScrollFloat>
              <p className="text-slate-600 text-xl leading-relaxed">
                利用先进的自然语言处理技术，精准识别非法收集、超范围索权、账号注销困难等核心隐私违规项。
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Tabs Sidebar */}
              <ScrollSlide direction="left" className="lg:col-span-4 flex flex-col gap-3 relative">
                {complianceData.map((tab, idx) => {
                  const isActive = activeTab === idx;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(idx)}
                      className={`text-left px-6 py-5 rounded-2xl transition-all duration-500 flex items-center justify-between group relative z-10 ${
                        isActive 
                          ? '' 
                          : 'hover:bg-white/20'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBackground"
                          className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-2xl shadow-md border border-white/80 rounded-2xl -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                          isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 group-hover:text-slate-900'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-base transition-colors duration-500 ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                            {tab.title}
                          </div>
                          <div className={`text-xs font-mono mt-0.5 transition-colors duration-500 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{tab.count} 项检测</div>
                        </div>
                      </div>
                      <div className={`w-1.5 h-8 rounded-full transition-all duration-500 ${isActive ? 'bg-slate-900 shadow-sm' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </ScrollSlide>

              {/* Tab Content */}
              <ScrollSlide direction="right" className="lg:col-span-8">
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-3xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden min-h-[500px]">
                  <div className="px-8 py-6 border-b border-white/40 bg-white/30 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{complianceData[activeTab].title}</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold tracking-wide">
                      {complianceData[activeTab].count} RULES
                    </span>
                  </div>
                  <div className="divide-y divide-white/30">
                    {complianceData[activeTab].items.map((item, idx) => (
                      <motion.div 
                        key={`${activeTab}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="p-8 hover:bg-white/30 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-rose-400" />
                              <h4 className="text-lg font-semibold text-slate-900">{item.name}</h4>
                            </div>
                            <p className="text-slate-600 leading-relaxed pl-5">
                              {item.desc}
                            </p>
                          </div>
                          <div className="md:w-1/3 shrink-0 pl-5 md:pl-0">
                            <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 font-mono">违规判定依据</div>
                            <div className="text-sm text-slate-700 font-medium bg-slate-100/80 px-3 py-2 rounded-lg inline-block">
                              {item.law}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollSlide>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 grid grid-cols-2 gap-6">
              <InteractiveFlipCard
                frontIcon={Globe}
                frontTitle="广泛的法规覆盖"
                frontDesc="全面覆盖《个人信息保护法》等国内主流隐私保护法律法规，审查标准紧跟监管。"
                backContent={
                  <ul className="list-disc pl-4 space-y-2">
                    <li>《中华人民共和国个人信息保护法》(PIPL)</li>
                    <li>《中华人民共和国数据安全法》(DSL)</li>
                    <li>《网络安全法》(CSL)</li>
                    <li>《App违法违规收集使用个人信息行为认定方法》</li>
                    <li>GB/T 35273—2020《个人信息安全规范》</li>
                  </ul>
                }
                delay={0.1}
                className="md:translate-y-12"
              />
              <InteractiveFlipCard
                frontIcon={Database}
                frontTitle="RAG 智能法律检索"
                frontDesc="自动为每个维度的违规项匹配具体的法律渊源与相关条文正文。"
                backContent={
                  <div className="space-y-3">
                    <p>1. 高效的条文语义片段检索</p>
                    <p>2. 精确匹配至具体的法律条例</p>
                    <p>3. 提取诸如《个保法》等法条正文</p>
                    <p>4. 避免黑盒结论，确保审查有法可依</p>
                  </div>
                }
                delay={0.2}
              />
            </div>
            <ScrollSlide direction="right" className="order-1 md:order-2 space-y-8">
              <div className="inline-flex items-center gap-3 text-slate-500">
                <span className="w-8 h-[1px] bg-slate-300"></span>
                <span className="text-xs font-bold tracking-widest uppercase font-mono">Intelligence Base</span>
              </div>
              <ScrollFloat 
                animationDuration={1} 
                ease='back.inOut(2)' 
                stagger={0.05}
                containerClassName="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-0"
              >
                RAG 法律精准溯源
              </ScrollFloat>
              <p className="text-slate-700 text-xl leading-relaxed">
                内置标准隐私法律文书。通过检索增强（RAG）技术，智能在底层为每一个检测到的违规项提供精准的溯源支持与完整的法条上下文。
              </p>
              <blockquote className="p-8 bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-3xl border-l-4 border-l-slate-800 text-slate-800 italic font-serif text-2xl">
                "不仅告诉你哪里违规，更告诉你背后的明确法律出处。"
              </blockquote>
            </ScrollSlide>
          </div>

          {/* Feature 3 - Code Fixes */}
          <ScrollUnfold className="bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[3rem] p-10 md:p-16 overflow-hidden relative">
            <div className="absolute inset-0 z-0 opacity-[0.15] mix-blend-multiply">
              <Threads amplitude={2} distance={0} enableMouseInteraction={true} color={[0.4, 0.4, 0.5]} />
            </div>
            <div className="grid md:grid-cols-12 gap-16 relative z-10 items-center pointer-events-none">
              <div className="col-span-12 md:col-span-5 space-y-8 pointer-events-auto">
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">双模式智能整改</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  针对风险条款自动生成方案。系统提供「极简概括+通俗解读」与「专业合规文本重写」双重模式，不仅帮您一键看懂复杂条文，更可直接生成修订文本。
                </p>
                
                <div className="pt-8 w-full">
                  <div className="flex justify-between mb-4 items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">当前合规评分</span>
                    <span className="text-5xl font-bold text-slate-900 tracking-tight">68.5<span className="text-xl text-slate-500 ml-1">%</span></span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-slate-800 rounded-full relative"
                      initial={{ width: 0 }}
                      whileInView={{ width: '68.5%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                       <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-7 w-full h-[600px] flex items-center justify-center relative pointer-events-auto">
                <Stack 
                  randomRotation={true}
                  sensitivity={100}
                  sendToBackOnClick={false}
                  cards={MOCK_CLAUSES.map(c => <DemoClauseCard key={c.id} clause={c} />)}
                />
                
                {/* Drag Hint */}
                <div className="absolute -bottom-10 right-4 text-slate-400 text-xs font-mono font-bold tracking-widest flex items-center gap-2 pointer-events-none opacity-50">
                  DRAG CARD TO SKIP <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </ScrollUnfold>

        </div>
      </section>

      {/* Step Guide */}
      <section id="workflow" className="py-32 relative z-10">
        <ScrollReveal className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-24">
            <span className="inline-block uppercase tracking-widest text-slate-500 mb-4 text-xs font-bold font-mono">Workflow</span>
            <ScrollFloat 
              animationDuration={1} 
              ease='back.inOut(2)' 
              stagger={0.05}
              containerClassName="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-0"
            >
              如何开始
            </ScrollFloat>
          </div>
          
          <div className="flex flex-col gap-8 relative max-w-3xl mx-auto">
            {/* SVG Animated Connecting Line */}
            <div className="hidden md:block absolute left-[48px] top-24 bottom-24 w-[2px] z-0">
               <svg width="100%" height="100%" preserveAspectRatio="none">
                  <motion.line 
                    x1="0" y1="0" x2="0" y2="100%" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeDasharray="8 8"
                    className="text-slate-200"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
               </svg>
            </div>

            {[
              { icon: UploadCloud, title: '导入隐私政策', desc: '支持纯文本粘贴，或直接上传 TXT/DOC/PDF 格式文件，也可一键抓取网页 URL 原文。' },
              { icon: BrainCircuit, title: '条款分类分析与法条匹配', desc: '系统全自动化核心分析，精准识别12大类违规指标，并同步对接底层实现 RAG 法条搜索并匹配。' },
              { icon: FileText, title: '双模式整改与导出报告', desc: '利用「摘要解读与合规重写」优化风险条款，采纳后一键下载包含具体建议的纯文本综合合规报告。' }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02, x: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10 bg-gradient-to-br from-slate-50/80 to-slate-200/50 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 md:p-10 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center gap-8 text-left"
              >
                <div className="w-20 h-20 shrink-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl rounded-2xl shadow-sm border border-white flex items-center justify-center text-slate-800">
                  {i === 0 ? (
                    <Folder size={0.6} color="#475569" className="-translate-y-1" />
                  ) : (
                    <step.icon className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2 block font-mono">Step 0{i + 1}</span>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 text-center">
            <button onClick={handleExperienceClick} className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-10 py-4 font-medium text-lg shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02] active:scale-[0.98]">
              立即开始使用
            </button>
          </div>
        </ScrollReveal>
      </section>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl font-medium"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
