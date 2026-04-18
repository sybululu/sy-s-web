# 隐私政策合规审查系统 — 完整工作流与接口文档

> **版本**: v2.0 (RAG 全库检索 + 句子聚合展示)
> **最后更新**: 2026-02-08
> **适用范围**: 前端 `sy-s-web` + 后端 `sy-s-web-backend` 全链路

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [核心数据模型](#2-核心数据模型)
3. [功能性工作流](#3-功能性工作流)
   - 3.1 [用户认证流程](#31-用户认证流程)
   - 3.2 [文本输入与预处理](#32-文本输入与预处理)
   - 3.3 [RoBERTa 分类推理](#33-roberta-分类推理)
   - 3.4 [11类→12类映射](#34-11类12类映射)
   - 3.5 [RAG 法律知识库检索](#35-rag-法律知识库检索)
   - 3.6 [评分与风险等级计算](#36-评分与风险等级计算)
   - 3.7 [Phi-4 整改建议生成](#37-phi-4-整改建议生成)
   - 3.8 [前端聚合展示](#38-前端聚合展示)
4. [前后端接口清单](#4-前后端接口清单)
5. [数据流转全链路图](#5-数据流转全链路图)

---

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户浏览器 (前端)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Login   │ │ NewTask  │ │ Details  │ │  Drawer  │ │ History │ │
│  │ Register │ │(输入/上传)│ │(表格展示)│ │(整改面板)│ │(历史)   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │            │             │       │
│  ┌────▼────────────▼────────────▼────────────▼─────────────▼────┐  │
│  │              api.ts (统一请求层)                               │  │
│  │  • JWT Token 注入  • 超时控制(60s)  • 401 自动跳转           │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ HTTPS / CORS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI 后端服务                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    认证中间件 (auth.py)                       │   │
│  │  HTTPBearer → JWT decode → DB 查询 User → Depends 注入      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────────────┐   │
│  │ RoBERTa  │  │ RAG 引擎  │  │     Phi-4 LLM (三模式)        │   │
│  │ 分类模型  │  │ FAISS    │  │  github / local / hf          │   │
│  │ 11类输出  │  │ 141条法律│  │  整改建议生成                  │   │
│  └──────────┘  └──────────┘  └────────────────────────────────┘   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────────────┐   │
│  │ SQLite   │  │ 知识库    │  │     violation_config.py        │   │
│  │ users/   │  │ JSON文件  │  │  12类指标体系(唯一权威源)      │   │
│  │ projects │  │ laws/    │  │  权重/提示语/法律依据          │   │
│  └──────────┘  └──────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 技术栈分层

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 19 + TypeScript + Vite | SPA 单页应用 |
| **UI 组件** | Tailwind CSS + Motion (Framer Motion) | 动画+样式 |
| **后端框架** | FastAPI (Python) + Pydantic | RESTful API |
| **数据库** | SQLite (SQLAlchemy ORM) | users / projects 表 |
| **分类模型** | RoBERTa-wwm-ext (自定义 CustomBertMoeModel) | 11 类多标签分类 |
| **嵌入模型** | paraphrase-multilingual-MiniLM-L12-v2 | 向量化用于 RAG |
| **向量检索** | FAISS (IndexFlatIP + 余弦相似度) | 141 条法律语义检索 |
| **生成模型** | Phi-4 Mini Instruct (GitHub Models API) | 整改建议 |
| **认证** | JWT (HS256) + bcrypt 密码哈希 | 无状态 Token |

---

## 2. 核心数据模型

### 2.1 后端违规指标体系 (`violation_config.py`) — 唯一权威数据源

```
INDICATORS = {
    "过度收集敏感数据":     { id: "I1", weight: 0.15, risk: "high" },
    "未说明收集目的":       { id: "I2", weight: 0.12, risk: "high" },
    "未获得明示同意":       { id: "I3", weight: 0.15, risk: "high" },
    "收集范围超出服务需求": { id: "I4", weight: 0.10, risk: "medium"},
    "未明确第三方共享范围": { id: "I5", weight: 0.08, risk: "medium"},
    "未获得单独共享授权":   { id: "I6", weight: 0.12, risk: "high" },
    "未明确共享数据用途":   { id: "I7", weight: 0.08, risk: "medium"},
    "未明确留存期限":       { id: "I8", weight: 0.05, risk: "low"   },
    "未说明数据销毁机制":   { id: "I9", weight: 0.05, risk: "low"   },
    "未明确用户权利范围":   { id: "I10",weight: 0.05, risk: "low"   },
    "未提供便捷权利行使途径":{id: "I11",weight: 0.03, risk: "low"   },
    "未明确权利响应时限":   { id: "I12",weight: 0.02, risk: "low"   },
}
// 权重总和 = 1.00
```

**四大维度分组**:

| 维维 | 违规 ID | 权重合计 |
|------|---------|----------|
| 数据收集 | I1, I2, I3, I4 | 0.52 |
| 数据共享 | I5, I6, I7 | 0.28 |
| 数据留存 | I8, I9 | 0.10 |
| 用户权利保障 | I10, I11, I12 | 0.10 |

### 2.2 前端 Clause 类型 (`types.ts`)

```typescript
interface Clause {
  id: number | string;
  originalText: string;         // 触发违规的原始句子
  suggestedText: string;        // AI 改写建议（rewrite 模式）
  reason: string;               // 违规原因（多违规时逗号分隔，如"I1 过度收集、I3 未获同意"）
  category: number | string;    // 违规 ID（多违规取第一个）
  categoryName?: string;        // 违规名称（多违规逗号分隔）
  snippet?: string;             // 同 originalText（用于搜索过滤）
  weight?: number;              // 最高概率值
  probability?: number;         // 同 weight
  riskLevel?: string;           // 最高风险等级 (high/medium/low)
  location: string;             // 条款位置（如"第3节"）
  legalBasis: string;           // 法律引用（多条用"；"分隔）
  legalDetail?: string;         // 完整法律条文正文
  isAdopted?: boolean;          // 是否已采纳整改
  /** 聚合模式：同一句子的所有违规明细 */
  violations?: Array<{
    id: string;                 // 如 "I1"
    name: string;               // 如 "过度收集敏感数据"
    riskLevel: string;
    confidence: number;         // 模型置信概率
    legalBasis: string;
    legalDetail?: string;
    legalReferences?: Array<{ law: string; article: string; reference: string; content: string }>;
  }>;
}
```

### 2.3 后端 analyze 接口响应结构

```json
{
  "id": "p1739006400",
  "name": "审查-20260208",
  "score": 45.5,
  "risk_level": "中等风险",
  "violations": [
    {
      "indicator": "过度收集敏感数据",
      "violation_id": "I1",
      "snippet": "我们会收集您的位置信息、通讯录和健康数据...",
      "legal_basis": "《个人信息保护法》第六条；网络安全法第四十一条",
      "legal_detail": "处理个人信息应当具有合理目的...（截断版）",
      "legal_references": [
        {"law": "个人信息保护法", "article": "第六条", "reference": "《个人信息保护法》第六条", "content": "完整条文内容..."}
      ],
      "confidence": 0.8234
    }
  ],
  "sentence_results": [
    {
      "index": 1,
      "sentence": "我们会收集您的位置信息、通讯录和健康数据...",
      "class_name": "数据收集",
      "max_class_idx": 0,
      "max_prob": 0.85,
      "confidence": 3.42,
      "raw_probs": [0.12, 0.85, 0.03, ...],  // 11个值
      "detected_violations": ["I1", "I4"]
    }
  ]
}
```

---

## 3. 功能性工作流

### 3.1 用户认证流程

#### 3.1.1 注册 (`POST /api/v1/auth/register`)

```
前端 (Register.tsx)                     后端 (auth.py)
─────────────────                       ─────────────────
1. 用户填写 email/password/name
2. POST /api/v1/auth/register
   Body: { email, password, name }
         │
         ▼
3. 验证邮箱是否已注册 ──── 已存在 ──→ 400 "邮箱已注册"
         │
         ▼ 未存在
4. bcrypt hash 密码
5. 创建 User 记录写入 SQLite
6. 返回 200 { message: "注册成功", user_id }
         │
         ▼
7. 切换到登录视图
```

**关键代码路径**: `auth.py:register()` → `get_password_hash()` (bcrypt) → `db.add(user)` → `db.commit()`

#### 3.1.2 登录 (`POST /api/v1/auth/login`)

```
前端 (Login.tsx)                        后端 (auth.py)
────────────────                        ─────────────────
1. 用户输入 email/password
2. POST /api/v1/auth/login
   Body: { email, password }
         │
         ▼
3. 按 email 查询 User ──── 不存在 ──→ 401 "邮箱或密码错误"
         │ 存在
         ▼
4. bcrypt.verify(plain, hashed)
         │ 不匹配
         └──────────────────────→ 401 "邮箱或密码错误"
         │ 匹配
         ▼
5. 更新 last_login 时间戳
6. 生成 JWT Token (HS256, 24h 有效期)
   Payload: { sub: user_id, exp: now+24h }
7. 返回 200 { token, user: { id, email, name } }
         │
         ▼
8. 前端存储 token/user 到 localStorage
9. 设置 isLoggedIn=true, 切换到 overview
```

**Token 使用方式**: 所有后续 API 请求通过 `api.ts` 的 `getAuthHeaders()` 自动注入:
```typescript
headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`
```

#### 3.1.3 请求鉴权 (依赖注入)

所有需认证的接口使用 FastAPI 依赖注入:
```python
async def analyze(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),  # ← 自动鉴权
    db: Session = Depends(get_db)
):
```

`get_current_user()` 流程:
1. 从 `HTTPBearer` 提取 credentials
2. `jwt.decode(token, SECRET_KEY)` 解析 payload
3. 取出 `sub`(user_id), 查询 DB 验证用户存在
4. 返回 User 对象 / 或抛出 401

---

### 3.2 文本输入与预处理

#### 3.2.1 三种输入模式

| 输入来源 | 前端组件 | 后端接口 | 处理方式 |
|---------|---------|---------|---------|
| **直接粘贴文本** | NewTask 文本框 | 直接传给 `/analyze` | 无需预处理 |
| **上传文件** | NewTask 文件拖拽区 | `POST /upload` | 读取文件内容返回 `{ text }` |
| **URL 抓取** | NewTask URL 输入框 | `POST /fetch-url` | requests.get + BeautifulSoup 提取正文 |

#### 3.2.2 文件上传处理 (`POST /api/v1/upload`)

```
前端                                    后端 (app.py)
─────                                   ──────────
1. 选择 .txt/.md/.json/.csv 文件
   校验: 格式 + 大小 ≤20MB
         │
2. FormData { file: FileObject }
   POST /api/v1/upload
         │
         ▼
3. await file.read()  → bytes
4. content.decode('utf-8', errors='ignore')
5. 返回 { text: "文件全文内容..." }
         │
         ▼
6. 将 text 传入 analyze 流程
```

#### 3.2.3 URL 抓取处理 (`POST /api/v1/fetch-url`)

```
前端                                    后端 (app.py)
─────                                   ──────────
1. 输入 URL (如 https://example.com/privacy)
         │
2. POST /api/v1/fetch-url
   Body: { url: "..." }
         │
         ▼
3. requests.get(url, timeout=10)
4. BeautifulSoup(response.text, 'html.parser')
5. soup.get_text(separator='\n', strip=True)
6. 返回 { text: "提取的纯文本..." }
         │
         ▼
7. 将 text 传入 analyze 流程
```

#### 3.2.4 句子分割 (`split_into_sentences`)

文本进入分析前，先按句子切分:

```python
def split_into_sentences(text: str) -> List[str]:
    sentences = re.split(r'[。；\n]+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 5]
    # 过滤掉长度 ≤5 字符的短句（通常是无意义片段）
```

**示例**:
```
输入: "我们收集您的位置信息。同时也会获取通讯录；此外还读取健康数据。"
输出: [
  "我们收集您的位置信息",        # sentence[0]
  "同时也会获取通讯录",          # sentence[1]
  "此外还读取健康数据",          # sentence[2]
]
```

---

### 3.3 RoBERTa 分类推理

这是系统的核心检测引擎，对每个句子独立执行。

#### 3.3.1 模型加载 (`CustomBertMoeModel`)

```
启动时一次性加载 (app.py 顶层代码):
│
├─ 1. AutoTokenizer.from_pretrained("hfl/chinese-roberta-wwm-ext")
│     → 中文 RoBERTa 分词器
│
├─ 2. hf_hub_download("sybululu/bert-moe", "multi_classification_bertmoe.ckpt")
│     → 从 HuggingFace Hub 下载训练好的 checkpoint (HF_TOKEN 用于下载)
│
├─ 3. load_trained_model(ckpt_path)
│     ├─ 创建 CustomBertMoeModel():
│     │   ├─ self.bert = BertModel("hfl/chinese-roberta-wwm-ext")  // 768 维
│     │   └─ self.fc = nn.Linear(768, 11)                         // 11 类分类头
│     │
│     ├─ torch.load(ckpt_path, map_location="cpu", weights_only=True)
│     │
│     └─ 移除 "model." 前缀 → model.load_state_dict(cleaned, strict=True)
│        → 加载训练时的权重到 fc 层
│
└─ 4. model.eval()  // 切换到评估模式（关闭 Dropout）
```

> **为什么需要 CustomBertMoeModel?**
> 训练代码中分类层命名为 `self.fc`（非标准库的 `self.classifier`），因此必须自定义模型结构来匹配 checkpoint 的键名空间。如果使用标准的 `AutoModelForSequenceClassification`，会因键名不匹配而报错。

#### 3.3.2 单句预测流程 (`roberta_predict`)

```
输入: sentence = "我们会收集您的位置信息、通讯录和健康数据以提供更好的服务"
         │
         ▼
┌─ Step 1: Tokenization ──────────────────────────────────────┐
│ tokenizer_roberta(sentence,                                  │
│   return_tensors="pt",                                      │
│   truncation=True,                                          │
│   max_length=150                                            │
│ )                                                           │
│ → input_ids: [101, 2769, 3158, ..., 102]  (≤150 tokens)    │
│ → attention_mask: [1, 1, 1, ..., 1]                         │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Step 2: 模型推理 ──────────────────────────────────────────┐
│ with torch.no_grad():                                       │
│   outputs = model_roberta(**inputs)                         │
│                                                              │
│ CustomBertMoeModel.forward():                                │
│   outputs = self.bert(input_ids, attention_mask)             │
│   pooled_output = outputs.pooler_output  # [batch, 768]     │
│   return self.fc(pooled_output)           # [batch, 11]     │
│                                                              │
│ → logits: tensor([ -1.2,  3.5, -0.8,  0.3,                │
│                   -2.1, -1.5,  0.1, -0.9,                  │
│                    1.0, -0.3, -1.8])  ← 11 个原始 logit 值  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Step 3: Sigmoid 概率转换 ─────────────────────────────────┐
│ probs = torch.sigmoid(logits).tolist()                      │
│                                                              │
│ → [0.23, 0.97, 0.31, 0.57, 0.11,                          │
│    0.18, 0.52, 0.29, 0.73, 0.43, 0.14]  ← 11个概率值(0~1) │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Step 4: 置信度计算 ────────────────────────────────────────┐
│ sorted_logits = [3.5, 1.0, 0.3, 0.1, -0.3, ...] (降序)    │
│ confidence = sorted[0] - sorted[1] = 3.5 - 1.0 = 2.5       │
│ （logits 最高值与次高值的差值，越大表示模型越确信）           │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Step 5: 11类→12类映射 (map_to_12_classes) ─────────────────┐
│ 输入: probs=[0.23, 0.97, 0.31, 0.57, 0.11,                 │
│               0.18, 0.52, 0.29, 0.73, 0.43, 0.14]          │
│       confidence=2.5                                         │
│                                                              │
│ max_idx = 1 (概率最高: 0.97)                                 │
│ max_prob = 0.97                                             │
│                                                              │
│ 双重阈值检查:                                                │
│   CONFIDENCE_THRESHOLD = 2.0                                │
│   PROB_THRESHOLD = 0.6                                      │
│   2.5 >= 2.0 ✓  且  0.97 >= 0.6 ✓  → 通过阈值              │
│                                                              │
│ ID_MAPPING[1] = ["I3"]                                      │
│ → detected_ids = ["I3"]  (未获得明示同意)                    │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
返回结果字典:
{
  "mapped": {"I3": 0.97},          // 映射后的违规 ID 及概率
  "raw_probs": [0.23, 0.97, ...],  // 11 类原始 sigmoid 概率
  "max_class_idx": 1,              // 最高概率类别索引 (权限获取)
  "max_prob": 0.97,                // 最高类别概率值
  "confidence": 2.5,               // 置信度 (logits 差值)
  "class_name": "权限获取",         // 最高类别中文名
}
```

#### 3.3.3 RoBERTa 11 类原始类别定义

| 索引 | 类别名称 | 映射目标违规 ID | 说明 |
|------|---------|----------------|------|
| 0 | 数据收集 | **I1**, I4 | 过度收集 + 范围超出 |
| 1 | 权限获取 | **I3** | 未获得明示同意 |
| 2 | 共享转让 | **I5**, **I6**, **I7** | 第三方范围 + 单独授权 + 共享用途 |
| 3 | 使用目的 | **I2** | 未说明目的 |
| 4 | 存储方式 | **I8** | 留存期限 |
| 5 | 安全销毁 | **I9** | 销毁机制 |
| 6 | 特殊人群 | **I3** | (复用 I3) |
| 7 | 权限管理 | **I10**, **I12** | 用户权利 + 响应时限 |
| 8 | 联系方式 | **I11** | 行使途径 |
| 9 | 政策变更 | **I11** | (复用 I11) |
| 10 | 停止运营 | **I9** | (复用 I9) |

---

### 3.4 11类→12类映射 (`mapper.py`)

#### 3.4.1 映射规则详解

```python
ID_MAPPING = {
    0: ["I1", "I4"],            # 数据收集 → 过度收集(I1) + 范围超出(I4)
    1: ["I3"],                  # 权限获取 → 未获明示同意(I3)
    2: ["I5", "I6", "I7"],      # 共享转让 → 第三方范围(I5)+单独授权(I6)+共享用途(I7)
    3: ["I2"],                  # 使用目的 → 未说明目的(I2)
    4: ["I8"],                  # 存储方式 → 留存期限(I8)
    5: ["I9"],                  # 安全措施 → 销毁机制(I9)
    6: ["I3"],                  # 特殊人群 → 未获明示同意(I3) [复用]
    7: ["I10", "I12"],          # 权限管理 → 用户权利(I10)+响应时限(I12)
    8: ["I11"],                 # 联系方式 → 行使途径(I11)
    9: ["I11"],                 # 政策变更 → 行使途径(I11) [复用]
    10: ["I9"],                 # 停止运营 → 销毁机制(I9) [复用]
}
```

#### 3.4.2 双重阈值过滤机制

```python
def map_to_12_classes(probs, confidence=None):
    # 1. 找到概率最高的类别
    max_idx = probs.index(max(probs))
    max_prob = probs[max_idx]

    # 2. 双重阈值检查（必须同时满足才触发违规标记）
    if confidence is not None:
        CONFIDENCE_THRESHOLD = 2.0    # logits 差值 ≥ 2.0
        PROB_THRESHOLD = 0.6          # 最大概率 ≥ 0.6
        if confidence < CONFIDENCE_THRESHOLD or max_prob < PROB_THRESHOLD:
            return []  # 不满足任一条件 → 无违规（静默跳过）

    # 3. 多标签映射：一个原始类别可对应多个违规 ID
    target = ID_MAPPING.get(max_idx)
    return target if target else []
```

**阈值调优记录**:
- `CONFIDENCE_THRESHOLD`: 原 3.0 → 现 **2.0**（降低以提高检出率）
- `PROB_THRESHOLD`: 固定 **0.6**

---

### 3.5 RAG 法律知识库检索

RAG (Retrieval-Augmented Generation) 是系统从硬编码法律条文升级为动态语义检索的核心模块。

#### 3.5.1 架构层次

```
┌──────────────────────────────────────────────────────────────┐
│                    RAG 初始化流程                             │
│                                                               │
│  app.py startup_event()                                      │
│    └─→ initialize_rag()                                     │
│         ├─→ Config (config.py)                               │
│         │    knowledge_dir = "./knowledge"                   │
│         │    embedding_model = "paraphrase-multilingual-..." │
│         │                                                   │
│         ├─→ LegalKBLoader (loader/legal_kb_loader.py)        │
│         │    ├── load_all()                                  │
│         │    │   ├── _load_laws_from_dir("knowledge/laws/")  │
│         │    │   │   └─ 解析 *.json → LawDocument → Article[]│
│         │    │   ├── _load_laws_from_dir("knowledge/custom_")│
│         │    │   ├── _load_mappings() → violation_mapping.json│
│         │    │   └─ _build_violation_index()                │
│         │    └─ 结果: LoadedKnowledge { articles, laws,... } │
│         │                                                   │
│         ├─→ VectorStore (store/vector_store.py)              │
│         │    ├── restore() 尝试从磁盘恢复 vector_store/      │
│         │    │   ├─ index.faiss (FAISS 索引文件)             │
│         │    │   └─ chunks.pkl (元数据 pickle)               │
│         │    └─ 若恢复失败:                                   │
│         │        └─ initialize(articles)                     │
│         │            ├─ SentenceTransformer.encode(texts)    │
│         │            ├─ faiss.normalize_L2(embeddings)       │
│         │            └─ IndexFlatIP(dimension).add_with_ids  │
│         │                                                   │
│         └─→ Retriever (search/retriever.py)                  │
│              └─ 组合 loader + vector_store                    │
└──────────────────────────────────────────────────────────────┘
```

#### 3.5.2 知识库数据结构

**目录结构**:
```
knowledge/
├── laws/                          # 内置法律
│   ├── pipl.json                  # 个人信息保护法 (~47条)
│   ├── dsl.json                   # 数据安全法 (~30条)
│   ├── csl.json                   # 网络安全法 (~30条)
│   └── gb_35273.json             # GB/T 35273-2020 (~34条)
├── custom_laws/                   # 自定义法律（扩展用）
└── mapping/
    └── violation_mapping.json     # 违规类型→法律条款映射配置

vector_store/                      # 运行时自动生成
├── index.faiss                    # FAISS 向量索引
└── chunks.pkl                     # 条款元数据
```

**Article 数据模型** (`models.py`):
```python
class Article(BaseModel):
    article_id: str       # 如 "PIPL-006" (法律缩写-序号)
    article_number: str   # 如 "第六条"
    title: str            # 如 "处理个人信息的基本原则"
    content: str          # 法律条文完整原文
    keywords: List[str]   # 如 ["最小必要", "目的明确"]
    violation_types: List[str]  # 关联的违规类型, 如 ["I1", "I4"]
```

**知识库规模**: 约 **141 条**法律条文（PIPL 47 + DSL 30 + CSL 30 + GB/T 34）

#### 3.5.3 全库语义检索策略 (核心改进)

**旧策略（已废弃）**: 按 `violation_types` 字段硬过滤 → 只在预标注的同类别条文中检索 → 容易漏检

**新策略（当前）**: 全库自由语义检索 → 在全部 141 条中按相似度排序 → 覆盖面最大

```
调用链:
get_legal_basis_from_rag(violation_type="I1", context=sentence)
    │
    ▼
retriever.retrieve_by_violation_type(violation_type="I1", context=sentence, top_k=5)
    │
    ▼
vector_store.search_by_violation(violation_type="I1", context=sentence, top_k=5)
    │
    ├─ Step 1: 构建查询文本
    │   query = f"{context} {get_violation_keywords('I1')}"
    │   例: "我们会收集您的位置信息和通讯录... 过度收集 敏感数据 最小必要 超范围收集"
    │
    ├─ Step 2: 向量编码
    │   query_embedding = SentenceTransformer.encode([query])
    │   faiss.normalize_L2(query_embedding)
    │
    ├─ Step 3: FAISS 相似度搜索 (全库 141 条, 不过滤)
    │   scores, indices = index.search(query_embedding, top_k * 2)
    │   → 返回按余弦相似度降序排列的 top_k 条结果
    │
    └─ Step 4: 转换为 SearchResult 结构
        → law_reference = "《个人信息保护法》第六条"
        → content = 完整条文正文
```

**违规关键词增强表** (`vector_store.py:_get_violation_keywords`):

| 违规 ID | 检索关键词 |
|---------|-----------|
| I1 | 过度收集 敏感数据 最小必要 超范围收集 |
| I2 | 收集目的 未说明 目的不明确 |
| I3 | 明示同意 未获得同意 捆绑授权 |
| I4 | 超出服务需求 收集范围 过度 |
| I5 | 第三方共享 未告知 接收方 |
| I6 | 单独同意 第三方共享授权 |
| I7 | 共享用途 数据用途 不明确 |
| I8 | 留存期限 存储期限 未明确 |
| I9 | 销毁机制 数据删除 匿名化 |
| I10 | 用户权利 知情权 更正权 删除权 |
| I11 | 权利行使途径 渠道 便捷 |
| I12 | 响应时限 处理期限 时间 |

#### 3.5.4 RAG 返回数据结构

```python
# get_legal_basis_from_rag() 返回值
{
    "reference": "《个人信息保护法》第六条；网络安全法第四十一条",
    # 逗号分隔格式，用于简洁展示

    "references": [
        {
            "law": "个人信息保护法",
            "article": "第六条",
            "reference": "《个人信息保护法》第六条",
            "content": "处理个人信息应当具有合法、正当、必要目的..."  # 完整正文
        },
        {
            "law": "网络安全法",
            "article": "第四十一条",
            "reference": "《网络安全法》第四十一条",
            "content": "网络运营者收集、使用个人信息..."  # 完整正文
        }
    ],
    # 结构化列表，每条含完整 content（给前端展示用）

    "content": "处理个人信息应当具有合法、正当、必要目的...\n\n网络运营者收集、使用个人信息..."
    # 所有正文的拼接版，每条截断 200 字（注入 prompt 用，避免 token 过长）
}
```

---

### 3.6 评分与风险等级计算

#### 3.6.1 违规扣分逻辑

```
analyze() 接口内部循环:
│
├─ 初始化 violation_flags = { "I1": 0, "I2": 0, ..., "I12": 0 }
│
├─ 对每个 sentence:
│   ├─ roberta_predict(sentence) → pred
│   │
│   └─ 对 pred.mapped 中每个 (violation_id, prob):
│       ├─ if prob > 0.5:  (仅高置信度的违规才计入)
│       │   ├─ violation_flags[violation_id] = 1  (标记该类违规已触发)
│       │   ├─ RAG 检索法律依据
│       │   └─ 追加到 violations_list
│       │
│       └─ else (prob ≤ 0.5): 忽略
│
├─ 计算总分:
│   penalty = Σ( INDICATORS[v_id]["weight"] * flag  for v_id, flag in violation_flags )
│   # 注意: 每种违规类型只扣一次权重（无论多少句子触发）
│
│   total_score = max(0, 100 - penalty * 100)
│   # 例: 触发 I1(0.15) + I3(0.15) + I6(0.12) = 0.42
│   # score = 100 - 42 = 58.0
│
└─ 风险等级判定:
    if score >= 70:   → "低风险"
    elif score >= 40:  → "中等风险"
    else:              → "高风险"
```

#### 3.6.2 风险等级阈值对照表

| 场景 | 阈值 | 等级 | 含义 |
|------|------|------|------|
| **审查级** (整体政策) | score >= 70 | 低风险 | 合规良好 |
| | 40 <= score < 70 | 中等风险 | 有改进空间 |
| | score < 40 | 高风险 | 严重不合规 |
| **句子级** (单条违规) | weight >= 0.12 | 高风险 | I1/I2/I3/I6 |
| | 0.08 <= weight < 0.12 | 中等风险 | I4/I5/I7 |
| | weight < 0.08 | 低风险 | I8/I9/I10/I11/I12 |

---

### 3.7 Phi-4 整改建议生成

#### 3.7.1 LLM 三种模式

| 模式 | 环境变量 `LLM_MODE` | 调用方式 | 说明 |
|------|---------------------|---------|------|
| **github** (推荐/默认) | `"github"` | OpenAI 兼容 API | GitHub Models 免费 Phi-4 Mini |
| **local** | `"local"` | llama-cpp-python | 本地 GGUF Q6_K 量化模型 |
| **hf** (fallback) | `"hf"` | HuggingFace InferenceClient | HF Inference API |

**Token 分工**:
- `HF_TOKEN`: 仅用于下载模型权重（RoBERTa checkpoint、嵌入模型等）
- `GITHUB_TOKEN`: 用于 GitHub Models 推理 API 调用

#### 3.7.2 github 模式初始化

```python
from openai import OpenAI
llm_github = OpenAI(
    base_url="https://models.inference.ai.azure.com",  # GitHub Models endpoint
    api_key=GITHUB_TOKEN,
)
```

#### 3.7.3 整改接口流程 (`POST /api/v1/rectify`)

```
前端 Drawer.tsx                          后端 app.py: rectify()
──────────────                           ──────────────────────
1. 用户点击某条违规的"审查"按钮
2. 打开 Drawer 面板
3. 自动触发生成 (mode 默认 rewrite)
         │
4. POST /api/v1/rectify
   Body: {
     original_snippet: "我们会收集您的位置信息...",
     violation_type: "I1",
     mode: "rewrite",          // 或 "summary"
     legal_basis: (可选)        // 前端传入的兜底依据
   }
         │
         ▼
5. RAG 检索法律依据
   get_legal_basis_from_rag("I1", context=original_snippet)
   → legal_reference (引用格式)
   → legal_content (条文正文, 注入 prompt)
         │
         ▼
6. 获取整改提示语
   ID_TO_HINT["I1"] = "涉及收集个人信息，必须遵守最小必要原则..."
         │
         ▼
7. 根据 mode 构建 Prompt (详见下节)
         │
         ▼
8. 调用 LLM (以 github 模式为例):
   response = llm_github.chat.completions.create(
     model="Phi-4-mini-instruct",
     messages=[
       { role: "system", content: system_content },
       { role: "user",   content: user_content }
     ],
     max_tokens=512,
     temperature=0.3,        # 低温度保证稳定性
   )
   suggested_text = response.choices[0].message.content
         │
         ▼
9. 返回 {
     suggested_text: "...",    // AI 生成的整改文本
     legal_basis: "...",       // 法律引用
     legal_detail: "...",      // 完整条文
     mode: "rewrite"
   }
         │
         ▼
10. 前端渲染:
    - rewrite 模式: 双栏 diff 对比 (原 vs 改写)
    - summary 模式: 通俗解读卡片 (本质 + 风险点拨)
```

#### 3.7.4 Prompt 设计详情

##### A. Summary 模式 Prompt (通俗解读)

**System Role**: `你是隐私政策合规解读专家。请严格按用户指定的 Output Format 输出纯净的纯文本内容，不要使用任何 Markdown 格式标记。`

**User Content 核心要素**:
```
# Rules
1. 语义简化：不使用法律术语，用普通人日常生活的词汇
2. 客观陈述：去掉贬义词（如"偷走"、"流氓"），改为客观描述行为本质
3. 结构严谨：严格按照 Output Format 输出
4. 纯净输出：禁止 Markdown 符号 (#、###、>、**、- 等)

# Output Format
第一部分标题：条款本质
  一句引用格式的文字，说明实际含义
第二部分标题：风险点拨
  实际行为：[一段话解释运作方式]
  潜在影响：[一句话说明可能导致的结果]

【原条款】{snippet}
【合规风险】{violation_hint}
【相关法律依据】{legal_reference} + {legal_content}
```

**输出约束**: 只输出两部分正文，无额外文字/前缀/格式符号

##### B. Rewrite 模式 Prompt (首席法务官风格)

**System Role**: `你是首席隐私法务官。直接输出改写后的完整条款文本，不要任何解释、标注、前言或法律引用。`

**User Content 核心要素**:
```
# Role
你是一位拥有深厚文字功力的【首席隐私法务官】，擅长将严苛的合规要求
【无缝融入】业务文本。你写出的条款既能满足监管标准，
读起来又如同出自顶级互联网公司之手，自然且专业。

# Context
- 【原条款原文】：{snippet}
- 【检测到的违规】：{violation_type_name}（{id}）：{hint}
- 【🚨 核心依据 (RAG)】：{legal_content}

# Rewrite Strategy (精益求精)
1. 深度揉合（逻辑衔接）：
   通过因果、目的、条件等关联词将 RAG 要求揉成完整段落
2. 以 RAG 为骨，以专业为皮：
   将强制性要求转化为业务化表达（如"显著提示"→"弹窗、加粗等方式"）
3. 原生化（隐身合规）：
   全文严禁出现"根据、依照、法律、合规"等词汇
4. 针对性优化：
   仅针对违规点修补，保留已有合规内容

# Output Limitation
只输出改写后的文本内容，不得有任何前言、后记、标注或解释。
```

---

### 3.8 前端聚合展示

#### 3.8.1 后端→前端数据映射 (`types.ts:mapRawToClauses`)

**核心逻辑**: 按句子内容 (`snippet`) 分组，同句触发的多个违规合并为一行。

```
后端 violations 数组 (原始):              前端 clauses 数组 (聚合后):
─────────────────────────                 ─────────────────────────
[                                        [
  { snippet: "收集位置信息...",            {
    violation_id: "I1",                     id: "CL-1234",
    indicator: "过度收集敏感数据",           originalText: "收集位置信息...",
    prob: 0.82,                             reason: "过度收集敏感数据、未获得明示同意",
    legal_references: [...]               ←   category: "I1",
  },                                        categoryName: "I1 过度收集敏感数据、I3 未获得明示同意",
  { snippet: "收集位置信息...",    →         riskLevel: "high",        ← 取最高
    violation_id: "I3",                     violations: [
    indicator: "未获得明示同意",               {
    prob: 0.75,                                 id: "I1",
    legal_references: [...]                     name: "过度收集敏感数据",
  },                                            riskLevel: "high",
]                                               confidence: 0.82,
                                              }, {
                                                  id: "I3",
                                                ]
                                                  name: "未获得明示同意",
                                                ]                                               riskLevel: "high",
                                                confidence: 0.75,
                                                legalReferences: [...],
                                              },
                                            ],
                                          }
                                        ]
```

**聚合算法伪代码**:
```typescript
function mapRawToClauses(rawClauses: Raw[]): Clause[] {
  // Step 1: 按 snippet 分组
  const grouped = new Map<string, Raw[]>();
  rawClauses.forEach(raw => {
    const key = raw.snippet;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(raw);
  });

  // Step 2: 每组聚合成一条 Clause
  return Array.from(grouped.entries()).map(([snippet, group]) => {
    // 为每组中的每个原始记录构建 violation 明细
    const violations = group.map(raw => ({
      id: raw.violation_id,
      name: raw.indicator,
      riskLevel: raw.risk_level,
      confidence: raw.probability,
      legalReferences: raw.legal_references || [],
    }));

    // 取最高风险等级 (优先级: high > medium > low)
    const highestRisk = maxBy(violations, v => RISK_PRIORITY[v.riskLevel]);

    return {
      originalText: snippet,
      reason: violations.map(v => v.name).join('、'),
      riskLevel: highestRisk,
      violations,  // 保留所有违规明细供 Drawer 展开查看
    };
  });
}
```

#### 3.8.2 表格展示 (`Details.tsx`)

**列定义**:

| 列名 | 宽度 | 渲染内容 | 聚合适配 |
|------|------|---------|---------|
| 条款 ID | 24 | clause.id (如 CL-1234) | — |
| 位置 | 32 | clause.location (如 第3节) | — |
| **风险类别** | 160 | **彩色标签组** | 遍历 `clause.violations[]`, 每个 tag 显示 `{id} {name}` + 风险色 |
| 内容片段 | auto | clause.snippet (truncate) | — |
| **等级** | 96 | **去重风险标签** | 遍历 `clause.violations[]`, 同等级只显示一次 |
| 操作 | 24 (右) | "审查" 按钮 | 点击打开 Drawer |

**风险标签颜色映射**:
```typescript
v.riskLevel === 'high'  → bg-red-50 text-red-700 border-red-200
v.riskLevel === 'medium'→ bg-amber-50 text-amber-700 border-amber-200
v.riskLevel === 'low'   → bg-green-50 text-green-700 border-green-200
```

#### 3.8.3 Drawer 整改面板 (`Drawer.tsx`)

**两种模式切换**:

| 模式 | 触发方式 | 布局 | 功能 |
|------|---------|------|------|
| **风险解读** (summary) | 点击"风险解读"tab | 单栏: 原文 + AI 解读 | 通俗化解读条款本质与风险 |
| **合规重写** (rewrite) | 点击"合规重写"tab (默认) | 双栏 diff + 编辑区 | 生成可直接使用的合规文本 |

**缓存机制**:
```typescript
// key: `${mode}_${clauseId}`
generatedCache: Record<string, { text, legal, detail, diff }>
```
- 同一 mode + 同一 clause 只调用一次 API
- 切换 mode 时若有缓存则恢复，无缓存则重新生成
- 点击"重生成"清除当前缓存强制刷新

**采纳流程**:
```
用户点击"采纳并应用"
  → handleAdoptClick()
    → 构建 updatedClause (含 editedText, diffHtml, legalBasis)
    → onAdopt(updatedClause)  [回调到 App.tsx]
      → 更新 currentProject.clauses[]
      → api.updateProject(projectId, clauses)  [回写到后端 DB]
      → showToast("整改方案已应用到当前草稿")
      → 关闭 Drawer
```

---

## 4. 前后端接口清单

### 4.1 接口总览

| # | 方法 | 路径 | 认证 | 功能 | 前端调用位置 |
|---|------|------|------|------|-------------|
| 1 | POST | `/api/v1/auth/register` | 否 | 用户注册 | Register.tsx |
| 2 | POST | `/api/v1/auth/login` | 否 | 用户登录 | Login.tsx |
| 3 | GET | `/api/v1/auth/me` | 是 | 获取当前用户 | App.tsx (init) |
| 4 | GET | `/health` | 否 | 健康检查 | — |
| 5 | GET | `/api/v1/kb/status` | 否 | 知识库状态 | — |
| 6 | POST | `/api/v1/kb/search` | 是 | 检索知识库 | — |
| 7 | **POST** | **`/api/v1/analyze`** | **是** | **合规分析(核心)** | **App.tsx → api.analyze()** |
| 8 | **POST** | **`/api/v1/rectify`** | **是** | **整改建议(核心)** | **Drawer.tsx → api.rectify()** |
| 9 | POST | `/api/v1/upload` | 是 | 上传文件 | App.tsx → api.uploadFile() |
| 10 | POST | `/api/v1/fetch-url` | 是 | URL 抓取 | App.tsx → api.fetchUrl() |
| 11 | GET | `/api/v1/projects` | 是 | 项目列表 | App.tsx → api.getProjects() |
| 12 | GET | `/api/v1/projects/{id}` | 是 | 项目详情 | App.tsx → api.getProject() |
| 13 | PUT | `/api/v1/projects/{id}` | 是 | 更新项目 | App.tsx → api.updateProject() |
| 14 | GET | `/api/v1/export/{id}` | 是 | 导出报告 | Details.tsx → api.exportReport() |

### 4.2 核心接口详细定义

#### 4.2.1 `POST /api/v1/analyze` — 合规分析

**请求**:
```http
POST /api/v1/analyze
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "text": "我们收集您的位置信息、通讯录和健康数据...",
  "source_type": "text"          // 可选: "text" | "url" | "file"
}
```

| 参数 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| text | string | **是** | 10 ~ 50000 字符 | 待分析的隐私政策文本 |
| source_type | string | 否 | enum | 来源类型标识 |

**响应** (`AnalyzeResponse`):
```json
{
  "id": "p1739006400",
  "name": "审查-20260208",
  "score": 45.5,
  "risk_level": "中等风险",
  "violations": [
    {
      "indicator": "过度收集敏感数据",
      "violation_id": "I1",
      "snippet": "我们会收集您的位置信息、通讯录和健康数据...",
      "legal_basis": "《个人信息保护法》第六条；网络安全法第四十一条",
      "legal_detail": "处理个人信息应当具有合理目的...(截断)",
      "legal_references": [
        {
          "law": "个人信息保护法",
          "article": "第六条",
          "reference": "《个人信息保护法》第六条",
          "content": "处理个人信息应当具有合法、正当、必要目的..."
        }
      ],
      "confidence": 0.8234
    }
  ],
  "sentence_results": [
    {
      "index": 1,
      "sentence": "我们会收集您的位置信息、通讯录和健康数据...",
      "class_name": "数据收集",
      "max_class_idx": 0,
      "max_prob": 0.85,
      "confidence": 3.42,
      "raw_probs": [0.23, 0.85, 0.31, 0.57, 0.11, 0.18, 0.52, 0.29, 0.73, 0.43, 0.14],
      "detected_violations": ["I1", "I4"]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 项目 ID (时间戳格式 p{unix}) |
| name | string | 项目名称 |
| score | float | 合规得分 (0~100, 100=完美合规) |
| risk_level | string | 风险等级: "低风险"/"中等风险"/"高风险" |
| violations | array | **违规列表** (未聚合，每个句子每个违规各一条) |
| violations[].indicator | string | 违规中文名称 |
| violations[].violation_id | string | 违规 ID ("I1"~"I12") |
| violations[].snippet | string | 触发违规的原始句子 |
| violations[].legal_basis | string | 法律引用 (多条用"；"分隔) |
| violations[].legal_detail | string | 法律条文正文 (截断版, 用于 prompt) |
| violations[].legal_references | array | **结构化法律列表** (完整版, 给前端展示) |
| violations[].confidence | float | 模型置信概率 |
| sentence_results | array | **逐句分类明细** (测试集式调试用) |

**内部处理流程**:
```
接收 text
  → split_into_sentences(text) → N 个句子
  → FOR EACH sentence:
      → roberta_predict(sentence) → { mapped, raw_probs, confidence, ... }
      → IF mapped 非空 AND prob > 0.5:
          → get_legal_basis_from_rag(violation_id, context=sentence)
          → append to violations_list
  → 计算 score / risk_level
  → 写入 DB (projects 表)
  → 返回 { id, name, score, risk_level, violations, sentence_results }
```

---

#### 4.2.2 `POST /api/v1/rectify` — 整改建议

**请求**:
```http
POST /api/v1/rectify
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "original_snippet": "我们会收集您的位置信息、通讯录和健康数据...",
  "violation_type": "I1",
  "mode": "rewrite",
  "legal_basis": ""           // 可选，后端优先使用 RAG 结果
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| original_snippet | string | **是** | 原始违规条款文本 |
| violation_type | string | **是** | 违规 ID ("I1"~"I12") |
| mode | string | 否 | `"rewrite"`(默认) 或 `"summary"` |
| legal_basis | string | 否 | 前端传入的法律依据 (RAG 失败时兜底) |

**响应**:
```json
{
  "suggested_text": "为了向您提供精准的路线导航和周边生活服务，仅在您主动开启相关功能时，我们会申请获取您的位置信息。对于通讯录，仅在您选择邀请好友时读取，且不会存储或用于其他目的。我们承诺不会收集您的健康数据。",
  "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条",
  "legal_detail": "处理个人信息应当具有合法、正当、必要目的。应当与处理目的直接相关，采取对个人权益影响最小的方式...",
  "mode": "rewrite"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| suggested_text | string | AI 生成的整改/解读文本 |
| legal_basis | string | 法律引用 (展示用) |
| legal_detail | string | 完整法律条文 (展示用) |
| mode | string | 当前模式 |

**LLM 调用参数** (三种模式通用):
- `max_tokens`: 512
- `temperature`: 0.3 (低温度保证稳定输出)
- `model`: Phi-4-mini-instruct (github/hf) 或 本地 GGUF

---

#### 4.2.3 其他辅助接口

**`POST /api/v1/upload`** — 文件上传
```
Request:  multipart/form-data { file: File }
Response: { text: "文件内容字符串" }
支持格式: .txt, .md, .json, .csv (≤20MB)
```

**`POST /api/v1/fetch-url`** — URL 抓取
```
Request:  { url: "https://..." }
Response: { text: "提取的纯文本" }
实现: requests.get + BeautifulSoup
超时: 10 秒
```

**`GET /api/v1/projects`** — 项目列表
```
Response: [{ id, name, score, risk_level, created_at }, ...]
排序: created_at DESC
过滤: current_user.id
```

**`GET /api/v1/projects/{id}`** — 项目详情
```
Response: { id, name, score, risk_level, violations: [...], created_at }
violations: JSON 解析自 result_json 字段
```

**`PUT /api/v1/projects/{id}`** — 更新项目
```
Request:  { violations: [...] }
Response: { message: "更新成功", id: "..." }
用途: 采纳整改后回写 suggested_text 到数据库
```

**`GET /api/v1/export/{id}`** — 导出报告
```
Response: text/plain (Content-Disposition: attachment)
格式: 纯文本报告 (项目信息 + 违规列表 + 整改建议)
```

---

## 5. 数据流转全链路图

### 5.1 完整审查流程 (端到端)

```
用户操作                    前端状态变化                    后端处理                     数据库操作
─────────                   ───────────                    ────────                    ─────────

1. 用户粘贴文本
   [NewTask 页面]
         │
         ▼
2. 点击"开始审查"
   setIsAnalyzing(true)
   setAnalysisStep("正在提取文本...")
         │
         ▼
3. (若 type=file/url)
   api.uploadFile(file)
   或 api.fetchUrl(url)
   → 获得 textToAnalyze
         │
         ▼
4. setAnalysisStep("正在进行合规性分析...")
         │
         ▼
5. api.analyze(text, type)
   POST /api/v1/analyze
         │
         ├──────────────────────────────────────────────────────────┐
         │                    后端 analyze()                        │
         │                                                          │
         │  ① split_into_sentences(text)                            │
         │     → ["句子1", "句子2", ..., "句子N"]                    │
         │                                                          │
         │  ② FOR each sentence:                                    │
         │     roberta_predict(sentence)                             │
         │     → tokenizer → model.forward → sigmoid → mapped IDs   │
         │                                                          │
         │  ③ FOR each detected violation (prob > 0.5):             │
         │     get_legal_basis_from_rag(violation_id, sentence)      │
         │     → retriever.search_by_violation()                    │
         │     → FAISS 语义检索 141 条法律 → top 5                   │
         │     → 返回 references + content                          │
         │                                                          │
         │  ④ 计算分数:                                              │
         │     score = 100 - Σ(weight × flag) × 100                 │
         │     risk_level = classify(score)                          │
         │                                                          │
         │  ⑤ 写入 DB:                                              │
         │     INSERT INTO projects (id, user_id, name, score,      │
         │       risk_level, result_json, raw_text)                  │
         │                                                          │
         └──────────────────────────────────────────────────────────┘
         │
         ▼
6. 接收响应 { id, score, risk_level, violations, sentence_results }
         │
         ▼
7. setAnalysisStep("正在生成审查报告...")
         │
         ▼
8. mapRawToClauses(result.violations)
   → 按 snippet 分组聚合
   → 构建 Project 对象
         │
         ▼
9. setProjects(prev => [newProject, ...prev])
   setCurrentProject(newProject)
   setCurrentView('details')
   showToast("审计完成")
   setIsAnalyzing(false)
         │
         ▼
10. [Details 页面渲染]
    违规表格 (按句子聚合展示)
    ┌──────┬──────┬─────────────────────┬────┬────┬────┐
    │ ID   │ 位置 │ 风险类别            │内容│等级│操作│
    ├──────┼──────┼─────────────────────┼────┼────┼────┤
    │CL-001│第3节 │[I1 过度收集][I3 未获]│... │高危│审查│
    │CL-002│第7节 │[I5 第三方范围]      │... │中度│审查│
    └──────┴──────┴─────────────────────┴────┴────┴────┘
```

### 5.2 整改流程 (端到端)

```
用户操作                    前端处理                       后端处理
─────────                   ────────                       ────────

1. 在 Details 表格点击"审查"
   onOpenDrawer(clause)
   → setSelectedClause(clause)
   → setIsDrawerOpen(true)
         │
         ▼
2. [Drawer 面板打开]
   mode 默认 "rewrite"
   useEffect 检测到 clause 变化
         │
         ▼
3. 无缓存 → generateSuggestion(clause, "rewrite")
         │
         ▼
4. api.rectify(
     originalText,    // "我们会收集您的位置信息..."
     category,        // "I1"
     legalBasis,      // (可选兜底)
     "rewrite"        // mode
   )
   POST /api/v1/rectify
         │
         ├──────────────────────────────────────────────┐
         │            后端 rectify()                    │
         │                                              │
         │  ① RAG 检索:                                │
         │     get_legal_basis_from_rag("I1", context)  │
         │     → legal_reference (引用)                 │
         │     → legal_content (条文, 截断200字/piece)  │
         │     → legal_references (完整结构化列表)       │
         │                                              │
         │  ② 获取提示语:                               │
         │     ID_TO_HINT["I1"]                         │
         │                                              │
         │  ③ 构建 Prompt (rewrite 模式):               │
         │     System: "你是首席隐私法务官..."           │
         │     User: "# Role / # Context / # Strategy"   │
         │           + 原条款 + 违规 + RAG 依据          │
         │                                              │
         │  ④ 调用 LLM (github 模式):                   │
         │     OpenAI-compatible chat.completions.create │
         │     model=Phi-4-mini-instruct                │
         │     max_tokens=512, temperature=0.3           │
         │                                              │
         └──────────────────────────────────────────────┘
         │
         ▼
5. 接收响应 {
     suggested_text: "为了向您提供精准的...",
     legal_basis: "《个人信息保护法》第六条...",
     legal_detail: "处理个人信息应当具有...",
     mode: "rewrite"
   }
         │
         ▼
6. generateDiffHtml(original, suggested)
   → diffWords() → HTML with .diff-add/.diff-remove
         │
         ▼
7. setState:
   setEditedText(suggested_text)
   setLocalDiffHtml(diffHtml)
   setLocalLegalBasis(legal_basis)
   setLocalLegalDetail(legal_detail)
   写入 generatedCache[cacheKey]
         │
         ▼
8. [Drawer 渲染 rewrite 模式布局]
   ┌─────────────────────────────────────────────┐
   │  ┌──────────────┐  ┌──────────────┐        │
   │  │  原始条款     │  │  改写建议     │        │
   │  │  (红底)      │  │  (橙底)      │        │
   │  │  我们会收集.. │  │  为了向您..  │        │
   │  └──────────────┘  └──────────────┘        │
   │                                              │
   │  ┌──────────────────────────────────────┐   │
   │  │  人工二次编辑 [textarea]              │   │
   │  │  可在此处对模型建议进行最终微调...     │   │
   │  └──────────────────────────────────────┘   │
   │                                              │
   │  ┌──────────────────────────────────────┐   │
   │  │  合规依据                             │   │
   │  │  《个人信息保护法》第六条              │   │
   │  │  ─────────────────────────────        │   │
   │  │  处理个人信息应当具有合法、正当...     │   │
   │  └──────────────────────────────────────┘   │
   │                                              │
   │          [取消]        [采纳并应用]           │
   └─────────────────────────────────────────────┘
         │
         ▼ (用户点击"采纳并应用")
9. handleAdoptClick()
   → 构建 updatedClause (含编辑后的文本)
   → onAdopt(updatedClause)
         │
         ▼
10. [App.tsx handleAdopt]
    更新 currentProject.clauses[]
    → api.updateProject(projectId, clausesData)
       PUT /api/v1/projects/{id}
       → 后端 UPDATE result_json 字段
    showToast("整改方案已应用到当前草稿")
    close Drawer
```

### 5.3 前端状态管理全景

```
App.tsx State:
┌────────────────────────────────────────────────────────────┐
│ isLoggedIn: boolean          // 是否已登录                   │
│ currentUser: User | null     // 当前用户信息                 │
│ currentView: ViewType       // 当前页面: overview/new-task  │
│                            // details/history              │
│ projects: Project[]          // 所有项目列表                 │
│ currentProject: Project|null // 当前选中项目(含clauses)      │
│ selectedClause: Clause|null  // Drawer 中正在查看的条款      │
│ isDrawerOpen: boolean        // Drawer 是否打开              │
│ isAnalyzing: boolean        // 是否正在分析(loading遮罩)    │
│ analysisStep: string         // 分析进度文案                 │
│ searchQuery: string         // 搜索关键词                   │
│ toast: ToastState           // 全局提示消息                 │
│ abortControllerRef          // AbortController(取消请求用)   │
└────────────────────────────────────────────────────────────┘

State 变更驱动视图:
┌────────────────┬───────────────────┬────────────────────────┐
│ 条件           │ 渲染组件           │ 说明                   │
├────────────────┼───────────────────┼────────────────────────┤
│ !isLoggedIn    │ Login / Register  │ 未登录显示登录页         │
│ isRegistering  │ Register          │ 注册子页面              │
│ view==overview │ Overview          │ 总览仪表盘              │
│ view==new-task │ NewTask           │ 新建任务页              │
│ view==details  │ Details           │ 违规明细表格            │
│ view==history  │ History           │ 历史报告列表            │
│ isDrawerOpen   │ Drawer (overlay)  │ 整改侧边面板            │
│ isAnalyzing    │ Loading overlay   │ 全屏 loading 遮罩       │
│ toast.visible  │ Toast             │ 浮动提示消息            │
└────────────────┴───────────────────┴────────────────────────┘
```

---

## 附录

### A. 关键文件索引

| 文件路径 | 职责 | 核心导出/函数 |
|---------|------|--------------|
| `sy-s-web-backend/app.py` | 主入口 + API 路由 + 模型加载 | `roberta_predict()`, `get_legal_basis_from_rag()`, `analyze()`, `rectify()` |
| `sy-s-web-backend/auth.py` | JWT 认证 | `login()`, `register()`, `get_current_user()` |
| `sy-s-web-backend/models.py` | 数据模型 (DB + 知识库) | `User`, `Project`, `Article`, `SearchResult` |
| `sy-s-web-backend/violation_config.py` | 12 类违规指标体系 (SSOT) | `INDICATORS`, `ID_TO_INDICATOR`, `ID_TO_HINT` |
| `sy-s-web-backend/src/mapper.py` | 11类→12类映射 | `map_to_12_classes()`, `VIOLATION_NAMES` |
| `sy-s-web-backend/src/config.py` | 系统配置 | `Config`, `get_config()` |
| `sy-s-web-backend/src/loader/legal_kb_loader.py` | 知识库加载 | `LegalKBLoader.load_all()`, `get_article()` |
| `sy-s-web-backend/src/store/vector_store.py` | FAISS 向量存储 | `VectorStore.search()`, `search_by_violation()` |
| `sy-s-web-backend/src/search/retriever.py` | 检索编排 | `Retriever.retrieve_by_violation_type()` |
| `sy-s-web/src/types.ts` | 前端类型 + 映射函数 | `Clause`, `mapRawToClause()`, `mapRawToClauses()` |
| `sy-s-web/src/utils/api.ts` | API 请求封装 | `api.analyze()`, `api.rectify()`, `apiFetch()` |
| `sy-s-web/src/config/violation-config.ts` | 前端违规配置 (SSOT) | `VIOLATION_NAMES`, `VIOLATION_WEIGHTS`, `VIOLATION_DETAILS` |
| `sy-s-web/src/App.tsx` | 根组件 + 状态管理 | `handleStartAnalysis()`, `handleAdopt()`, `handleSelectProject()` |
| `sy-s-web/src/components/Details.tsx` | 违规明细表格 | 筛选/分页/聚合展示 |
| `sy-s-web/src/components/Drawer.tsx` | 整改侧边面板 | summary/rewrite 双模式 + diff + 缓存 |

### B. 环境变量清单

| 变量名 | 用途 | 必填 | 示例值 |
|--------|------|------|--------|
| `JWT_SECRET_KEY` | JWT 签名密钥 | 推荐 | `your-secret-key-here` |
| `HF_TOKEN` | HuggingFace Token (下载模型) | **是** (本地运行) | `hf_xxxxx` |
| `GITHUB_TOKEN` | GitHub Models Token (Phi-4 推理) | **是** (推荐模式) | `ghp_xxxxx` |
| `LLM_MODE` | LLM 模式选择 | 否 (默认 github) | `github` / `local` / `hf` |
| `LLM_MODEL_ID` | GitHub Models 模型 ID | 否 | `Phi-4-mini-instruct` |
| `VITE_API_URL` | 前端 API 地址 | 否 (默认空=同源) | `https://your-api.com` |

### C. 错误码速查

| HTTP Code | Error Code | 场景 | 处理方式 |
|-----------|-----------|------|---------|
| 400 | — | 参数校验失败 (文本过短/过长) | 前端表单校验拦截 |
| 401 | UNAUTHORIZED | Token 过期/无效 | 前端清除 localStorage, 跳转登录页 |
| 404 | — | 项目不存在 | 前端提示"项目不存在" |
| 500 | HTTP_ERROR | 后端内部错误 (f-string 语法等) | 检查后端日志 |
| 503 | — | RAG 模块不可用 | 降级为静态配置 (violation_config.py 兜底) |
| — | TIMEOUT | 请求超过 60s | 前端显示"请求超时"提示 |
| — | NETWORK_ERROR | 网络不可达 | 前端显示"网络错误"提示 |
| — | CANCELED | 用户主动取消 | 前端显示"已取消审查" |
