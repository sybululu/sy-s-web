import React, { useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0 },
          hidden: { y: "-150%" }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center px-6 py-3 justify-between glass-panel rounded-full w-[90%] max-w-5xl"
      >
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <span className="hidden sm:inline">智审合规</span>
          <span className="sm:hidden">智审合规</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm font-medium text-slate-900" to="/">产品平台</Link>
          <a className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#" onClick={(e) => { e.preventDefault(); setToastMessage("即将上线"); setTimeout(() => setToastMessage(""), 3000); }}>客户案例</a>
          <Link className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" to="/pricing">价格方案</Link>
          <a className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#" onClick={(e) => { e.preventDefault(); setToastMessage("即将上线"); setTimeout(() => setToastMessage(""), 3000); }}>更新日志</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-slate-900 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            立即体验
          </button>
        </div>
      </motion.nav>

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
    </>
  );
}
