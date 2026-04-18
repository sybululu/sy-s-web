# 隐私政策合规审查系统 — 完整工作流与接口文档

> **版本**: v2.0（审查修复版）
> **更新日期**: 2026-04-18
> **技术栈**: React 19 + TypeScript + Vite (前端) | FastAPI + SQLite + PyTorch (后端)

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [模型加载工作流](#2-模型加载工作流)
3. [认证工作流](#3-认证工作流)
4. [核心业务工作流：合规分析](#4-核心业务工作流合规分析)
5. [核心业务工作流：条款整改（双模式）](#5-核心业务工作流条款整改双模式)
6. [RAG 法律检索工作流](#6-rag-法律检索工作流)
7. [导出报告工作流](#7-导出报告工作流)
8. [完整 API 接口参考](#8-完整-api-接口参考)
9. [前后端数据映射规范](#9-前后端数据映射规范)
10. [环境变量与部署配置](#10-环境变量与部署配置)
11. [错误码与降级策略](#11-错误码与降级策略)

---

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  前端 (Vite:5000)                                         │  │
│  │  ┌─────┬──────┬──────┬──────┬──────┬────────┬────────┐   │  │
│  │  │App  │Sidebar│Header│NewTask│Details│History │ Drawer │   │  │
│  │  │.tsx │ .tsx  │ .tsx │ .tsx  │ .tsx  │ .tsx   │ .tsx   │   │  │
│  │  └──┬──┴──┬───┴──┬───┴──┬───┴──┬───┴────────┴───┬────┘   │  │
│  │     │     │      │      │      │               │          │  │
│  │  ┌──▼───▼────▼──────▼──────▼──────▼──────────────▼──────┐ │  │
│  │  │           api.ts (统一请求层)                         │ │  │
│  │  │  - apiFetch() : 认证/超时/401处理/JSON解析            │ │  │
│  │  │  - exportReport(): 原生fetch绕过JSON解析              │ │  │
│  │  └──────────────────────┬───────────────────────────────┘ │  │
│  └─────────────────────────┼─────────────────────────────────┘  │
│                            │ HTTP (JSON)                        │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Vite Proxy (/api/* → localhost:7860)                     │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     后端 (FastAPI:7860)                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ RoBERTa  │  │  RAG     │  │  LLM     │  │  SQLite DB   │   │
│  │ 分类模型  │  │ 检索引擎  │  │ 整改生成  │  │  (projects)  │   │
│  │(11→12类) │  │(FAISS)   │  │(3模式)   │  │  (users)     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │             │             │                │            │
│  ┌────▼─────────────▼─────────────▼────────────────▼─────────┐  │
│  │                    app.py (FastAPI 应用)                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │/analyze│ │/rectify│ │/export │ │/upload │ │/auth/* │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| **RoBERTa 分类器** | `app.py:CustomBertMoeModel` | 接收句子 → 11类logits → `mapper.py` 映射 → 12类违规ID |
| **RAG 检索** | `src/search/retriever.py` | 违规类型ID → FAISS向量检索 → 返回法律条文正文 |
| **LLM 整改** | `app.py:rectify_snippet()` | 接收原条款+法律依据+mode → 调用 Phi-4 → 返回整改文本 |
| **前端状态管理** | `App.tsx` | 全局状态：isLoggedIn / projects / currentProject / selectedClause |
| **Drawer 组件** | `Drawer.tsx` | 双模式切换(summary/rewrite) + 缓存系统 + diff对比 |

---

## 2. 模型加载工作流

### 2.1 启动时序图

```
应用启动 (uvicorn app:app)
    │
    ├── [1] 导入阶段 (import time)
    │   ├── from transformers import AutoTokenizer, BertModel
    │   ├── from huggingface_hub import hf_hub_download, InferenceClient
    │   └── try: from src.loader import LegalKBLoader ... (RAG 可选)
    │
    ├── [2] 加载 RoBERTa 分类模型 (阻塞，必须成功)
    │   ├── tokenizer_roberta = AutoTokenizer("hfl/chinese-roberta-wwm-ext")
    │   ├── hf_hub_download("sybululu/bert-moe", "multi_classification_bertmoe.ckpt")
    │       └── 需要 HF_TOKEN (下载私有 checkpoint)
    │   └── model_roberta = CustomBertMoeModel() + load_state_dict()
    │       └── 移除 "model." 前缀，strict=True 匹配 fc(768→11) 分层头
    │
    ├── [3] 加载 LLM 整改模型 (三模式降级链)
    │   ├── if LLM_MODE == "local":
    │   │   ├── hf_hub_download GGUF 权重
    │   │   └── llama-cpp-python Llama() 加载
    │   │   └── 失败 → 降级到 github
    │   ├── if LLM_MODE == "github" (默认):
    │   │   ├── 校验 GITHUB_TOKEN 非空且非默认值
    │   │   │   └── 空值 → 降级到 hf
    │   │   ├── openai.OpenAI(base_url="models.inference.ai.azure.com")
    │   │   └── 失败 → 降级到 hf
    │   └── if LLM_MODE == "hf":
    │       └── InferenceClient(model=Phi-4-mini-instruct, token=HF_TOKEN)
    │
    ├── [4] FastAPI app 创建
    │   ├── CORS 中间件 (localhost:5000 + sy-s-web.pages.dev)
    │   ├── init_db() (SQLite 建表)
    │   └── include_router(auth_router, prefix="/api/v1/auth")
    │
    └── [5] startup 事件 → initialize_rag()
        ├── LegalKBLoader(knowledge_dir) — 加载法律知识库 JSON
        ├── VectorStore(embedding_model) — FAISS 索引
        │   └── SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        └── Retriever(loader, vector_store).initialize()
            └── 失败不阻断主程序（降级为静态配置）
```

### 2.2 Token 分工表

| Token | 用途 | 必需性 | 使用时机 |
|-------|------|--------|----------|
| `HF_TOKEN` | 下载 HuggingFace 模型权重 | **必需** | 启动时一次性下载 RoBERTa ckpt、嵌入模型 |
| `GITHUB_TOKEN` | 调用 GitHub Models Phi-4 推理 | 推荐 | 每次 rectify 请求实时调用 |
| `JWT_SECRET_KEY` | JWT 签名密钥 | **必需** | 每次 login/me 验证 |

### 2.3 LLM 三模式自动降级

```
用户设置 LLM_MODE=github (默认)
        │
        ▼
  GITHUB_TOKEN 是否有效？
   ┌───YES──┐
   │         │
   ▼         ├──NO──▶ LLM_MODE = "hf"
OpenAI客户端    │
初始化成功？    │
   ├──YES──┐   │
   │       │   │
   ▼       ├──NO─┘
使用GitHub   LLM_MODE = "hf"
Models API  (最终兜底)
```

---

## 3. 认证工作流

### 3.1 登录流程

```
用户输入 email + password
        │
        ▼
POST /api/v1/auth/login
{ "email": "...", "password": "..." }
        │
        ▼
[后端 auth.py]
① db.query(User).filter(email) → 查找用户
② pwd_context.verify(password, user.password_hash) → bcrypt 校验
③ 更新 last_login = utcnow()
④ create_access_token({"sub": str(user.id)}) → JWT(HS256, 24h有效)
        │
        ▼
返回 { "token": "eyJ...", "user": { id, email, name } }
        │
        ▼
[前端 App.tsx handleLogin]
① setCurrentUser(user)
② setIsLoggedIn(true)
③ localStorage.setItem('token', token)
④ localStorage.setItem('user', JSON.stringify(user))
⑤ setCurrentView('overview')
        │
        ▼
触发 useEffect → api.getProjects() → 加载历史项目列表
```

### 3.2 请求认证机制

```
每次 API 调用
    │
    ▼
[api.ts getAuthHeaders()]
① localStorage.getItem('token')
② headers['Authorization'] = `Bearer ${token}`
③ headers['Content-Type'] = 'application/json' (非FormData时)
    │
    ▼
[后端 auth.py get_current_user()]
① HTTPBearer() → 提取 Bearer token
② jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
③ payload["sub"] → user_id
④ db.query(User).filter(id=user_id).first()
    │
    ▼
返回 User 对象 或 401 HTTPException
    │
    ▼
[前端 apiFetch 401 处理]
① response.status === 401
② localStorage.removeItem('token') + removeItem('user')
③ window.location.href = '/' → 强制跳转登录页
```

---

## 4. 核心业务工作流：合规分析

### 4.1 完整分析流程（最核心的工作流）

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤1: 用户提交隐私政策                                          │
│                                                                 │
│  NewTask.tsx 支持三种输入方式:                                   │
│  ├─ [文件上传] .txt/.md/.json/.csv (≤20MB)                      │
│  │   → onStartAnalysis('file', File对象)                        │
│  ├─ [URL抓取] 输入URL                                            │
│  │   → onStartAnalysis('url', string)                           │
│  └─ [直接粘贴] 文本框                                           │
│      → onStartAnalysis('text', string)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤2: 文本预处理 (App.tsx handleStartAnalysis)                  │
│                                                                 │
│  if type === 'file':                                            │
│    api.uploadFile(file) → POST /api/v1/upload                   │
│    后端: content.decode("utf-8", errors="ignore") → { text }    │
│                                                                 │
│  if type === 'url':                                             │
│    api.fetchUrl(url) → POST /api/v1/fetch-url                  │
│    后端: requests.get(url) → BeautifulSoup → 提纯文本 → { text }│
│                                                                 │
│  textToAnalyze = 最终文本                                        │
│  abortControllerRef = new AbortController() (支持取消)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤3: 后端分析 (POST /api/v1/analyze)                          │
│                                                                 │
│  Request: { text: string(10~50000字), source_type: string }     │
│                                                                 │
│  [3.1] 句子分割                                                 │
│    split_into_sentences(text)                                    │
│    → re.split(r'[。；\n]+', text)                               │
│    → 过滤 len(strip) > 5 的句子                                  │
│                                                                 │
│  [3.2] 逐句 RoBERTa 分类 (核心推理)                              │
│    for sentence in sentences:                                    │
│      inputs = tokenizer(sentence, truncation=150, max_length=150)│
│      outputs = model_roberta(**inputs)  # CustomBertMoeModel    │
│      logits = outputs.squeeze()  # [11] 维度                    │
│      probs = sigmoid(logits).tolist()  # 11类概率               │
│      confidence = logits[0] - logits[1]  # 最高-次高差值        │
│      detected_ids = map_to_12_classes(probs, confidence)        │
│      # mapper.py: 11类idx → 多标签12类 violation ID            │
│      # 例: idx=0 → ["I1","I4"] / idx=2 → ["I5","I6","I7"]    │
│                                                                 │
│  [3.3] 违规去重 + RAG 法律检索                                   │
│    for violation_id, prob in probs.items():                     │
│      if prob > 0.5:                                             │
│        violation_flags[violation_id] = 1  # 每种违规只扣一次   │
│        if not exists in violations_list:                       │
│          rag_legal = get_legal_basis_from_rag(violation_id)    │
│          violations_list.append({                              │
│            indicator: "过度收集敏感数据",  # ID_TO_INDICATOR    │
│            violation_id: "I1",                                 │
│            sentence: "原始条款文本...",                          │
│            legal_basis: rag_legal.reference,  # "《个保法》第28条"│
│            legal_detail: rag_legal.content,  # 条文完整正文      │
│          })                                                    │
│                                                                 │
│  [3.4] 评分计算                                                  │
│    penalty = Σ(INDICATORS[v_id].weight × flag)  # 权重求和      │
│    total_score = max(0, 100 - penalty × 100)                   │
│    risk_level: score≥70→低风险 / ≥40→中等 / <40→高风险          │
│                                                                 │
│  [3.5] 持久化                                                   │
│    Project(id, user_id, name, score, risk_level,               │
│            result_json=json.dumps(violations_list), raw_text)   │
│    db.add(project) → db.commit()                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤4: 前端结果映射 (types.ts mapRawToClause)                   │
│                                                                 │
│  后端返回的 snake_case 字段 → 前端 camelCase Clause 对象        │
│                                                                 │
│  {                                                            │
│    id: raw.id ?? `CL-${random(1000~9999)}`,                    │
│    originalText: raw.snippet ?? raw.original_text,              │
│    suggestedText: raw.suggested_text ?? '【系统建议】...',       │
│    reason: raw.indicator ?? getViolationName(category),        │
│    category: raw.violation_id,  # "I1" ~ "I12"                │
│    categoryName: raw.indicator ?? getViolationName(category),  │
│    weight: raw.weight ?? getViolationWeight(category),          │
│    location: `第${index+1}节`,                                  │
│    legalBasis: raw.legal_basis,  # 引用格式                     │
│    legalDetail: raw.legal_detail,  # 条文正文 (新增!)           │
│    isAdopted: false,                                            │
│  }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤5: 展示结果                                                  │
│                                                                 │
│  newProject = {                                                │
│    id, name, date, description, score, riskStatus,              │
│    clauseCount, clauses: mapRawToClauses(violations),           │
│  }                                                             │
│  setProjects(prev => [newProject, ...prev])                     │
│  setCurrentProject(newProject)                                   │
│  setCurrentView('details')  ← 自动跳转到详情页                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 RoBERTa 11→12 类映射详解

```
模型输出 (11类概率向量)
    │
    ▼
取最高概率类别索引 max_idx (0~10)
    │
    ▼
双重阈值过滤 (防止误判):
  confidence < 3.0 OR max_prob < 0.6 → 返回空 [] (不报违规)
    │
    ▼
多标签映射 (src/mapper.py ID_MAPPING):

  idx=0 "数据收集"     ──→ ["I1"(过度收集), "I4"(范围超出)]
  idx=1 "权限获取"     ──→ ["I3"(未获明示同意)]
  idx=2 "共享转让"     ──→ ["I5"(第三方范围), "I6"(单独授权), "I7"(共享用途)]
  idx=3 "使用"         ──→ ["I2"(未说明目的)]
  idx=4 "存储方式"     ──→ ["I8"(留存期限)]
  idx=5 "安全措施/销毁" ──→ ["I9"(销毁机制)]
  idx=6 "特殊人群"     ──→ ["I3"](未获明示同意)  ← 与idx=1合并
  idx=7 "权限管理"     ──→ ["I10"(用户权利), "I12"(响应时限)]
  idx=8 "联系方式"     ──→ ["I11"(行使途径)]
  idx=9 "政策变更"     ──→ ["I11"](行使途径)  ← 与idx=8合并
  idx=10 "停止运营"    ──→ ["I9"](销毁机制)   ← 与idx=5合并

覆盖检查: I1✅ I2✅ I3✅ I4✅ I5✅ I6✅ I7✅ I8✅ I9✅ I10✅ I11✅ I12✅
```

---

## 5. 核心业务工作流：条款整改（双模式）

### 5.1 Drawer 组件状态机

```
用户点击某条款的 "审查" 按钮
    │
    ▼
[Details.tsx] onOpenDrawer(clause)
    │
    ▼
[App.tsx] setSelectedClause(clause) + setIsDrawerOpen(true)
    │
    ▼
[Drawer.tsx 渲染]
    │
    ├── 初始化状态
    │   ├── mode = 'rewrite' (默认)
    │   ├── editedText = ''
    │   ├── localLegalBasis = clause.legalBasis
    │   ├── localLegalDetail = clause.legalDetail || ''
    │   └── generatedCache = {} (空)
    │
    ▼
[useEffect(clause, mode) 触发]
    │
    ├── 计算 cacheKey = `${mode}_${clause.id || originalText.slice(0,30)}`
    │
    ├── 命中缓存?
    │   ├── YES → 直接恢复 text/diff/legal/detail
    │   └── NO  ──┐
    │              │
    │              ▼
    │        [rewrite模式特殊逻辑]
    │        clause.suggestedText 存在且非默认值?
    │        ├── YES → 用默认值填充 (无需调用API)
    │        └── NO  → 清空 + 自动调 generateSuggestion()
    │
    ▼
[generateSuggestion(currentClause, targetMode)] 
    │
    ├── 防重复: cache已存在? → 直接return
    │
    ├── 调用 api.rectify(originalText, category, legalBasis, mode)
    │   │
    │   ▼
    │ [POST /api/v1/rectify]
    │ { original_snippet, violation_type, legal_basis, mode }
    │   │
    │   ▼
    │ [后端 rectify_snippet()]
    │ ├── 1. RAG检索: get_legal_basis_from_rag(violation_type)
    │ │   → { reference: "《个保法》第28条", content: "完整条文..." }
    │ │
    │ ├── 2. 构建差异化 Prompt (根据 mode)
    │ │   ├── mode="summary" → 摘要解读 Prompt
    │ │   │   └── 要求: 先一句话概括 + 再通俗解读
    │ │   └── mode="rewrite" → 合规改写 Prompt
    │ │       └── 要求: 不提法律但依法改写 + 专业表述
    │ │
    │ ├── 3. 调用 LLM (三模式)
    │ │   ├── github: OpenAI.chat.completions.create(Phi-4)
    │ │   ├── local: llama.create_chat_completion(GGUF)
    │ │   └── hf: InferenceClient.chat_completion
    │ │
    │ └── 4. 返回 {
    │       suggested_text: "整改后的文本...",
    │       legal_basis: "《个人信息保护法》第28条",
    │       legal_detail: "处理敏感个人信息应当取得...",
    │       mode: "summary"/"rewrite"
    │     }
    │
    ▼
[前端处理响应]
    ├── setEditedText(res.suggested_text)
    ├── setLocalDiffHtml(generateDiffHtml(原始, 建议))  // rewrite模式用diff
    ├── setLocalLegalBasis(res.legal_basis)
    ├── setLocalLegalDetail(res.legal_detail)
    │
    └── 写入缓存 generatedCache[cacheKey] = {
        text, legal: res.legal_basis,
        detail: res.legal_detail, diff: diffHtml
      }

    └── rewrite模式额外同步: currentClause.suggestedText = text
```

### 5.2 双模式 Prompt 差异

#### Summary 模式（用户解读）

```
System Role: 隐私政策合规解读专家
要求: 输出严格分为「一句话概括」和「通俗解读」两部分

User Prompt 包含:
  【原条款】{original_snippet}
  【问题】{violation_hint}
  【法律依据】{reference} + {content}

期望输出格式:
  ═══ 一句话概括 ═══
  用大白话一句话说清这条条款想干什么、哪里有问题
  
  ═══ 通俗解读 ═══
  1. 实际在做什么？（比喻/生活场景）
  2. 对用户的潜在影响？
  3. 合规版应该长什么样？
```

#### Rewrite 模式（合规重写）

```
System Role: 隐私政策撰写专家
要求: 直接输出改写后的完整条款文本，无解释无标注无法律引用

User Prompt 包含:
  【原条款】{original_snippet}
  【改写要求】{violation_hint}
  【参考依据】{content[:800]}  ← 内部参考，禁止在输出中引用！
  禁止规则:
    ✗ "根据XX法第X条"
    ✗ "依据法律规定"
    ✓ 只输出改写后条款本身

改写原则:
  1. 保持业务意图不变
  2. 补全缺失合规要素（目的/选择权/撤回方式）
  3. 大厂正式版隐私政策风格
  4. 长度与原文相当
```

### 5.3 Drawer 缓存机制

```
缓存结构: Record<string, { text, legal, detail, diff }>
Key 格式: `${mode}_${clauseId}`

示例:
  "rewrite_CL-3821" → { text: "改写后文本...", legal: "《个保法》第28条", detail: "完整条文...", diff: "<span class='diff-add'>新增</span>..." }
  "summary_CL-3821" → { text: "一句话概括\n\n通俗解读...", legal: "《个保法》第14条", detail: "完整条文...", diff: "<span>纯文本展示</span>" }

行为:
  - 同一 clause + 同一 mode → 命中缓存，不重复调用API
  - 切换 mode → 不同key，重新生成
  - 点击"重生成" → 删除当前key缓存，强制重新调用
  - 关闭 Drawer → 缓存保留（组件不卸载，AnimatePresence保持挂载）
```

### 5.4 采纳回写机制（P0-B 新增）

```
用户点击 "采纳并应用"
    │
    ▼
[Drawer.tsx handleAdoptClick]
    │
    ├── 构建 updatedClause (含 suggestedText + legalBasis + legalDetail)
    │
    ▼
[App.tsx handleAdopt]
    │
    ├── 1. 更新本地 currentProject.clauses (立即UI反馈)
    │
    ├── 2. 调用 api.updateProject(projectId, clauses)  ★ 新增!
    │   │
    │   ▼
    │   PUT /api/v1/projects/{project_id}
    │   { violations: [{ indicator, violation_id, snippet,
    │                 legal_basis, legal_detail, suggested_text }] }
    │   │
    │   ▼
    │   [后端 update_project]
    │   project.result_json = json.dumps(violations)
    │   db.commit()
    │   → 下次导出报告时包含整改建议
    │
    ├── showToast('整改方案已应用到当前草稿')
    └── setIsDrawerOpen(false)
```

---

## 6. RAG 法律检索工作流

### 6.1 架构层次

```
get_legal_basis_from_rag(violation_type, context)
    │
    ├── [快速路径] RAG 不可用?
    │   └── 返回 { reference: INDICATORS[...].legal_basis, content: "" }
    │       (静态兜底: 仅返回引用字符串如"《个人信息保护法》第六条")
    │
    └── [RAG 路径]
        │
        ├── retriever.retrieve_by_violation_type(violation_type, context, top_k=2)
        │   │
        │   ├── [Step 1] 精确匹配: loader.get_articles_by_violation("I1")
        │   │   → 从知识库 JSON 中查找 violation_types 包含 "I1" 的 Article
        │   │
        │   ├── [Step 2] 向量检索: vector_store.search_by_violation("I1", context)
        │   │   ├── filters = {"violation_types": ["I1"]}
        │   │   ├── query_embedding = encode(context or "隐私政策 I1 合规")
        │   │   ├── faiss_index.search(query_emb, top_k*2)  (FAISS IndexFlatIP + 余弦归一化)
        │   │   └── 过滤 + 截断 top_k 条
        │   │
        │   └── [Step 3] 合并去重 (优先精确匹配，补充向量检索)
        │       → List[SearchResult] (最多 top_k 条)
        │
        └── 取 results[0] 最佳匹配
            │
            └── 返回 {
                reference: result.law_reference  # "《个人信息保护法》第二十八条"
                    || fallback f"《{law}》{article_number}",
                content: result.content              # "处理敏感个人信息应当取得..."
            }
```

### 6.2 RAG 数据流

```
知识库源文件 (knowledge/*.json)
    │
    ▼
[LegalKBLoader.load_all()]
    │
    ├── 解析 LawDocument (Pydantic Model)
    │   ├── law_meta: { law_name, version, jurisdiction }
    │   └── articles: List[Article]
    │       ├── article_id: "PIPL-028"
    │       ├── article_number: "第二十八条"
    │       ├── content: "处理敏感个人信息应当..."
    │       ├── keywords: ["敏感个人信息", "单独同意"]
    │       └── violation_types: ["I1", "I3", "I6"]
    │
    ▼
[VectorStore.initialize(articles)]
    │
    ├── embedding_model.encode(all_article_contents)
    │   → SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    │   → 384维向量
    │
    ├── faiss.normalize_L2(embeddings)  (余弦相似度)
    │
    └── faiss.IndexIDMap(faiss.IndexFlatIP(384))
        └── add_with_ids(embeddings, ids)
        └── persist() → index.faiss + chunks.pkl (磁盘持久化)
```

### 6.3 RAG 降级策略

```
RAG 可用?
  ├── YES → 正常检索，返回 { reference + content }
  └── NO  → 三个层面的降级:
      ├── 1. 模块导入失败 (ImportError)
      │   └── 日志警告 + RAG_AVAILABLE = False
      ├── 2. 知识库目录不存在 (FileNotFoundError)
      │   └── 日志 info (HF Space 无预置知识库属正常情况)
      └── 3. 运行时检索异常 (Exception)
          └── 日志 error + 返回静态兜底
```

---

## 7. 导出报告工作流

### 7.1 导出流程（修复后）

```
用户点击 "导出报告" 按钮
    │
    ▼
[Details.tsx onDownload]
    │
    ▼
[App.tsx handleDownload]
    │
    ▼
[api.exportReport(projectId)]  ★ 优化: 原生 fetch，不走 apiFetch
    │
    ├── const token = localStorage.getItem('token')
    ├── headers = { Authorization: `Bearer ${token}` }
    ├── response = fetch(`/api/v1/export/${projectId}`, { headers })
    ├── text = await response.text()  ← 直接读文本，不做 JSON.parse
    │
    └── Blob(text) → URL.createObjectURL → <a download> 触发下载
        → 文件名: report_{projectId}.txt
```

### 7.2 报告内容生成（后端）

```
GET /api/v1/export/{project_id}
    │
    ├── 查询 project (权限校验: project.user_id == current_user.id)
    │
    ├── violations = json.loads(project.result_json)
    │   ★ 注意: 此处包含用户通过「采纳」回写的 suggested_text
    │
    └── 组装 Markdown 纯文本报告:

        ═══ 隐私政策合规审查报告 ═══
        
        项目名称: {name}
        审查时间: {created_at}
        合规得分: {score}
        风险等级: {risk_level}
        
        违规条款统计
        -----------
        共发现 N 项潜在风险
        
        详细分析
        -------
        1. {indicator} (ID: {violation_id})
           原文: {snippet}
           依据: {legal_basis}
           整改建议: {suggested_text}  ← 采纳后有内容，否则为空
           说明: {reason}
        2. ...
        
    → Response(content=report, media_type="text/plain",
             headers={"Content-Disposition": "attachment; filename=..."})
```

---

## 8. 完整 API 接口参考

### 8.1 接口清单总览

| # | 方法 | 路径 | 认证 | 功能 | 所属模块 |
|---|------|------|------|------|----------|
| 1 | GET | `/health` | 否 | 健康检查 + RAG 状态 | 系统 |
| 2 | GET | `/api/v1/kb/status` | 否 | 知识库状态（法律数量/覆盖率） | RAG |
| 3 | POST | `/api/v1/kb/search` | **是** | 语义检索法律知识库 | RAG |
| 4 | POST | `/api/v1/auth/register` | 否 | 用户注册 | 认证 |
| 5 | POST | `/api/v1/auth/login` | 否 | 用户登录（返回JWT） | 认证 |
| 6 | GET | `/api/v1/auth/me` | **是** | 当前用户信息 | 认证 |
| 7 | POST | `/api/v1/analyze` | **是** | 合规分析（RoBERTa分类+评分） | 核心 |
| 8 | POST | `/api/v1/rectify` | **是** | 条款整改（Phi-4生成，双模式） | 核心 |
| 9 | POST | `/api/v1/upload` | **是** | 文件上传（txt/md/json/csv） | 输入 |
| 10 | POST | `/api/v1/fetch-url` | **是** | URL 内容抓取 | 输入 |
| 11 | GET | `/api/v1/projects` | **是** | 项目列表（历史记录） | 项目 |
| 12 | GET | `/api/v1/projects/{id}` | **是** | 项目详情（含violations） | 项目 |
| 13 | **PUT** | `/api/v1/projects/{id}` | **是** | **更新项目违规数据（采纳回写）★新增** | 项目 |
| 14 | GET | `/api/v1/export/{id}` | **是** | 导出 txt 报告 | 导出 |

### 8.2 各接口详细定义

#### `GET /health`
```json
// Response 200
{
  "status": "healthy",
  "timestamp": "2026-04-18T02:24:22.123456",
  "rag_available": true,
  "rag_initialized": true
}
```

#### `POST /api/v1/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "xxxxxx" }

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "user@example.com", "name": "张三" }
}

// Error 401
{ "detail": "邮箱或密码错误" }
```

#### `POST /api/v1/analyze`
```json
// Request
{
  "text": "本公司可能收集您的位置信息、设备信息...",
  "source_type": "text"  // "text" | "url" | "file"
}

// Response 200
{
  "id": "p1744920000",
  "name": "审查-20260418",
  "score": 58.3,
  "risk_level": "中等风险",
  "violations": [
    {
      "indicator": "过度收集敏感数据",
      "violation_id": "I1",
      "snippet": "本公司可能收集您的位置信息、设备信息...",
      "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条",
      "legal_detail": "处理个人信息应当具有合法、正当、明确目的..."  // RAG条文正文
    },
    {
      "indicator": "未获得明示同意",
      "violation_id": "I3",
      "snippet": "使用本服务即表示您同意我们收集上述信息...",
      "legal_basis": "《个人信息保护法》第十四条",
      "legal_detail": "基于个人同意处理个人信息的，该同意应当由个人在充分知情的前提下..."
    }
  ]
}

// Validation Error 422
{ "detail": [{"loc":["body","text"], "msg":"文本不能为空", "type":"value_error"}] }
```

#### `POST /api/v1/rectify` ⭐ 最复杂接口
```json
// Request
{
  "original_snippet": "本公司可能收集您的位置信息、联系人信息等。",
  "violation_type": "I1",
  "mode": "rewrite",          // "summary" | "rewrite"
  "legal_basis": null          // 可选，前端传入的兜底法律依据（后端优先用RAG）
}

// Response 200 (mode="rewrite")
{
  "suggested_text": "为实现以下服务目的，我们将仅收集必要的信息：（1）位置信息——仅用于导航和附近商家推荐功能；（2）联系人信息——仅在您主动添加紧急联系人时采集。您可随时在「设置-隐私管理」中关闭任一信息的授权，关闭后相关服务将停止使用该信息。",
  "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条",
  "legal_detail": "处理个人信息应当具有合法、正当、明确目的，应当与处理目的直接相关，采取对个人权益影响最小的方式...",
  "mode": "rewrite"
}

// Response 200 (mode="summary")
{
  "suggested_text": "**一句话概括**\n这条条款说公司会收集你的位置、联系人等信息，但没告诉你具体用来干嘛，也没让你选择同不同意。\n\n**通俗解读**\n1. 这条款实际在做什么？就像你进一家店，店员二话不说就开始抄你手机里的通讯录和定位...\n2. 对你有什么影响？...\n3. 合规版本应该长什么样？...",
  "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条",
  "legal_detail": "处理个人信息应当具有合法、正当、明确目的...",
  "mode": "summary"
}

// Error 503 (RAG不可用时仍可工作，仅法律依据降级为静态)
// Error 401 (未登录)
// Error 500 (LLM调用失败)
```

#### `PUT /api/v1/projects/{project_id}` ★ 新增接口
```json
// Request
{
  "violations": [
    {
      "indicator": "过度收集敏感数据",
      "violation_id": "I1",
      "snippet": "本公司可能收集您的位置信息...",
      "legal_basis": "《个人信息保护法》第六条...",
      "legal_detail": "处理个人信息应当具有合法...",
      "suggested_text": "为实现以下服务目的，我们将仅收集..."  // 采纳后的整改文本
    }
  ]
}

// Response 200
{ "message": "更新成功", "id": "p1744920000" }

// Error 404
{ "detail": "项目不存在" }
```

#### `GET /api/v1/export/{project_id}`
```
// Response 200
// Content-Type: text/plain
// Content-Disposition: attachment; filename=report_p1744920000.txt

隐私政策合规审查报告
==================

项目名称: 审查-20260418
审查时间: 2026-04-18 02:24
合规得分: 58.3
风险等级: 中等风险

违规条款统计
-----------
共发现 2 项潜在风险

详细分析
-------

1. 过度收集敏感数据 (ID: I1)
   原文: 本公司可能收集您的位置信息、设备信息...
   依据: 《个人信息保护法》第六条'最小必要'原则及第二十九条
   整改建议: 为实现以下服务目的，我们将仅收集必要的信息...  ← 采纳后有内容
   说明: 过度收集敏感数据

2. 未获得明示同意 (ID: I3)
   原文: 使用本服务即表示您同意我们收集...
   依据: 《个人信息保护法》第十四条
   整改建议: （空——用户尚未对此条款进行整改）
   说明: 未获得明示同意
```

#### 其他辅助接口

**`POST /api/v1/upload`**
```json
// Request: multipart/form-data, field="file"
// Response: { "text": "文件内容文本..." }
```

**`POST /api/v1/fetch-url`**
```json
// Request: { "url": "https://example.com/privacy" }
// Response: { "text": "网页提取的纯文本..." }
// Error 400: { "detail": "无法读取URL内容: ..." }
```

**`GET /api/v1/projects`**
```json
// Response 200: Array<{
//   id, name, score, risk_level, created_at
// }>
```

**`GET /api/v1/kb/status`**
```json
// Response 200
{
  "available": true,
  "version": "1.0.0",
  "laws_count": 4,
  "total_articles": 52,
  "violation_types": ["I1","I2","I3",...,"I12"]
}
```

---

## 9. 前后端数据映射规范

### 9.1 核心映射函数: `mapRawToClause()`

| 后端字段 (snake_case) | 前端字段 (camelCase) | 类型 | 默认值 |
|----------------------|---------------------|------|--------|
| `id` | `id` | `number \| string` | `CL-{1000~9999随机}` |
| `snippet` / `original_text` | `originalText` | `string` | `''` |
| `suggested_text` / `suggestedText` | `suggestedText` | `string` | `'【系统建议】请根据合规要求修改。'` |
| `indicator` / `reason` | `reason` | `string` | `getViolationName(category)` |
| `violation_id` / `category` | `category` | `string \| number` | `raw.violation_id ?? raw.category` |
| `indicator` | `categoryName` | `string` | `getViolationName(category)` |
| `snippet` / `original_text` | `snippet` | `string` | 同 originalText |
| `weight` / `probability` | `weight` | `number` | `getViolationWeight(category)` |
| `probability` / `weight` | `probability` | `number` | 同 weight |
| `risk_level` | `riskLevel` | `string` | `getRiskLevel(weight)` |
| *(无)* | `location` | `string` | `'第{n}节'` |
| `legal_basis` | `legalBasis` | `string` | `''` |
| **`legal_detail`** | **`legalDetail`** | `string \| undefined` | **`undefined`** ★新增 |
| *(无)* | `isAdopted` | `boolean` | `false` |
| *(无)* | `diffOriginalHtml` | `string` | snippet |
| *(无)* | `diffSuggestedHtml` | `string` | `<span class="diff-add">suggestedText</span>` |

### 9.2 风险等级对齐

| 场景 | 后端值 | 前端显示 | 判定条件 |
|------|--------|----------|----------|
| 审查级 (总分) | `"低风险"` | `"低风险"` | `score >= 70` |
| 审查级 (总分) | `"中等风险"` | `"中等风险"` | `40 <= score < 70` |
| 审查级 (总分) | `"高风险"` | `"高风险"` | `score < 40` |
| 句子级 (单条) | *来自 config* | `"高风险"` / `"中度"` / `"低危"` | `weight >= 0.12` / `>=0.08` / `<0.08` |

### 9.3 12 类违规指标对齐（前后端单一数据源）

**后端**: `violation_config.py` → `INDICATORS` dict
**前端**: `src/config/violation-config.ts` → `VIOLATION_DETAILS` array

两者必须严格一致：

| ID | 名称 | 权重 | 风险 | 维度 |
|----|------|------|------|------|
| I1 | 过度收集敏感数据 | 0.15 | high | 数据收集 |
| I2 | 未说明收集目的 | 0.12 | high | 数据收集 |
| I3 | 未获得明示同意 | 0.15 | high | 数据收集 |
| I4 | 收集范围超出服务需求 | 0.10 | medium | 数据收集 |
| I5 | 未明确第三方共享范围 | 0.08 | medium | 数据共享 |
| I6 | 未获得单独共享授权 | 0.12 | high | 数据共享 |
| I7 | 未明确共享数据用途 | 0.08 | medium | 数据共享 |
| I8 | 未明确留存期限 | 0.05 | low | 数据留存 |
| I9 | 未说明数据销毁机制 | 0.05 | low | 数据留存 |
| I10 | 未明确用户权利范围 | 0.05 | low | 用户权利 |
| I11 | 未提供便捷权利行使途径 | 0.03 | low | 用户权利 |
| I12 | 未明确权利响应时限 | 0.02 | low | 用户权利 |

**权重合计 = 1.00**

---

## 10. 环境变量与部署配置

### 10.1 必需环境变量

| 变量名 | 示例值 | 必需 | 说明 |
|--------|--------|------|------|
| `SECRET_KEY` | `changeme-...` | **是** | JWT 签名密钥，生产环境必须更换强密钥 |
| `HF_TOKEN` | `hf_xxxx` | **是** | HuggingFace Token，用于下载 RoBERTa ckpt + 嵌入模型 |
| `GITHUB_TOKEN` | `github_pat_xxxx` | 推荐 | GitHub Models Token，用于 Phi-4 免费推理 |

### 10.2 可选环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `LLM_MODE` | `github` | LLM 推理模式: `github`(推荐) / `local`(GGUF) / `hf`(HF Inference API) |
| `LLM_MODEL_ID` | `Phi-4-mini-instruct` | GitHub Models 上的模型 ID |
| `VITE_API_URL` | *(空)* | 前端: 设置后禁用 Vite 代理，直连外部 API |

### 10.3 部署架构

```
开发环境 (Dev):
  前端: Vite dev server (:5000) --proxy--> 后端 uvicorn (:7860)
  
生产环境 (Prod):
  前端: Cloudflare Pages (sy-s-web.pages.dev)
  后端: HuggingFace Spaces (自带 GPU/CPU)
  CORS: 已允许 sy-s-web.pages.dev + localhost:5000
```

### 10.4 `.coze` 配置

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]   # Vite :5000 + HMR

[deploy]
build = ["pnpm", "run", "build"]
run = ["npx", "server", "-l", "5000"]  # 静态文件服务
```

---

## 11. 错误码与降级策略

### 11.1 HTTP 错误码

| 状态码 | 含义 | 触发场景 | 前端处理 |
|--------|------|----------|----------|
| 400 | Bad Request | URL 无法读取 / 参数校验失败 | 显示 `error.detail` |
| 401 | Unauthorized | Token 无效/过期 | 清除 localStorage → 跳转登录页 |
| 403 | Forbidden | HF Inference API 无权限 | 显示错误提示 |
| 404 | Not Found | 项目不存在 | 显示错误提示 |
| 422 | Validation Error | Pydantic 校验失败 | 显示具体字段错误 |
| 500 | Server Error | 后端内部异常 | 显示通用错误信息 |
| 503 | Service Unavailable | RAG 模块不可用 | 降级为静态配置 |

### 11.2 全局异常处理

```python
# app.py HTTPException handler
→ 返回统一格式:
{
  "error": {
    "code": "HTTP_ERROR",
    "message": str(exc.detail),
    "timestamp": "2026-04-18T02:24:22Z"
  }
}
```

### 11.3 三层降级策略

```
Layer 1: RAG 降级
  RAG 检索失败 → 使用 violation_config.py 静态 legal_basis 引用
  影响: 合规依据只有编号无正文（不影响核心功能）

Layer 2: LLM 模式降级
  github 失败 → local 失败 → hf (最终兜底)
  影响: 整改建议不可用（分析功能正常）

Layer 3: 前端容错
  rectify API 调用失败 → Drawer 显示错误 toast
  export 失败 → catch 显示"导出失败"
  分析取消 → AbortError 静默处理
```

---

## 附录 A: 文件变更清单（本次审查修复）

| 文件 | 变更类型 | 变更内容 |
|------|----------|----------|
| `sy-s-web/src/utils/api.ts` | 修改 | rectify 返回类型加 `legal_detail`；新增 `updateProject`；`exportReport` 改原生 fetch |
| `sy-s-web/src/types.ts` | 修改 | Clause 接口加 `legalDetail?`；`mapRawToClause` 映射 `legal_detail` |
| `sy-s-web/src/components/Drawer.tsx` | 修改 | 新增 `localLegalDetail` state；缓存存取 detail；展示区域渲染法律条文正文；采纳带 legalDetail |
| `sy-s-web/src/App.tsx` | 修改 | `handleAdopt` 新增 `api.updateProject` 回写后端 |
| `sy-s-web-backend/app.py` | 修改 | 新增 `PUT /api/v1/projects/{id}` 接口；`GITHUB_TOKEN` 空值校验；删除重复 `BertModel` 导入 |
| `sy-s-web-backend/violation_config.py` | 修改 | 删除 ~120 行死代码（未启用的 Prompt 模板） |

## 附录 B: 已知限制与未来优化方向

| 编号 | 限制 | 影响 | 建议 |
|------|------|------|------|
| L1 | 不支持 PDF 上传 | 用户无法直接上传 PDF 隐私政策 | 集成 pdfplumber 或前端 pdf.js |
| L2 | `@app.on_event("startup")` 废弃 API | FastAPI 升级后可能报警告 | 重构为 `lifespan` context manager |
| L3 | SQLite 单文件数据库 | 并发写入可能锁冲突 | 生产环境换 PostgreSQL |
| L4 | 分析结果中的 `suggested_text` 仅在用户手动「采纳」后才写入 DB | 未采纳的条款导出时无整改建议 | 可考虑分析完成后自动批量预生成 |
| L5 | 前端 `implicit any` TS 警告 | IDE 补全不完全 | 逐步补全所有回调参数的类型注解 |
