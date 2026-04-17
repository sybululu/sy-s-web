import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, ThumbsUp, ThumbsDown, Edit3, Copy, Check } from 'lucide-react';
import { Clause } from '../types';
import { useState, useEffect } from 'react';
import { diffWords, Change } from 'diff';

interface DrawerProps {
  clause: Clause | null;
  isOpen: boolean;
  onClose: () => void;
  onAdopt: (updatedClause: Clause) => void;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function Drawer({ clause, isOpen, onClose, onAdopt, onShowToast }: DrawerProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localDiffHtml, setLocalDiffHtml] = useState('');
  const [localLegalBasis, setLocalLegalBasis] = useState('');

  useEffect(() => {
    if (clause) {
      setEditedText(clause.suggestedText);
      setLocalDiffHtml(clause.diffSuggestedHtml);
      setLocalLegalBasis(clause.legalBasis);
      setFeedback(null);
      setCopied(false);
      
      // 如果建议文本是默认的，调用后端生成真实的建议
      if (clause.suggestedText === '【系统建议】请根据合规要求修改。' || !clause.suggestedText) {
        generateSuggestion(clause);
      }
    }
  }, [clause]);

  const generateSuggestion = async (currentClause: Clause) => {
    setIsGenerating(true);
    try {
      const { api } = await import('../utils/api');
      const res = await api.rectify(currentClause.originalText, currentClause.category, currentClause.legalBasis);
      setEditedText(res.suggested_text);
      setLocalDiffHtml(`<span class="diff-add">${res.suggested_text}</span>`);
      setLocalLegalBasis(res.legal_basis);
      
      // 更新 clause 对象，避免重复生成
      currentClause.suggestedText = res.suggested_text;
      currentClause.legalBasis = res.legal_basis;
      currentClause.diffSuggestedHtml = `<span class="diff-add">${res.suggested_text}</span>`;
    } catch (error: any) {
      console.error('Failed to generate suggestion:', error);
      onShowToast?.(error.message || '生成整改建议失败，请检查网络连接后重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    if (type === 'up') {
      onShowToast?.('感谢反馈，已记录为正向样本');
    } else {
      onShowToast?.('感谢反馈，已记录为负向样本，模型将持续优化');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    onShowToast?.('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdoptClick = () => {
    if (!clause) return;
    
    // 创建更新后的 clause 对象
    const updatedClause: Clause = {
      ...clause,
      suggestedText: editedText,
      diffSuggestedHtml: generateDiffHtml(clause.originalText, editedText),
      legalBasis: localLegalBasis,
    };
    
    onAdopt(updatedClause);
  };

  // 生成 diff HTML 用于对比显示
  const generateDiffHtml = (original: string, suggested: string): string => {
    const changes: Change[] = diffWords(original, suggested);
    
    return changes.map(change => {
      if (change.added) {
        return `<span class="diff-add">${escapeHtml(change.value)}</span>`;
      }
      if (change.removed) {
        return `<span class="diff-remove">${escapeHtml(change.value)}</span>`;
      }
      return escapeHtml(change.value);
    }).join('');
  };

  // HTML 转义函数
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[900px] max-w-[95vw] glass-panel shadow-2xl z-[101] flex flex-col border-l border-white/30"
          >
            <div className="px-8 py-5 border-b border-white/30 flex justify-between items-center bg-white/40">
              <div>
                <h3 className="text-xl font-serif text-ink tracking-tight">RAG-mT5 自动改写引擎</h3>
                <p className="text-xs text-ink-muted font-mono mt-1">审查详情: {clause?.id}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/50 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {clause && (
                <>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="text-xs font-medium text-ink-muted mb-2 uppercase tracking-widest">风险类别</div>
                    <div className="text-lg font-serif text-ink">{clause.reason}</div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Sparkles className="w-4 h-4 text-[#d97757]" />
                        改写对比
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted mr-2">模型反馈:</span>
                        <button 
                          onClick={() => handleFeedback('up')}
                          className={`p-1.5 rounded-md transition-colors ${feedback === 'up' ? 'bg-green-100/80 text-green-700' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
                          title="准确"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleFeedback('down')}
                          className={`p-1.5 rounded-md transition-colors ${feedback === 'down' ? 'bg-red-100/80 text-red-700' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
                          title="存在幻觉/不准确"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 侧边对比视图 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-card rounded-lg overflow-hidden">
                        <div className="bg-red-50/60 px-4 py-2 border-b border-white/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-red-700">原始条款</span>
                            <span className="text-[10px] text-red-600/70">{clause.location}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {clause.originalText}
                          </p>
                        </div>
                      </div>
                      <div className="glass-card rounded-lg overflow-hidden border-[#d97757]/30">
                        <div className="bg-[#d97757]/10 px-4 py-2 border-b border-white/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#d97757]">改写建议</span>
                            {isGenerating ? (
                              <span className="text-[10px] text-[#d97757]/70 animate-pulse">生成中...</span>
                            ) : (
                              <span className="text-[10px] text-[#d97757]/70">AI 生成</span>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          {isGenerating ? (
                            <div className="space-y-2">
                              <div className="h-4 bg-slate-200/50 rounded animate-pulse w-full"></div>
                              <div className="h-4 bg-slate-200/50 rounded animate-pulse w-3/4"></div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: generateDiffHtml(clause.originalText, editedText) }} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 图例说明 */}
                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40"></span>
                        新增内容
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40"></span>
                        删除内容
                      </span>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Edit3 className="w-4 h-4 text-ink-muted" />
                        人工二次编辑
                      </div>
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? '已复制' : '复制内容'}
                      </button>
                    </div>
                    <div className="glass-input rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-ink focus-within:border-ink transition-all">
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-12 text-ink-muted text-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <div className="w-8 h-8 border-3 border-slate-200 rounded-full"></div>
                              <div className="absolute inset-0 border-3 border-t-[#d97757] rounded-full animate-spin"></div>
                            </div>
                            <div className="text-ink font-medium">AI 正在生成整改建议</div>
                          </div>
                          <div className="text-xs text-ink-muted/70 space-y-1 text-center">
                            <p>正在检索相关法律条文...</p>
                            <p>正在调用微调 mT5 模型生成建议...</p>
                            <p className="text-[10px] opacity-50">请稍候，预计需要 3-5 秒</p>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full p-4 min-h-[120px] text-sm text-ink leading-relaxed resize-y outline-none bg-transparent"
                          placeholder="在此处对模型建议进行最终微调..."
                        />
                      )}
                      <div className="bg-white/30 px-4 py-2 border-t border-white/20 flex justify-end">
                        <span className="text-xs text-ink-muted">
                          {editedText.length} 字
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <BookOpen className="w-4 h-4 text-ink-muted" />
                      合规依据
                    </div>
                    <div className="glass-card p-5 rounded-lg">
                      {isGenerating && !localLegalBasis ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200/50 rounded animate-pulse w-3/4"></div>
                          <div className="h-4 bg-slate-200/50 rounded animate-pulse w-1/2"></div>
                        </div>
                      ) : (
                        <pre className="text-sm text-ink-muted leading-relaxed font-serif whitespace-pre-wrap">
                          {localLegalBasis}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            <div className="p-5 bg-white/40 border-t border-white/30 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 glass-card text-ink font-medium text-sm rounded-md hover:bg-white/60 transition-colors shadow-sm"
              >
                取消
              </button>
              <button 
                onClick={handleAdoptClick}
                disabled={isGenerating}
                className="flex-1 py-2.5 bg-ink text-white font-medium text-sm rounded-md hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                采纳并应用
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
