/**
 * 违规配置统一源 (Single Source of Truth)
 *
 * ⚠️ 本文件所有定义必须与论文表 3-1 / 表 3-2 严格保持一致。
 * 后端 app.py INDICATORS 为同一套数据的 Python 版本，修改时必须同步。
 *
 * 数据来源：论文《基于NLP的隐私政策合规审查方法研究》
 *   - 表 3-1: 12项违规指示符设计（名称 + 判定依据）
 *   - 表 3-2: 12项违规指示符权重确定依据表
 *
 * 四大维度分布：
 *   - 数据收集 (I1~I4): 4项, 权重合计 0.52
 *   - 数据共享 (I5~I7): 3项, 权重合计 0.28
 *   - 数据留存 (I8~I9): 2项, 权重合计 0.10
 *   - 用户权利保障 (I10~I12): 3项, 权重合计 0.10
 *
 * 风险等级判定（句子级别，基于权重）：
 *   - 高风险: weight >= 0.12
 *   - 中等风险: 0.08 <= weight < 0.12
 *   - 低风险: weight < 0.08
 *
 * 风险等级判定（审查级别，基于总分 S = 100 - Σ(wi × 100)）：
 *   - 低风险: S >= 70
 *   - 中等风险: 40 <= S < 70
 *   - 高风险: S < 40
 */

// ─── 12 类违规类型编号与中文名称映射（论文表 3-1） ──────────>
// ID 格式统一使用 "I1" ~ "I12" 字符串，与后端 INDICATORS.id 一致

export const VIOLATION_NAMES: Record<string, string> = {
  I1: '过度收集敏感数据',
  I2: '未说明收集目的',
  I3: '未获得明示同意',
  I4: '收集范围超出服务需求',
  I5: '未明确第三方共享范围',
  I6: '未获得单独共享授权',
  I7: '未明确共享数据用途',
  I8: '未明确留存期限',
  I9: '未说明数据销毁机制',
  I10: '未明确用户权利范围',
  I11: '未提供便捷权利行使途径',
  I12: '未明确权利响应时限',
};

/** 兼容数字 key 的访问方式（旧代码过渡用） */
export const VIOLATION_NAMES_BY_NUM: Record<number, string> = {
  1: VIOLATION_NAMES.I1,
  2: VIOLATION_NAMES.I2,
  3: VIOLATION_NAMES.I3,
  4: VIOLATION_NAMES.I4,
  5: VIOLATION_NAMES.I5,
  6: VIOLATION_NAMES.I6,
  7: VIOLATION_NAMES.I7,
  8: VIOLATION_NAMES.I8,
  9: VIOLATION_NAMES.I9,
  10: VIOLATION_NAMES.I10,
  11: VIOLATION_NAMES.I11,
  12: VIOLATION_NAMES.I12,
};

// ─── 权重配置（论文表 3-2，权重之和 = 1.00） ──────────────────>

export const VIOLATION_WEIGHTS: Record<string, number> = {
  I1: 0.15,  // 过度收集敏感数据
  I2: 0.12,  // 未说明收集目的
  I3: 0.15,  // 未获得明示同意
  I4: 0.10,  // 收集范围超出服务需求
  I5: 0.08,  // 未明确第三方共享范围
  I6: 0.12,  // 未获得单独共享授权
  I7: 0.08,  // 未明确共享数据用途
  I8: 0.05,  // 未明确留存期限
  I9: 0.05,  // 未说明数据销毁机制
  I10: 0.05, // 未明确用户权利范围
  I11: 0.03, // 未提供便捷权利行使途径
  I12: 0.02, // 未明确权利响应时限
};

// ─── 合规维度分组 ───────────────────────────────────────────────>

export const DIMENSION_GROUPS = {
  data_collection: { label: '数据收集', ids: ['I1', 'I2', 'I3', 'I4'] as const },
  data_sharing: { label: '数据共享', ids: ['I5', 'I6', 'I7'] as const },
  data_retention: { label: '数据留存', ids: ['I8', 'I9'] as const },
  user_rights: { label: '用户权利保障', ids: ['I10', 'I11', 'I12'] as const },
} as const;

export type DimensionKey = keyof typeof DIMENSION_GROUPS;

// ─── 风险等级常量 ───────────────────────────────────────────────>

export const RISK_LEVEL = {
  HIGH: '高风险' as const,
  MEDIUM: '中等风险' as const,
  LOW: '低风险' as const,
} as const;

export type RiskLevelType = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

// ─── 风险等级阈值（与后端 app.py 对齐） ─────────────────────────>

/** 句子级：基于单条违规权重 */
export const WEIGHT_THRESHOLDS = {
  HIGH: 0.12,       // weight >= 0.12 → 高风险
  MEDIUM_LOW: 0.08, // 0.08 <= weight < 0.12 → 中等风险
                   // weight < 0.08 → 低风险
} as const;

/** 审查级：基于总分 */
export const SCORE_THRESHOLDS = {
  LOW_RISK: 70,     // score >= 70 → 低风险
  HIGH_RISK: 40,    // score < 40 → 高风险
                   // 40 <= score < 70 → 中等风险
} as const;

/**
 * 根据权重获取句子级风险等级
 */
export function getRiskLevel(weight: number): RiskLevelType {
  if (weight >= WEIGHT_THRESHOLDS.HIGH) return RISK_LEVEL.HIGH;
  if (weight >= WEIGHT_THRESHOLDS.MEDIUM_LOW) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.LOW;
}

/**
 * 根据总分获取审查级风险状态（与后端 app.py:321-326 对齐）
 */
export function getRiskStatus(score: number): string {
  if (score >= SCORE_THRESHOLDS.LOW_RISK) return RISK_LEVEL.LOW;
  if (score >= SCORE_THRESHOLDS.HIGH_RISK) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.HIGH;
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

// ─── 违规类型详细信息（用于详情页展示，与论文表 3-1 对齐） ──────>

export interface ViolationDetailInfo {
  id: string;           // "I1" ~ "I12"
  name: string;         // 中文名称
  dimension: DimensionKey; // 所属维度
  description: string;   // 核心检测内容
  legalBasis: string;    // 违规判定依据（法律条文）
  example: string;       // 违规示例
  suggestion: string;    // 整改建议
  weight: number;        // 权重
}

export const VIOLATION_DETAILS: ViolationDetailInfo[] = [
  {
    id: 'I1',
    name: '过度收集敏感数据',
    dimension: 'data_collection',
    description: '是否收集与服务无关的生物识别数据、金融账户、医疗健康、未成年人等敏感个人信息',
    legalBasis: '《个人信息保护法》第六条"最小必要"原则',
    example: '"我们可能会收集您的位置信息、通讯录、健康数据等以提供更好的服务" — 未区分敏感与非敏感信息，超范围收集',
    suggestion: '明确区分敏感个人信息与一般个人信息，仅收集实现功能所必需的最小范围敏感信息，并取得单独同意',
    weight: 0.15,
  },
  {
    id: 'I2',
    name: '未说明收集目的',
    dimension: 'data_collection',
    description: '是否清晰、具体披露每项数据收集的实际用途，是否存在模糊表述',
    legalBasis: '《个人信息保护法》第十七条信息披露要求',
    example: '"为提升用户体验而收集您的信息" — 目的过于模糊，未说明具体用途',
    suggestion: '逐项列明每类信息的具体收集目的和使用场景，避免"提升体验""业务需要"等笼统表述',
    weight: 0.12,
  },
  {
    id: 'I3',
    name: '未获得明示同意',
    dimension: 'data_collection',
    description: '是否通过默认勾选、捆绑服务等方式变相强制授权，未以显著方式获取用户明确同意',
    legalBasis: '《个人信息保护法》第十四条明示同意要求',
    example: '"注册即视为您已同意本政策全部条款" — 默认勾选强制授权',
    suggestion: '采用主动勾选、分场景逐项授权等方式获取明示同意，禁止默认勾选或捆绑授权',
    weight: 0.15,
  },
  {
    id: 'I4',
    name: '收集范围超出服务需求',
    dimension: 'data_collection',
    description: '是否收集与产品/服务核心功能无直接关联的非敏感个人信息',
    legalBasis: '《个人信息保护法》第六条数据收集必要性要求',
    example: '计算器App收集用户通讯录和位置信息 — 与核心功能无关',
    suggestion: '逐一评估每类信息与功能的关联性，删除非必要的信息收集项',
    weight: 0.10,
  },
  {
    id: 'I5',
    name: '未明确第三方共享范围',
    dimension: 'data_sharing',
    description: '是否未披露向第三方共享的个人信息具体类型、数量及使用场景',
    legalBasis: '《个人信息保护法》第二十三条共享信息披露要求',
    example: '"我们可能会向合作伙伴共享您的信息" — 未说明具体对象和范围',
    suggestion: '分类列出第三方接收方类型、共享信息种类、共享目的及使用场景',
    weight: 0.08,
  },
  {
    id: 'I6',
    name: '未获得单独共享授权',
    dimension: 'data_sharing',
    description: '是否在共享用户信息前未取得用户单独同意，仅以整体隐私政策替代单独同意',
    legalBasis: '《个人信息保护法》第二十三条单独同意要求',
    example: '"隐私政策中已告知将向第三方共享信息" — 以整体政策代替单独授权',
    suggestion: '向第三方提供个人信息时必须事先取得用户的单独明示同意',
    weight: 0.12,
  },
  {
    id: 'I7',
    name: '未明确共享数据用途',
    dimension: 'data_sharing',
    description: '是否未向用户告知第三方使用共享数据的具体目的，存在用途模糊/扩大情形',
    legalBasis: 'GDPR第四十六条、《个人信息保护法》第二十三条',
    example: '"允许合作伙伴用于其业务目的" — 用途范围无限扩大',
    suggestion: '明确限定第三方使用共享数据的具体目的和范围，禁止转授权或超范围使用',
    weight: 0.08,
  },
  {
    id: 'I8',
    name: '未明确留存期限',
    dimension: 'data_retention',
    description: '是否未披露数据留存的具体时长，或留存期限与服务目的实现不匹配',
    legalBasis: '《个人信息保护法》第十九条、GDPR第五条存储限制原则',
    example: '"我们将根据需要保留您的信息" — 无具体期限',
    suggestion: '按信息类别分别明确留存期限及期限届满后的处理方式',
    weight: 0.05,
  },
  {
    id: 'I9',
    name: '未说明数据销毁机制',
    dimension: 'data_retention',
    description: '是否未明确留存期限届满后，数据销毁/匿名化的具体方式、流程及责任主体',
    legalBasis: '《个人信息保护法》第四十七条数据删除要求',
    example: '仅提及"我们会删除"但未说明销毁方式和验证机制',
    suggestion: '详细说明数据销毁或匿名化的技术手段、执行流程及责任部门',
    weight: 0.05,
  },
  {
    id: 'I10',
    name: '未明确用户权利范围',
    dimension: 'user_rights',
    description: '是否未完整告知用户查询、更正、删除、撤回同意、解释说明等法定权利',
    legalBasis: '《个人信息保护法》第四十四条至第四十八条用户权利相关规定',
    example: '仅提到"您可以联系我们"但未列举具体权利项目',
    suggestion: '完整列明用户享有的各项法定权利及其简要说明',
    weight: 0.05,
  },
  {
    id: 'I11',
    name: '未提供便捷权利行使途径',
    dimension: 'user_rights',
    description: '是否未设置在线申请、客服对接等简易渠道，存在繁琐流程阻碍用户行使权利',
    legalBasis: '《个人信息保护法》第五十条权利行使便捷性要求',
    example: '仅提供邮寄地址作为唯一联系方式，需用户自行打印填写表格',
    suggestion: '提供在线自助渠道（如账户设置页面）+ 客服热线 + 邮箱等多通道',
    weight: 0.03,
  },
  {
    id: 'I12',
    name: '未明确权利响应时限',
    dimension: 'user_rights',
    description: '是否未披露收到用户权利行使申请后完成处理并反馈结果的具体时限',
    legalBasis: '《个人信息安全规范》(GB/T 35273-2020) 第7.10条规定，处理者应在15个工作日内响应',
    example: '仅说"我们会尽快处理"而无具体时间承诺',
    suggestion: '明确承诺权利请求的响应时限（建议不超过15个工作日）及超时救济渠道',
    weight: 0.02,
  },
];

/**
 * 根据 ID 获取违规详情（支持 "I1" 格式和数字格式）
 */
export function getViolationDetailById(id: string | number): ViolationDetailInfo | undefined {
  const strId = typeof id === 'string' ? id : `I${id}`;
  return VIOLATION_DETAILS.find(d => d.id === strId);
}

/**
 * 根据 ID 获取违规名称（支持 "I1" 格式和数字格式）
 */
export function getViolationName(id: string | number): string {
  if (typeof id === 'string') {
    // 尝试直接匹配 I1~I12
    if (VIOLATION_NAMES[id]) return VIOLATION_NAMES[id];
    // 尝试去掉前缀 I 再匹配
    const num = parseInt(id.replace(/^I/i, ''), 10);
    if (!isNaN(num) && VIOLATION_NAMES_BY_NUM[num]) return VIOLATION_NAMES_BY_NUM[num];
    return `未知违规类型(${id})`;
  }
  return VIOLATION_NAMES_BY_NUM[id] || `未知违规类型(${id})`;
}

/**
 * 根据 ID 获取权重（支持 "I1" 格式和数字格式）
 */
export function getViolationWeight(id: string | number): number {
  const strId = typeof id === 'string' ? id : `I${id}`;
  return VIOLATION_WEIGHTS[strId] || 0;
}
