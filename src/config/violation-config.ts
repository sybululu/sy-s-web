/**
 * 违规配置统一源 (Single Source of Truth)
 *
 * 前端所有违规类型相关定义（名称、权重、风险等级、详细说明）均从此文件导入。
 * 与后端 violation_config.py 保持同步：12 类违规定义必须与论文表 3-1 一致。
 *
 * 风险等级判定（句子级别，基于权重）：
 *   - 高风险: weight >= 0.12
 *   - 中等风险: 0.08 <= weight < 0.12
 *   - 低风险: weight < 0.08
 *
 * 风险等级判定（审查级别，基于总分）：
 *   - 高风险（>=70 分存在矛盾，这里按常规理解：高风险 = 总分 < 40）
 *   - 中等风险: 40 <= 总分 < 70
 *   - 低风险: 总分 >= 70
 */

// ─── 12 类违规类型编号与中文名称映射 ──────────────────────────>
// 对应后端 violation_config.py.INDICATORS

export const VIOLATION_NAMES: Record<number, string> = {
  1: '信息收集缺乏依据',
  2: '目的限制原则违反',
  3: '数据使用超范围',
  4: '安全保障不足',
  5: '信息泄露风险',
  6: '用户权利缺失',
  7: '未成年人保护不足',
  8: '跨境传输不规范',
  9: '第三方共享不透明',
  10: '政策变更未通知',
  11: '注销机制缺陷',
  12: '算法推荐不透明',
};

// ─── 权重配置（权重之和 = 1.00） ───────────────────────────────>

export const VIOLATION_WEIGHTS: Record<number, number> = {
  1: 0.08,
  2: 0.10,
  3: 0.09,
  4: 0.11,
  5: 0.10,
  6: 0.09,
  7: 0.07,
  8: 0.08,
  9: 0.09,
  10: 0.06,
  11: 0.07,
  12: 0.06,
};

// ─── 风险等级常量 ───────────────────────────────────────────────>

export const RISK_LEVEL = {
  HIGH: '高风险' as const,
  MEDIUM: '中等风险' as const,
  LOW: '低风险' as const,
} as const;

export type RiskLevelType = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

// ─── 风险等级阈值 ───────────────────────────────────────────────>

const WEIGHT_THRESHOLD_HIGH = 0.12;
const WEIGHT_THRESHOLD_MEDIUM_LOW = 0.08;
const SCORE_THRESHOLD_LOW_RISK = 70;
const SCORE_THRESHOLD_HIGH_RISK = 40;

/**
 * 根据权重获取句子级风险等级
 */
export function getRiskLevel(weight: number): RiskLevelType {
  if (weight >= WEIGHT_THRESHOLD_HIGH) return RISK_LEVEL.HIGH;
  if (weight >= WEIGHT_THRESHOLD_MEDIUM_LOW) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.LOW;
}

/**
 * 根据总分获取审查级风险状态
 */
export function getRiskStatus(score: number): string {
  if (score >= SCORE_THRESHOLD_LOW_RISK) return '低风险';
  if (score >= SCORE_THRESHOLD_HIGH_RISK) return '中等风险';
  return '高风险';
}

/**
 * 获取风险等级对应的颜色类名
 */
export function getRiskColorClass(level: RiskLevelType | string): string {
  switch (level) {
    case RISK_LEVEL.HIGH:
    case '高风险':
      return 'text-red-700 bg-red-50/80 border-red-200/60';
    case RISK_LEVEL.MEDIUM:
    case '中等风险':
      return 'text-amber-700 bg-amber-50/80 border-amber-200/60';
    case RISK_LEVEL.LOW:
    case '低风险':
      return 'text-green-700 bg-green-50/80 border-green-200/60';
    default:
      return 'text-slate-700 bg-slate-50/80 border-slate-200/60';
  }
}

/**
 * 获取风险等级对应的 dot 颜色
 */
export function getRiskDotClass(level: RiskLevelType | string): string {
  switch (level) {
    case RISK_LEVEL.HIGH:
    case '高风险':
      return 'bg-red-500';
    case RISK_LEVEL.MEDIUM:
    case '中等风险':
      return 'bg-amber-500';
    case RISK_LEVEL.LOW:
    case '低风险':
      return 'bg-green-500';
    default:
      return 'bg-slate-400';
  }
}

// ─── 违规类型详细信息（用于详情页展示） ────────────────────────>

export interface ViolationDetailInfo {
  id: number;
  name: string;
  description: string;
  example: string;
  suggestion: string;
  weight: number;
}

export const VIOLATION_DETAILS: ViolationDetailInfo[] = [
  {
    id: 1,
    name: '信息收集缺乏依据',
    description: '隐私政策未明确说明收集用户信息的法律依据或正当理由',
    example: '“我们可能会收集您的位置信息” — 未说明法律依据和具体目的',
    suggestion: '明确列出每类信息收集的法律依据（如《个人信息保护法》第十三条），并说明具体业务场景',
    weight: 0.08,
  },
  {
    id: 2,
    name: '目的限制原则违反',
    description: '收集的信息被用于未向用户告知的其他目的',
    example: '声称“仅用于改进服务”但实际用于营销推广或数据出售',
    suggestion: '严格限定信息使用范围，超出原始目的的使用需重新获得用户单独同意',
    weight: 0.10,
  },
  {
    id: 3,
    name: '数据使用超范围',
    description: '数据处理活动超出隐私政策声明的范围',
    example: '政策声明不对外共享，但实际与关联公司全面打通用户数据',
    suggestion: '逐项审查数据处理活动，确保所有实际操作均在政策声明的范围内',
    weight: 0.09,
  },
  {
    id: 4,
    name: '安全保障不足',
    description: '未充分描述采取的技术和管理措施来保护用户信息安全',
    example: '仅笼统提及“采用安全措施”而无具体措施说明',
    suggestion: '详细列举加密存储、访问控制、安全审计、渗透测试等具体安全措施',
    weight: 0.11,
  },
  {
    id: 5,
    name: '信息泄露风险',
    description: '存在可能导致用户信息泄露的风险点且未充分披露',
    example: '未说明数据传输过程中的加密方式或第三方处理的安全责任',
    suggestion: '识别并披露潜在风险点，说明相应的缓解措施和应急响应机制',
    weight: 0.10,
  },
  {
    id: 6,
    name: '用户权利缺失',
    description: '未充分告知或保障用户的知情权、访问权、更正权、删除权等',
    example: '缺少行使权利的具体方式、响应时限或拒绝理由的说明',
    suggestion: '完整列明用户各项权利及行使方式，包括在线申请渠道、响应时间承诺',
    weight: 0.09,
  },
  {
    id: 7,
    name: '未成年人保护不足',
    description: '针对未成年人的信息处理缺乏专门的保护措施说明',
    example: '未区分成年人与未成年人，或缺少监护人同意机制',
    suggestion: '设立未成年人专属条款，说明年龄验证方式、监护人同意流程及特殊保护措施',
    weight: 0.07,
  },
  {
    id: 8,
    name: '跨境传输不规范',
    description: '个人信息跨境传输未满足法定要求或未充分告知用户',
    example: '向境外传输数据但未进行安全评估或取得用户单独同意',
    suggestion: '明确告知跨境传输的目的、接收方、涉及的信息种类，并说明已采取的合法措施',
    weight: 0.08,
  },
  {
    id: 9,
    name: '第三方共享不透明',
    description: '与第三方共享用户信息时未充分说明共享对象、范围和目的',
    example: '仅以“合作伙伴”概括共享对象，未列出具体第三方名单',
    suggestion: '分类列出共享场景、接收方类型、共享信息的种类及用户控制选项',
    weight: 0.09,
  },
  {
    id: 10,
    name: '政策变更未通知',
    description: '隐私政策变更时未建立有效的通知机制或通知方式不合理',
    example: '仅在网站角落发布更新而不主动通知用户重大变更',
    suggestion: '建立多渠道通知机制（邮件、站内信、弹窗），对重大变更设置合理缓冲期',
    weight: 0.06,
  },
  {
    id: 11,
    name: '注销机制缺陷',
    description: '账号注销流程复杂、条件苛刻或后果说明不清',
    example: '要求人工客服电话注销，或未说明注销后数据的保留期限',
    suggestion: '提供便捷的在线自助注销渠道，明确注销条件和数据保留/删除政策',
    weight: 0.07,
  },
  {
    id: 12,
    name: '算法推荐不透明',
    description: '使用自动化决策或算法推荐时未充分告知用户或提供退出选项',
    example: '存在个性化推荐但不说明算法基本原理或如何关闭',
    suggestion: '说明算法推荐的存在、基本原理及其影响，提供易于操作的关闭选项',
    weight: 0.06,
  },
];

/**
 * 根据 ID 获取违规详情
 */
export function getViolationDetailById(id: number): ViolationDetailInfo | undefined {
  return VIOLATION_DETAILS.find(d => d.id === id);
}

/**
 * 根据 ID 获取违规名称
 */
export function getViolationName(id: number | string): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return VIOLATION_NAMES[numId] || `未知违规类型(${id})`;
}
