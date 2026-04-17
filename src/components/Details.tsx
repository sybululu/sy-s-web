import { FileText, Filter, Download, ArrowRight, ChevronLeft, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { Project, Clause } from '../types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DetailsProps {
  currentProject: Project | null;
  onOpenDrawer: (clause: Clause) => void;
  onDownload: () => void;
}

// 12类违规类别定义
const VIOLATION_CATEGORIES = [
  { id: 'I1', name: '过度收集敏感数据', risk: 'high' },
  { id: 'I2', name: '未说明收集目的', risk: 'high' },
  { id: 'I3', name: '未获得明示同意', risk: 'high' },
  { id: 'I4', name: '收集范围超出服务需求', risk: 'medium' },
  { id: 'I5', name: '未明确第三方共享范围', risk: 'medium' },
  { id: 'I6', name: '未获得单独共享授权', risk: 'high' },
  { id: 'I7', name: '未明确共享数据用途', risk: 'medium' },
  { id: 'I8', name: '未明确留存期限', risk: 'low' },
  { id: 'I9', name: '未说明数据销毁机制', risk: 'low' },
  { id: 'I10', name: '未明确用户权利范围', risk: 'low' },
  { id: 'I11', name: '未提供便捷权利行使途径', risk: 'low' },
  { id: 'I12', name: '未明确权利响应时限', risk: 'low' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Details({ currentProject, onOpenDrawer, onDownload }: DetailsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 8;
  
  // 点击外部关闭筛选下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentProject) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-serif text-ink mb-3">暂无违规明细</h3>
        <p className="text-ink-muted max-w-md leading-relaxed">
          请先在“新建审查任务”中提交隐私政策文本，系统分析完成后将在此处展示详细的违规条款与整改建议。
        </p>
      </motion.div>
    );
  }

  // 根据筛选条件过滤数据
  const filteredClauses = useMemo(() => {
    if (!filterCategory) return currentProject?.clauses || [];
    return (currentProject?.clauses || []).filter(clause => {
      const clauseId = clause.category?.replace('I', 'I') || clause.categoryName;
      // 匹配类别ID或类别名称
      return clause.category === filterCategory || clause.categoryName?.includes(VIOLATION_CATEGORIES.find(c => c.id === filterCategory)?.name || '');
    });
  }, [currentProject?.clauses, filterCategory]);

  const totalPages = Math.ceil(filteredClauses.length / ITEMS_PER_PAGE) || 1;
  const currentData = filteredClauses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  // 重置页码当筛选改变时
  const handleFilterChange = (categoryId: string | null) => {
    setFilterCategory(categoryId);
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };
  
  // 计算分页显示范围
  const startItem = filteredClauses.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredClauses.length);

  // 获取选中筛选器的名称
  const selectedFilterName = filterCategory 
    ? VIOLATION_CATEGORIES.find(c => c.id === filterCategory)?.name 
    : null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-6xl mx-auto h-full flex flex-col"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-serif text-ink tracking-tight">
              违规条款明细
            </h2>
            <span className="bg-surface-alt text-ink-muted text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200">
              {filteredClauses.length} {filterCategory ? `项 (已筛选)` : '项发现'}
            </span>
          </div>
          <p className="text-ink-muted text-sm flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {currentProject.name}
          </p>
        </div>
        <div className="flex gap-3">
          {/* 筛选按钮 */}
          <div ref={filterButtonRef} className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border shadow-sm transition-colors flex items-center gap-2 ${
                filterCategory 
                  ? 'bg-[#d97757]/10 text-[#d97757] border-[#d97757]/30 hover:bg-[#d97757]/20' 
                  : 'bg-white text-ink border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> 
              {selectedFilterName ? selectedFilterName : '筛选'}
            </button>
            
            {/* 筛选下拉菜单 */}
            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg border border-slate-200 shadow-lg max-h-80 overflow-y-auto min-w-64"
                >
                  <div className="p-2">
                    <button
                      onClick={() => handleFilterChange(null)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        !filterCategory ? 'bg-[#d97757]/10 text-[#d97757]' : 'text-ink hover:bg-slate-50'
                      }`}
                    >
                      全部显示
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    {VIOLATION_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleFilterChange(cat.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                          filterCategory === cat.id ? 'bg-[#d97757]/10 text-[#d97757]' : 'text-ink hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cat.risk === 'high' ? 'bg-red-500' : cat.risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                        <span className="font-mono text-xs text-ink-muted">{cat.id}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* 清除筛选 */}
          {filterCategory && (
            <button
              onClick={() => handleFilterChange(null)}
              className="px-3 py-1.5 text-sm font-medium text-[#d97757] rounded-md border border-[#d97757]/30 bg-[#d97757]/10 hover:bg-[#d97757]/20 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" /> 清除筛选
            </button>
          )}
          
          <button 
            onClick={onDownload}
            className="px-3 py-1.5 bg-white text-sm font-medium text-ink rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> 导出报告
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-xl flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 border-b border-white/30">
                <th className="px-4 py-3 text-xs font-medium text-ink-muted w-24">条款 ID</th>
                <th className="px-4 py-3 text-xs font-medium text-ink-muted w-32">位置</th>
                <th className="px-4 py-3 text-xs font-medium text-ink-muted w-40">风险类别</th>
                <th className="px-4 py-3 text-xs font-medium text-ink-muted">内容片段</th>
                <th className="px-4 py-3 text-xs font-medium text-ink-muted w-24">等级</th>
                <th className="px-4 py-3 text-xs font-medium text-ink-muted w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {currentData.length > 0 ? (
                currentData.map((clause, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={clause.id} 
                    className="hover:bg-white/50 transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-ink-muted">{clause.id}</td>
                    <td className="px-4 py-3 text-xs text-ink-muted">{clause.location}</td>
                    <td className="px-4 py-3 text-sm text-ink font-medium">{clause.categoryName || clause.category}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted truncate max-w-md" title={clause.snippet}>
                      {clause.snippet}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        clause.riskLevel === 'high'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : clause.riskLevel === 'medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {clause.riskLevel === 'high' ? '高危' : clause.riskLevel === 'medium' ? '中度' : '低危'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => onOpenDrawer(clause)}
                        className="text-ink hover:text-[#d97757] font-medium text-xs flex items-center gap-1 ml-auto transition-all cursor-pointer"
                      >
                        审查
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted text-sm">
                    未发现违规条款
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-white/30 flex items-center justify-between bg-white/40 mt-auto shrink-0">
          <div className="text-sm text-ink-muted">
            显示第 <span className="font-medium text-ink">{startItem}</span> 到 <span className="font-medium text-ink">{endItem}</span> 条，共 <span className="font-medium text-ink">{filteredClauses.length}</span> 条
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-white/60 bg-white/60 text-ink-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-ink px-2">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-white/60 bg-white/60 text-ink-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
