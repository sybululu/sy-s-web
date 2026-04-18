import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, ThumbsUp, ThumbsDown, Edit3, Copy, Check, User, FileText, RefreshCw } from 'lucide-react';
import { Clause } from '../types';
import { useState, useEffect, useCallback } from 'react';
import { diffWords, Change } from 'diff';

type RectifyMode = 'summary' | 'rewrite';

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
  const [localLegalDetail, setLocalLegalDetail] = useState('');
  const [mode, setMode] = useState<RectifyMode>('rewrite');
  // 记录每种模式+条款 已生成过的结果，避免重复调用（key: `${mode}_${clauseId}`）
  const [generatedCache, setGeneratedCache] = useState<Record<string, { text: string; legal: string; diff: string }>>({} as any);

  // 切换模式时，恢复缓存或触发新生成
  useEffect(() => {
    if (!clause) return;

    const cacheKey = `${mode}_${clause.id || clause.originalText?.slice(0, 30)}`;
    const cached = generatedCache[cacheKey];
    if (cached) {
      // 有缓存则直接恢复
      setEditedText(cached.text);
      setLocalDiffHtml(cached.diff);
      setLocalLegalBasis(cached.legal);
      setLocalLegalDetail(cached.detail || '');
    } else {
      // 无缓存：如果是 rewrite 模式且 clause 有默认建议文本，先用默认值
      if (mode === 'rewrite' && clause.suggestedText && clause.suggestedText !== '【系统建议】请根据合规要求修改。') {
        setEditedText(clause.suggestedText);
        setLocalDiffHtml(clause.diffSuggestedHtml || '');
        setLocalLegalBasis(clause.legalBasis || '');
        setLocalLegalDetail(clause.legalDetail || '');
      } else {
        // 否则清空等待生成
        setEditedText('');
        setLocalDiffHtml('');
        setLocalLegalBasis(clause.legalBasis || '');
        setLocalLegalDetail(clause.legalDetail || '');
        // 自动触发生成
        generateSuggestion(clause, mode);
      }
    }
    setFeedback(null);
    setCopied(false);
  }, [clause, mode]);

  const generateSuggestion = useCallback(async (currentClause: Clause, targetMode: RectifyMode) => {
    const cacheKey = `${targetMode}_${currentClause.id || currentClause.originalText?.slice(0, 30)}`;
    // 防止重复生成
    if (generatedCache[cacheKey]) return;

    setIsGenerating(true);
    try {
      const { api } = await import('../utils/api');
      const res = await api.rectify(
        currentClause.originalText,
        String(currentClause.category),
        currentClause.legalBasis,
        targetMode
      );

      const text = res.suggested_text;
      const diffHtml = targetMode === 'rewrite'
        ? generateDiffHtml(currentClause.originalText, text)
        : `<span class="text-slate-700">${escapeHtml(text)}</span>`;

      setEditedText(text);
      setLocalDiffHtml(diffHtml);
      setLocalLegalBasis(res.legal_basis);
      setLocalLegalDetail(res.legal_detail || '');

      // 写入缓存
      setGeneratedCache(prev => ({
        ...prev,
        [cacheKey]: { text, legal: res.legal_basis, detail: res.legal_detail || '', diff: diffHtml },
      }));

      // 同步到 clause 对象（rewrite 模式才同步）
      if (targetMode === 'rewrite') {
        currentClause.suggestedText = text;
        currentClause.legalBasis = res.legal_basis;
        currentClause.diffSuggestedHtml = diffHtml;
      }
    } catch (error: any) {
      console.error('Failed to generate suggestion:', error);
      onShowToast?.(error.message || '生成失败，请检查网络连接后重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [generatedCache, onShowToast]);

  const handleModeSwitch = (newMode: RectifyMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  const handleRegenerate = () => {
    if (!clause) return;
    // 清除当前模式+条款缓存，强制重新生成
    const cacheKey = `${mode}_${clause.id || clause.originalText?.slice(0, 30)}`;
    setGeneratedCache(prev => {
      const next = { ...prev };
      delete next[cacheKey];
      return next;
    });
    generateSuggestion(clause, mode);
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
    if (!clause || mode !== 'rewrite') return;

    const updatedClause: Clause = {
      ...clause,
      suggestedText: editedText,
      diffSuggestedHtml: generateDiffHtml(clause.originalText, editedText),
      legalBasis: localLegalBasis,
      legalDetail: localLegalDetail || undefined,
    };

    onAdopt(updatedClause);
  };

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

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  };

  const isSummary = mode === 'summary';

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
            {/* Header */}
            <div className="px-8 py-5 border-b border-white/30 flex justify-between items-center bg-white/40">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-serif text-ink tracking-tight">
                    {isSummary ? '风险解读' : 'AI 合规改写'}
                  </h3>
                  <p className="text-xs text-ink-muted font-mono mt-1">审查详情: {clause?.id}</p>
                </div>
              </div>

              {/* 模式切换器 */}
              <div className="flex items-center gap-6">
                <div className="flex bg-white/60 rounded-lg p-0.5 border border-white/40">
                  <button
                    onClick={() => handleModeSwitch('summary')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isSummary
                        ? 'bg-ink text-white shadow-sm'
                        : 'text-ink-muted hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    风险解读
                  </button>
                  <button
                    onClick={() => handleModeSwitch('rewrite')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      !isSummary
                        ? 'bg-ink text-white shadow-sm'
                        : 'text-ink-muted hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    合规重写
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/50 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {clause && (
                <>
                  {/* 风险类别 */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="text-xs font-medium text-ink-muted mb-2 uppercase tracking-widest">风险类别</div>
                    {clause.violations && clause.violations.length > 1 ? (
                      <div className="space-y-2">
                        {clause.violations.map((v) => (
                          <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-white/30">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold font-mono ${
                              v.riskLevel === 'high' || v.riskLevel === '高风险'
                                ? 'bg-red-100 text-red-700'
                                : v.riskLevel === 'medium' || v.riskLevel === '中等风险'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                            }`}>
                              {v.id}
                            </span>
                            <span className="text-sm font-medium text-ink">{v.name}</span>
                            <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              v.riskLevel === 'high' || v.riskLevel === '高风险'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : v.riskLevel === 'medium' || v.riskLevel === '中等风险'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                              {v.confidence ? `${(v.confidence * 100).toFixed(1)}%` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-lg font-serif text-ink">{clause.reason}</div>
                    )}
                    {/* 模式描述 */}
                    <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                      {isSummary
                        ? '分析条款本质与潜在风险，提供专业的合规解读。'
                        : '基于法律依据生成可直接用于隐私政策的专业合规文本。'
                      }
                    </p>
                  </motion.div>

                  {/* 主内容区 — 根据模式显示不同布局 */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Sparkles className="w-4 h-4 text-[#d97757]" />
                        {isSummary ? '通俗解读' : '改写对比'}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 重新生成按钮 */}
                        <button
                          onClick={handleRegenerate}
                          disabled={isGenerating}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-ink-muted hover:text-ink hover:bg-white/50 transition-colors disabled:opacity-50"
                          title="重新生成"
                        >
                          <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                          重生成
                        </button>

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

                    {isSummary ? (
                      /* ========== 摘要模式：条款本质 + 风险分析 ========== */
                      <div className="space-y-4">
                        {/* 原文引用 */}
                        <div className="glass-card rounded-lg overflow-hidden">
                          <div className="bg-slate-50/80 px-4 py-2 border-b border-white/30">
                            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">原始条款</span>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-ink leading-relaxed">{clause.originalText}</p>
                          </div>
                        </div>

                        {/* AI 解读内容 — 结构化渲染 */}
                        {isGenerating ? (
                          <div className="glass-card rounded-lg p-6 space-y-3">
                            <div className="h-4 bg-slate-200/50 rounded animate-pulse w-full"></div>
                            <div className="h-4 bg-slate-200/50 rounded animate-pulse w-4/5"></div>
                            <div className="h-20 bg-slate-200/50 rounded animate-pulse w-full mt-4"></div>
                          </div>
                        ) : editedText ? (
                          <div className="glass-card rounded-lg overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/30 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#d97757]" />
                              <span className="text-sm font-medium text-ink">合规风险解读</span>
                              <span className="text-[10px] text-ink-muted ml-auto">AI 分析</span>
                            </div>
                            <div className="p-5 space-y-5">
                              <div
                                className="text-sm text-ink leading-relaxed space-y-4"
                                dangerouslySetInnerHTML={{ __html: localDiffHtml }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* ========== 改写模式布局：双栏对比 ========== */
                      <>
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
                                <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: localDiffHtml }} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 图例说明 — 仅改写模式 */}
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
                      </>
                    )}
                  </motion.div>

                  {/* 编辑区 — 仅改写模式显示 */}
                  {!isSummary && (
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
                              <p>正在调用 AI 模型生成整改建议...</p>
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
                  )}

                  {/* 合规依据 */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <BookOpen className="w-4 h-4 text-ink-muted" />
                      合规依据
                      {isSummary && (
                        <span className="text-[10px] font-normal text-ink-muted">(参考来源)</span>
                      )}
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
                          {localLegalDetail ? (
                            <>
                              {'\n'}
                              {'─'.repeat(40)}
                              {'\n'}
                              {localLegalDetail}
                            </>
                          ) : null}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="p-5 bg-white/40 border-t border-white/30 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 glass-card text-ink font-medium text-sm rounded-md hover:bg-white/60 transition-colors shadow-sm"
              >
                取消
              </button>
              {isSummary ? (
                /* 摘要模式：复制按钮 */
                <button
                  onClick={handleCopy}
                  disabled={isGenerating || !editedText}
                  className="flex-1 py-2.5 bg-ink/90 text-white font-medium text-sm rounded-md hover:bg-ink transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制解读'}
                </button>
              ) : (
                /* 改写模式：采纳按钮 */
                <button
                  onClick={handleAdoptClick}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 bg-ink text-white font-medium text-sm rounded-md hover:bg-ink/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  采纳并应用
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
