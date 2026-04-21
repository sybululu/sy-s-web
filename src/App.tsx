/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { ViewType, Project, Clause, ToastState, User, mapRawToClauses, getRiskStatus } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import NewTask from './components/NewTask';
import Details from './components/Details';
import History from './components/History';
import Drawer from './components/Drawer';
import Toast from './components/Toast';
import Login from './components/Login';
import Register from './components/Register';
import { api } from './utils/api';
import { AnimatePresence, motion } from 'motion/react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Hero 营销站组件（新版 sybululu/hero）
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Footer from './components/Footer';

// ═══════════════════════════════════════════
// 营销站布局：Navbar + 内容 + Footer
// ═══════════════════════════════════════════
function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hero-marketing min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════
// 完整登录/注册页面（全屏，非弹窗）
// ═══════════════════════════════════════════
function AuthPage({
  isRegistering,
  onLogin,
  onRegister,
  onSwitchToLogin,
  onSwitchToRegister,
  showToast,
  onBack
}: {
  isRegistering: boolean;
  onLogin: (token: string, user: User) => void;
  onRegister: (token: string, user: User) => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onBack: () => void;
}) {
  return (
    <div>
      {isRegistering ? (
          <Register
            onRegister={(token, user) => { onRegister(token, user); }}
            onSwitchToLogin={onSwitchToLogin}
            onShowToast={showToast}
            onBack={onBack}
          />
        ) : (
          <Login
            onLogin={onLogin}
            onSwitchToRegister={onSwitchToRegister}
            onShowToast={showToast}
            onBack={onBack}
          />
        )}
      <Toast toast={{ message: '', type: 'success', visible: false }} />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [riskFilterFromOverview, setRiskFilterFromOverview] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 取消分析函数
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisStep('');
  }, []);

  // 未登录时：Hook Hero 营销站的"立即体验"/"立即开始使用"按钮 → 跳转完整登录页
  useEffect(() => {
    if (isLoggedIn) return;
    const handleExperienceClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') &&
        (target.textContent?.includes('立即体验') || target.textContent?.includes('立即开始使用'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsRegistering(false);
        navigate('/login');
      }
    };
    document.addEventListener('click', handleExperienceClick, true);
    return () => document.removeEventListener('click', handleExperienceClick, true);
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    // 检查本地是否已有 token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoadingProjects(true);
      api.getProjects()
        .then(data => {
          if (Array.isArray(data)) {
            const mappedProjects: Project[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              date: p.created_at.split('T')[0],
              description: `审查得分: ${p.score}，风险等级: ${p.risk_level}`,
              score: p.score,
              riskStatus: p.risk_level,
              clauseCount: 0,
              clauses: []
            }));
            setProjects(mappedProjects);
            if (mappedProjects.length > 0) {
              handleSelectProject(mappedProjects[0]);
            }
          } else {
            console.error('Expected array from API, got:', data);
            setProjects([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch projects:', err);
          setProjects([]);
          if (err.code !== 'UNAUTHORIZED') {
            showToast(err.message || '无法连接到后端服务，请检查 API 地址配置', 'error');
          }
        })
        .finally(() => setIsLoadingProjects(false));
    }
  }, [isLoggedIn]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleLogin = (token: string, user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('overview');
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'details') {
      setRiskFilterFromOverview(null);
    }
  };

  const handleSelectProject = async (project: Project) => {
    try {
      const detail = await api.getProject(String(project.id));
      const fullProject: Project = {
        ...project,
        clauses: mapRawToClauses(detail.violations || []),
      };
      setCurrentProject(fullProject);
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setCurrentProject(project);
    }
    setCurrentView('details');
  };

  const handleOpenDrawer = (clause: Clause) => {
    setSelectedClause(clause);
    setIsDrawerOpen(true);
  };

  const handleAdopt = (updatedClause: Clause) => {
    if (!currentProject) return;

    const updatedClauses = currentProject.clauses.map(c =>
      c.id === updatedClause.id ? updatedClause : c
    );

    const updatedProject: Project = {
      ...currentProject,
      clauses: updatedClauses,
    };
    setCurrentProject(updatedProject);

    api.updateProject(String(currentProject.id), updatedClauses.map(c => ({
      indicator: c.categoryName || c.reason,
      violation_id: String(c.category),
      snippet: c.originalText,
      legal_basis: c.legalBasis,
      legal_detail: c.legalDetail || '',
      suggested_text: c.suggestedText && c.suggestedText !== '【系统建议】请根据合规要求修改。' ? c.suggestedText : '',
    }))).catch(err => {
      console.error('Failed to sync adopted clause to backend:', err);
    });

    showToast('整改方案已应用到当前草稿');
    setIsDrawerOpen(false);
  };

  const handleDownload = async () => {
    if (!currentProject) return;
    try {
      await api.exportReport(String(currentProject.id));
      showToast('合规报告导出成功');
    } catch (err) {
      showToast('导出失败', 'error');
    }
  };

  const handleRiskFilter = useCallback((riskLevel: string) => {
    setRiskFilterFromOverview(riskLevel);
    setCurrentView('details');
  }, []);

  const handleStartAnalysis = async (type: string, value: any) => {
    if (!value) {
      showToast('请输入有效内容', 'error');
      return;
    }

    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setAnalysisStep('正在提取文本内容...');

    try {
      let textToAnalyze = value;

      if (type === 'file') {
        const uploadRes = await api.uploadFile(value as File);
        textToAnalyze = uploadRes.text;
      } else if (type === 'url') {
        const urlRes = await api.fetchUrl(value as string);
        textToAnalyze = urlRes.text;
      }

      setAnalysisStep('正在进行合规性分析...');
      const result = await api.analyze(textToAnalyze, type, abortControllerRef.current.signal);

      setAnalysisStep('正在生成审查报告与整改建议...');

      const newProject: Project = {
        id: result.id as any,
        name: result.name,
        date: new Date().toISOString().split('T')[0],
        description: `自动化合规审查报告。共发现 ${result.violations.length} 项潜在风险。`,
        score: result.score,
        riskStatus: result.risk_level,
        clauseCount: result.violations?.length || 0,
        clauses: mapRawToClauses(result.violations || []),
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setCurrentView('details');
      setSearchQuery('');
      showToast('审计完成，已生成合规报告');
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        showToast('已取消审查', 'error');
      } else {
        console.error(error);
        showToast(error.message || '分析失败，请重试', 'error');
      }
    } finally {
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // ═══════════════════════════════════════════
  // 未登录 → Hero 营销站（含路由：首页/定价/登录）
  // 已登录 → B 端产品
  // ═══════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={
          <MarketingLayout>
            <Landing />
          </MarketingLayout>
        } />
        <Route path="/pricing" element={
          <MarketingLayout>
            <Pricing />
          </MarketingLayout>
        } />
        <Route path="/login" element={
          <AuthPage
            isRegistering={isRegistering}
            onLogin={(token, user) => { handleLogin(token, user); }}
            onRegister={(token, user) => { handleLogin(token, user); setIsRegistering(false); }}
            onSwitchToLogin={() => setIsRegistering(false)}
            onSwitchToRegister={() => setIsRegistering(true)}
            showToast={showToast}
            onBack={() => navigate('/')}
          />
        } />
      </Routes>
    );
  }

  // ═══════════════════════════════════════════
  // B 端产品界面（已登录）
  // ═══════════════════════════════════════════
  const viewTitles: Record<ViewType, string> = {
    overview: '总览仪表盘',
    'new-task': '新建审查任务',
    details: '违规条款明细',
    history: '历史审查报告'
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClauses = currentProject?.clauses.filter(c =>
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const displayProject = currentProject ? { ...currentProject, clauses: filteredClauses } : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <Header
          title={viewTitles[currentView]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onShowToast={showToast}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentView === 'overview' && (
                <Overview currentProject={displayProject} projects={projects} onViewChange={handleViewChange} onRiskFilter={handleRiskFilter} isLoading={isLoadingProjects} />
              )}
              {currentView === 'new-task' && (
                <NewTask onStartAnalysis={handleStartAnalysis} />
              )}
              {currentView === 'details' && (
                <Details
                  currentProject={displayProject}
                  onOpenDrawer={handleOpenDrawer}
                  onDownload={handleDownload}
                  initialRiskFilter={riskFilterFromOverview}
                />
              )}
              {currentView === 'history' && (
                <History projects={filteredProjects} onSelectProject={handleSelectProject} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Drawer
        clause={selectedClause}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAdopt={handleAdopt}
        onShowToast={showToast}
      />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-ink rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-serif text-ink tracking-tight mb-2">深度审计中</h3>
          <p className="text-sm text-ink-muted font-mono animate-pulse mb-6">{analysisStep}</p>
          <button
            onClick={cancelAnalysis}
            className="px-6 py-2 bg-ink/10 text-ink border border-ink/20 rounded-lg hover:bg-ink/20 transition-colors text-sm font-medium"
          >
            取消审查
          </button>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
