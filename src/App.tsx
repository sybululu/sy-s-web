/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import MarketingNavbar from './components/marketing/MarketingNavbar';
import MarketingFooter from './components/marketing/MarketingFooter';

export default function App() {
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // 营销站状态：未登录时默认展示营销站，点CTA后切换到登录页
  const [showMarketing, setShowMarketing] = useState(true);
  const [marketingPage, setMarketingPage] = useState<'landing' | 'pricing'>('landing');

  // 取消分析函数
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisStep('');
  }, []);

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
      api.getProjects()
        .then(data => {
          if (Array.isArray(data)) {
            // Map backend project format to frontend Project format
            const mappedProjects: Project[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              date: p.created_at.split('T')[0],
              description: `审查得分: ${p.score}，风险等级: ${p.risk_level}`,
              score: p.score,
              riskStatus: p.risk_level,
              clauseCount: 0,
              clauses: [] // 列表接口可能不返回 clauses，需要点进去再拉取，或者后端直接返回
            }));
            setProjects(mappedProjects);
            if (mappedProjects.length > 0) {
              // 默认选中第一个，但可能需要拉取详情
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
          // 排除 401 错误（已在 apiFetch 中处理）
          if (err.code !== 'UNAUTHORIZED') {
            showToast(err.message || '无法连接到后端服务，请检查 API 地址配置', 'error');
          }
        });
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
      // 尝试获取项目详情（包含 clauses）
      const detail = await api.getProject(String(project.id));
      const fullProject: Project = {
        ...project,
        clauses: mapRawToClauses(detail.violations || []),
      };
      setCurrentProject(fullProject);
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setCurrentProject(project); // fallback
    }
    setCurrentView('details');
  };

  const handleOpenDrawer = (clause: Clause) => {
    setSelectedClause(clause);
    setIsDrawerOpen(true);
  };

  const handleAdopt = (updatedClause: Clause) => {
    if (!currentProject) return;

    // 更新 currentProject 中的对应 clause
    const updatedClauses = currentProject.clauses.map(c =>
      c.id === updatedClause.id ? updatedClause : c
    );

    const updatedProject: Project = {
      ...currentProject,
      clauses: updatedClauses,
    };
    setCurrentProject(updatedProject);

    // 回写后端：将采纳后的条款（含 suggested_text）同步到数据库，导出时可用
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
    
    // 创建 AbortController 用于取消请求
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
      
      // Map Python backend response to frontend Project structure
      // 后端返回的 id 格式为 "p{uuid12}" (如 "p1a2b3c4d5e6f")，保持字符串不转换
      const newProject: Project = {
        id: result.id as any,  // 后端 id 为字符串格式 p{hex}，不做 parseInt 避免 NaN
        name: result.name,
        date: new Date().toISOString().split('T')[0],
        description: `自动化合规审查报告。共发现 ${result.violations.length} 项潜在风险。`,
        score: result.score,
        riskStatus: result.risk_level,  // 整个审查的风险等级
        clauseCount: result.violations?.length || 0,
        clauses: mapRawToClauses(result.violations || []),
      };
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setCurrentView('details');
      setSearchQuery('');
      showToast('审计完成，已生成合规报告');
    } catch (error: any) {
      // 检查是否是用户取消的请求
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

  // 未登录：默认展示营销站，点CTA后切换到登录/注册页
  if (!isLoggedIn) {
    if (showMarketing) {
      return (
        <div className="min-h-screen flex flex-col font-sans bg-white">
          <MarketingNavbar
            onGetStarted={() => setShowMarketing(false)}
            currentPage={marketingPage}
            onPageChange={setMarketingPage}
          />
          <main className="flex-1">
            {marketingPage === 'landing' ? (
              <Landing onGetStarted={() => setShowMarketing(false)} />
            ) : (
              <Pricing onGetStarted={() => setShowMarketing(false)} />
            )}
          </main>
          <MarketingFooter />
        </div>
      );
    }
    // 用户点了CTA，展示登录/注册页
    return (
      <>
        {isRegistering ? (
          <Register 
            onRegister={(token, user) => { handleLogin(token, user); setIsRegistering(false); }} 
            onSwitchToLogin={() => setIsRegistering(false)} 
            onShowToast={showToast}
          />
        ) : (
          <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setIsRegistering(true)}
            onShowToast={showToast}
          />
        )}
        <Toast toast={toast} />
      </>
    );
  }

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
                <Overview currentProject={displayProject} projects={projects} onViewChange={handleViewChange} onRiskFilter={handleRiskFilter} />
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

