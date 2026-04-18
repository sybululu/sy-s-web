/**
 * 前端类型定义
 *
 * 违规相关常量已迁移至 config/violation-config.ts，此处仅为向后兼容的 re-export。
 * 新代码请直接从 config/violation-config.ts 导入。
 */

// ─── 违规配置（re-export from unified config） ──────────────────>

export {
  VIOLATION_NAMES,
  VIOLATION_WEIGHTS,
  RISK_LEVEL,
  type RiskLevelType,
  DIMENSION_GROUPS,
  type DimensionKey,
  WEIGHT_THRESHOLDS,
  SCORE_THRESHOLDS,
  getRiskLevel,
  getRiskStatus,
  getRiskColorClass,
  getRiskDotClass,
  getViolationName,
  getViolationDetailById,
  getViolationWeight,
  type ViolationDetailInfo,
  VIOLATION_DETAILS,
} from './config/violation-config';

// ─── 业务类型定义 ───────────────────────────────────────────────>

/** 视图类型 */
export type ViewType = 'overview' | 'new-task' | 'details' | 'history';

/** Toast 状态 */
export interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: number;
  email: string;
  username: string;
  /** 后端可能返回 name 而非 username，两者兼容 */
  name?: string;
}

/** 单条违规条款（聚合模式：同一句子的多个违规合并为一行） */
export interface Clause {
  id: number | string;
  originalText: string;       // 原始条款文本（即触发违规的句子）
  suggestedText: string;      // AI 改写建议
  reason: string;             // 违规原因（人类可读名称，多违规时逗号分隔）
  category: number | string;  // 违规类别编号（多违规时取第一个）
  categoryName?: string;      // 违规类别中文名称（多违规时逗号分隔）
  snippet?: string;           // 条款摘要/片段（用于搜索过滤）
  weight?: number;            // 权重（多违规时取最高）
  probability?: number;       // 模型预测概率（多违规时取最高）
  riskLevel?: string;         // 风险等级（多违规时取最高：高>中>低）
  location: string;           // 条款位置/来源
  legalBasis: string;         // 法律依据引用（多违规时逗号分隔）
  legalDetail?: string;      // 法律依据完整条文正文（RAG 检索结果）
  diffOriginalHtml?: string;  // 原文 diff HTML
  diffSuggestedHtml?: string; // 改写对比 HTML
  isAdopted?: boolean;        // 是否已被采纳
  /** 聚合模式下包含的所有违规明细 */
  violations?: Array<{
    id: string;
    name: string;
    riskLevel: string;
    confidence: number;
    legalBasis: string;
    legalDetail?: string;
    /** 该违规类型关联的多条法律依据（RAG 检索结果） */
    legalReferences?: Array<{ law: string; article: string; reference: string; content: string }>;
  }>;
}

/** 审查项目 */
export interface Project {
  id: number;
  name: string;
  description: string;
  date: string;
  score: number;
  riskStatus: string;
  clauseCount: number;
  clauses: Clause[];
  policyText?: string;
}

// ─── 后端 → 前端 Clause 映射工具 ────────────────────────────────>

import { getViolationName, getViolationWeight, getRiskLevel } from './config/violation-config';

/**
 * 将后端返回的原始 clause 对象映射为前端 Clause 类型
 *
 * 统一字段映射逻辑，消除 handleSelectProject / handleStartAnalysis 中的重复代码
 *
 * @param raw - 后端返回的 clause 原始对象（字段名可能为 camel_case 或 camelCase）
 * @param index - 可选的序号，用于生成 id 和默认 location
 */
export function mapRawToClause(raw: Record<string, any>, index?: number): Clause {
  const categoryId = raw.violation_id ?? raw.category ?? 0;
  // 优先使用后端返回的 weight，否则根据 violation_id 从权威配置中查找
  const rawWeight = raw.weight ?? raw.probability;
  const weight = rawWeight ?? getViolationWeight(categoryId);

  return {
    id: raw.id ?? `CL-${Math.floor(Math.random() * 9000) + 1000}`,
    originalText: raw.original_text ?? raw.originalText ?? raw.snippet ?? '',
    suggestedText: raw.suggested_text ?? raw.suggestedText ?? '【系统建议】请根据合规要求修改。',
    reason: raw.indicator ?? raw.reason ?? getViolationName(categoryId),
    category: categoryId,
    categoryName: raw.category_name ?? raw.indicator ?? getViolationName(categoryId),
    snippet: raw.snippet ?? raw.original_text ?? raw.originalText ?? '',
    weight: weight,
    probability: raw.probability ?? weight,
    riskLevel: raw.risk_level ?? getRiskLevel(weight),
    location: raw.location ?? `第${(index ?? 0) + 1}节`,
    legalBasis: raw.legal_basis ?? raw.legalBasis ?? '',
    legalDetail: raw.legal_detail ?? raw.legalDetail ?? undefined,
    diffOriginalHtml: raw.diff_original_html ?? raw.diffOriginalHtml ?? raw.snippet ?? '',
    diffSuggestedHtml: raw.diff_suggested_html ?? raw.diffSuggestedHtml ?? `<span class="diff-add">${raw.suggestedText || raw.suggested_text || '建议修改'}</span>`,
    isAdopted: false,
  };
}

/** 风险等级优先级（用于聚合时取最高） */
const RISK_PRIORITY: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };

/**
 * 批量映射后端 clauses 数组
 *
 * 聚合模式：同一句子触发的多个违规合并为一条 Clause，
 * 风险类别、等级、法律依据等均聚合展示。
 */
export function mapRawToClauses(rawClauses: Record<string, any>[]): Clause[] {
  // 按 snippet 分组
  const grouped = new Map<string, Record<string, any>[]>();
  rawClauses.forEach((raw) => {
    const key = raw.snippet ?? raw.original_text ?? raw.originalText ?? '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(raw);
  });

  return Array.from(grouped.entries()).map(([snippet, group], idx) => {
    const first = group[0];
    // 为每条原始记录构建 violation 明细
    const violations = group.map((raw) => {
      const catId = raw.violation_id ?? raw.category ?? 0;
      const w = raw.weight ?? raw.probability ?? getViolationWeight(catId);
      return {
        id: String(catId),
        name: raw.indicator ?? getViolationName(catId),
        riskLevel: raw.risk_level ?? getRiskLevel(w),
        confidence: raw.probability ?? w,
        legalBasis: raw.legal_basis ?? '',
        legalDetail: raw.legal_detail ?? undefined,
        legalReferences: (raw.legal_references as Array<{law: string; article: string; reference: string; content: string}>) || [],
      };
    });

    // 取最高风险等级
    const highestRisk = violations.reduce((best, v) =>
      (RISK_PRIORITY[v.riskLevel] || 0) > (RISK_PRIORITY[best] || 0) ? v.riskLevel : best, 'low');

    // 取最高概率/权重
    const maxProb = Math.max(...violations.map(v => v.confidence));

    return {
      id: first.id ?? `CL-${Math.floor(Math.random() * 9000) + 1000}`,
      originalText: snippet,
      suggestedText: first.suggested_text ?? first.suggestedText ?? '【系统建议】请根据合规要求修改。',
      reason: violations.map(v => v.name).join('、'),
      category: violations[0].id,
      categoryName: violations.map(v => `${v.id} ${v.name}`).join('、'),
      snippet: snippet,
      weight: maxProb,
      probability: maxProb,
      riskLevel: highestRisk,
      location: first.location ?? `第${idx + 1}节`,
      legalBasis: violations.map(v => v.legalBasis).filter(Boolean).join('；'),
      legalDetail: violations.map(v => v.legalDetail).filter(Boolean).join('\n\n') || undefined,
      diffOriginalHtml: first.diff_original_html ?? first.diffOriginalHtml ?? snippet,
      diffSuggestedHtml: first.diff_suggested_html ?? first.diffSuggestedHtml ?? `<span class="diff-add">${first.suggestedText || first.suggested_text || '建议修改'}</span>`,
      isAdopted: false,
      violations,
    };
  });
}
