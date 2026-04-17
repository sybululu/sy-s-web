/**
 * 前端类型定义
 *
 * 违规相关常量（VIOLATION_NAMES, getRiskLevel, getRiskStatus）已迁移至
 * config/violation-config.ts，此处仅为向后兼容的 re-export。
 * 新代码请直接从 config/violation-config.ts 导入。
 */

// ─── 违规配置（re-export from unified config） ──────────────────>

export {
  VIOLATION_NAMES,
  VIOLATION_WEIGHTS,
  RISK_LEVEL,
  type RiskLevelType,
  getRiskLevel,
  getRiskStatus,
  getRiskColorClass,
  getRiskDotClass,
  getViolationName,
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

/** 单条违规条款 */
export interface Clause {
  id: number | string;
  originalText: string;       // 原始条款文本
  suggestedText: string;      // AI 改写建议
  reason: string;             // 违规原因（人类可读名称）
  category: number | string;  // 违规类别编号
  categoryName?: string;      // 违规类别中文名称（后端适配后优先使用）
  snippet?: string;           // 条款摘要/片段（用于搜索过滤）
  weight?: number;            // 权重
  probability?: number;       // 模型预测概率
  riskLevel?: string;         // 风险等级（高/中/低）
  location: string;           // 条款位置/来源
  legalBasis: string;         // 法律依据 (RAG 检索结果)
  diffOriginalHtml?: string;  // 原文 diff HTML
  diffSuggestedHtml?: string; // 改写对比 HTML
  isAdopted?: boolean;        // 是否已被采纳
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

/** 分析请求参数 */
export interface AnalysisRequest {
  policy_text: string;
  project_name: string;
  description?: string;
}

/** 分析响应（后端原始格式） */
export interface AnalysisResponse {
  project_id: number;
  score: number;
  total_clauses: number;
  clauses: Array<{
    id: number;
    original_text: string;
    suggested_text: string;
    indicator: string;
    violation_id: number;
    probability: number;
    weight: number;
    location: string;
    legal_basis: string;
    diff_suggested_html: string;
  }>;
}

// ─── 后端 → 前端 Clause 映射工具 ────────────────────────────────>

import { getViolationName, getRiskLevel, RISK_LEVEL } from './config/violation-config';

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
  const weight = raw.weight ?? raw.probability ?? 0;

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
    diffOriginalHtml: raw.diff_original_html ?? raw.diffOriginalHtml ?? raw.snippet ?? '',
    diffSuggestedHtml: raw.diff_suggested_html ?? raw.diffSuggestedHtml ?? `<span class="diff-add">${raw.suggestedText || raw.suggested_text || '建议修改'}</span>`,
    isAdopted: false,
  };
}

/**
 * 批量映射后端 clauses 数组
 */
export function mapRawToClauses(rawClauses: Record<string, any>[]): Clause[] {
  return rawClauses.map((raw, idx) => mapRawToClause(raw, idx));
}
