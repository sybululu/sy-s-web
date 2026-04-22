# 隐私政策合规智能审查平台 — 系统级全链路工作流文档（详细版）

> **项目**: sy-s-web (PrivacyGuard / 智审合规)  
> **版本**: v2.0 — 系统架构与全链路工作流  
> **范围**: 前端 + 后端 + AI模型 + 数据库 + 接口协议 + 完整数据流转

---

## 目录

- [一、系统全景架构](#一系统全景架构)
  - [1.1 技术栈分层图](#11-技术栈分层图)
  - [1.2 部署拓扑](#12-部署拓扑)
  - [1.3 单项目双模式架构详解](#13-单项目双模式架构详解)
- [二、后端架构深度解析](#二后端架构深度解析)
  - [2.1 FastAPI 应用结构](#21-fastapi-应用结构)
  - [2.2 数据库模型 (SQLite + SQLAlchemy)](#22-数据库模型)
  - [2.3 RoBERTa-MoE 分类模型](#23-roberta-moe-分类模型)
  - [2.4 RAG 法律知识库检索引擎](#24-rag-法律知识库检索引擎)
  - [2.5 Phi-4 整改建议生成模块](#25-phi-4-整改建议生成模块)
  - [2.6 评分与风险等级计算引擎](#26-评分与风险等级计算引擎)
- [三、前端架构深度解析](#三前端架构深度解析)
  - [3.1 状态管理中心 (App.tsx)](#31-状态管理中心-apptsx)
  - [3.2 后端→前端数据映射层 (types.ts)](#32-后端前端数据映射层-typests)
  - [3.3 API 请求封装层 (api.ts)](#33-api-请求封装层-apits)
  - [3.4 组件树与数据流向](#34-组件树与数据流向)
- [四、核心工作流：完整审查链路](#四核心工作流完整审查链路)
  - [4.1 工作流总览图](#41-工作流总览图)
  - [4.2 阶段一：输入预处理](#42-阶段一输入预处理)
  - [4.3 阶段二：句子分割与分类](#43-阶段二句子分割与分类)
  - [4.4 阶段三：RAG 法律检索](#44-阶段三rag-法律检索)
  - [4.5 阶段四：评分与聚合](#45-阶段四评分与聚合)
  - [4.6 阶段五：前端展示与聚合](#46-阶段五前端展示与聚合)
- [五、核心工作流：整改建议链路](#五核心工作流整改建议链路)
  - [5.1 Rewrite 模式完整链路](#51-rewrite-模式完整链路)
  - [5.2 Summary 模式完整链路](#52-summary-模式完整链路)
  - [5.3 缓存与采纳机制](#53-缓存与采纳机制)
- [六、核心工作流：认证与会话管理](#六核心工作流认证与会话管理)
- [七、接口协议完整定义](#七接口协议完整定义)
- [八、12类违规体系完整定义](#八12类违规体系完整定义)
- [九、已知问题与修复记录](#九已知问题与修复记录)

---

## 一、系统全景架构

### 1.1 技术栈分层图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户层 (User Interface)                       │
│                                                                     │
│   ┌──────────────────┐         ┌──────────────────┐                │
│   │   营销站 (未登录)    │         │   B端产品 (已登录)   │                │
│   │                   │         │                   │                │
│   │ Landing / Pricing │◄──登录──►│ Overview / Details │                │
│   │ Login / Register  │         │ NewTask / History  │                │
│   └────────┬──────────┘         └────────┬──────────┘                │
│            │                              │                          │
│            └──────────┬───────────────────┘                          │
│                       ▼                                              │
│            ┌──────────────────┐                                     │
│            │  React 19 SPA     │  ← 单代码仓库, 双运行模式             │
│            │  TypeScript 5     │                                     │
│            │  Tailwind CSS 4   │                                     │
│            │  Motion + GSAP    │                                     │
│            └────────┬─────────┘                                     │
└─────────────────────┼───────────────────────────────────────────────┘
                      │ HTTP/JSON (REST API)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API 网关层 (FastAPI)                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    app.py (主入口)                            │   │
│   │                                                              │   │
│   │  /api/v1/auth/*     → 认证路由组 (login/register/me)          │   │
│   │  /api/v1/analyze    → 核心分析路由 (BERT + RAG + 评分)        │   │
│   │  /api/v1/rectify    → 整改建议路由 (Phi-4 LLM)               │   │
│   │  /api/v1/upload     → 文件上传路由                            │   │
│   │  /api/v1/fetch-url  → URL抓取路由                             │   │
│   │  /api/v1/projects/* → 项目CRUD路由                            │   │
│   │  /api/v1/export/*   → 导出报告路由                             │   │
│   │  /health            → 健康检查                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AI 推理引擎     │  │   RAG 检索引擎    │  │   持久化存储      │
│                 │  │                 │  │                 │
│ RoBERTa-MoE     │  │ Sentence-Trans  │  │ SQLite           │
│ (分类)          │  │ (Embedding)     │  │ + SQLAlchemy ORM  │
│                 │  │ FAISS Index     │  │                  │
│ Phi-4 Mini      │  │ 141条法律条文     │  │ projects 表       │
│ (整改生成)       │  │ 4部法律法规      │  │ users 表          │
│                 │  │ 全库语义搜索      │  │                  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 1.2 部署拓扑

```
                        ┌─────────────────┐
                        │   用户浏览器       │
                        │   (Chrome/Edge)  │
                        └────────┬────────┘
                                 │ HTTPS
                                 ▼
                        ┌─────────────────┐
                        │ Cloudflare CDN   │  ← 静态资源缓存
                        │ Pages Edge Node  │  ← 全球 ~300 POP
                        │ SPA: index.html  │
                        └────────┬────────┘
                                 │ API Proxy (同源或跨域)
                                 ▼
                        ┌─────────────────┐
                        │ HuggingFace      │  ← 后端部署
                        │ Spaces           │
                        │                  │
                        │  FastAPI :7860   │
                        │  ├─ RoBERTa GPU  │
                        │  ├─ Phi-4 API    │
                        │  ├─ FAISS 内存   │
                        │  └─ SQLite 文件  │
                        └─────────────────┘

开发环境:
  前端 Vite Dev Server (:5000) --proxy--> localhost:7860 (FastAPI)
```

### 1.3 单项目双模式架构详解

**设计决策**: 同一个 React 应用根据 `isLoggedIn` 状态渲染完全不同的 UI。

```
                    main.tsx 入口
                         │
                <BrowserRouter>
                      <App />
                         │
              ┌──────────┴──────────┐
              │  useEffect: 检查     │
              │  localStorage token  │
              └──────────┬──────────┘
                    有/无 token
                   ╱          ╲
                  ╱            ╲
    ┌─────────────▼┐    ┌───────▼──────────┐
    │  isLoggedIn   │    │  !isLoggedIn      │
    │  = true       │    │  = false          │
    └───────┬───────┘    └───────┬──────────┘
            │                     │
    ┌───────▼───────┐    ┌───────▼──────────┐
    │ B端产品布局     │    │ React Router      │
    │               │    │ Routes 分发        │
    │ ┌───────────┐ │    │                   │
    │ │ Sidebar   │ │    │ /  → Landing       │
    │ │ Header    │ │    │ /pricing → Pricing │
    │ │ Main Area │ │    │ /login  → AuthPage │
    │ │ Drawer    │ │    │                   │
    │ │ Toast     │ │    │ 营销站布局:        │
    │ └───────────┘ │    │ Navbar + Content   │
    │               │    │ + Footer           │
    │ currentView   │    │                   │
    │ 状态机切换:    │    │ CTA拦截:           │
    │ overview       │    │ "立即体验"按钮     │
    │ new-task       │    │ → navigate(/login) │
    │ details        │    │                   │
    │ history        │    └───────────────────┘
    └───────────────┘
```

**为什么不用 Router 管理 B端视图？**
- B端产品是工具型界面，不需要 URL 导航（无前进/后退需求）
- 避免 `/overview` 与营销站路由冲突
- 视图切换更轻量（只改 state，不触发路由重渲染）

---

## 二、后端架构深度解析

### 2.1 FastAPI 应用结构

```
backend/
├── app.py                  # 主入口: FastAPI app + 所有路由 + startup/shutdown
├── config.py               # 配置: LLM_MODE, HF_TOKEN, GITHUB_TOKEN, knowledge_dir 等
├── models.py               # Pydantic 模型: Article, SearchResult, AnalyzeRequest/Response 等
├── classifier/
│   ├── __init__.py         # roberta_predict() 主函数
│   ├── model_loader.py     # 加载 RoBERTa checkpoint (AutoModelForSequenceClassification)
│   └── mapper.py           # 11类原始输出 → 12类违规映射 + 双重阈值过滤
├── rag/
│   ├── __init__.py         # get_legal_basis_from_rag() 主函数
│   ├── loader/
│   │   └── legal_kb_loader.py  # LegalKBLoader: 加载 JSON 法律文件 → Article[]
│   ├── store/
│   │   └── vector_store.py    # VectorStore: FAISS 索引 + SentenceTransformer 编码
│   └── search/
│       └── retriever.py       # Retriever: 组合 loader + store, 提供 retrieve_by_violation_type()
├── rectifier/
│   ├── __init__.py         # rectify() 主函数
│   ├── prompts.py          # Prompt 模板: summary_mode_prompt / rewrite_mode_prompt
│   └── llm_client.py       # LLM 客户端: github(local/hf 三种模式)
├── analyzer.py             # analyze() 核心函数: 句子分割→分类→RAG→评分→入库
├── database.py             # SQLAlchemy engine + Session + Base + Project/User 模型
├── auth.py                 # JWT 创建/验证 + 密码哈希 + login/register 依赖函数
└── requirements.txt        # Python 依赖
```

#### app.py 路由注册表

```python
app = FastAPI(title="PrivacyGuard API")

# === 认证 ===
@app.post("/api/v1/auth/register")  → auth.register()
@app.post("/api/v1/auth/login")     → auth.login()
@app.get ("/api/v1/auth/me")         → auth.get_current_user()

# === 核心 AI ===
@app.post("/api/v1/analyze")         → analyzer.analyze_text()    # ★ 最重要
@app.post("/api/v1/rectify")         → rectifier.rectify()        # ★ 最重要

# === 输入处理 ===
@app.post("/api/v1/upload")          → analyzer.upload_file()
@app.post("/api/v1/fetch-url")       → analyzer.fetch_url()

# === 项目管理 ===
@app.get    ("/api/v1/projects")      → database.get_projects()
@app.get    ("/api/v1/projects/{id}") → database.get_project()
@app.put    ("/api/v1/projects/{id}") → database.update_project()

# === 导出 ===
@app.get    ("/api/v1/export/{id}")   → database.export_report()

# === 系统 ===
@app.get    ("/health")               → {"status": "ok"}
@app.get    ("/api/v1/kb/status")     → RAG 初始化状态
@app.post   ("/api/v1/kb/search")     → 手动测试 RAG 检索

# === 生命周期 ===
@app.on_event("startup")  → initialize_rag() + load_classifier()
@app.on_event("shutdown") → cleanup (如有)
```

### 2.2 数据库模型 (SQLite + SQLAlchemy)

```python
# database.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id          = Column(Integer, primary_key=True, autoincrement=True)
    email       = Column(String(255), unique=True, nullable=False, index=True)
    username    = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)  # bcrypt 哈希
    name        = Column(String(100), nullable=True)     # 显示名称
    created_at  = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"
    
    id          = Column(Integer, primary_key=True, autoincrement=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name        = Column(String(500), nullable=False)           # 来源名称(文件名/URL)
    score       = Column(Float, default=100.0)                  # 合规得分 0~100
    risk_level  = Column(String(20), default="低风险")          # 低风险/中等风险/高风险
    raw_text    = Column(Text, nullable=True)                   # 原始隐私政策文本
    result_json = Column(Text, nullable=True)                   # JSON: 违规列表+分数等完整结果
    source_type = Column(String(20), default="text")            # text/url/file
    created_at  = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**关键设计决策**:
- `result_json` 字段存储完整的分析结果 JSON（violations + sentence_results），避免额外的关联表
- 这是 **JSON-in-SQLite** 模式——简单场景下比关联表更高效
- `raw_text` 存储原文用于导出报告时引用上下文

**数据库操作函数**:

| 函数 | SQL 操作 | 用途 |
|------|---------|------|
| `get_projects(user_id)` | `SELECT * FROM projects WHERE user_id=? ORDER BY created_at DESC` | 首页项目列表 |
| `get_project(user_id, project_id)` | `SELECT * FROM projects WHERE id=? AND user_id=?` | 加载详情 |
| `create_project(user_id, data)` | `INSERT INTO projects (...) VALUES (...)` | 分析完成后创建 |
| `update_project(user_id, project_id, violations)` | `UPDATE projects SET result_json=?, updated_at=? WHERE id=? AND user_id=?` | 采纳整改后更新 |
| `export_report(user_id, project_id)` | `SELECT * FROM projects WHERE id=? AND user_id=?` → 格式化文本 | 导出 |

### 2.3 RoBERTa-MoE 分类模型

#### 模型规格

| 属性 | 值 |
|------|-----|
| 基座模型 | `hfl/chinese-roberta-wwm-ext` (华为中文 RoBERTa) |
| 任务类型 | 11 类文本序列分类 (Sentence Classification) |
| 输出层 | `num_labels=11`, sigmoid 激活 (多标签) |
| Tokenizer | 对应的 RoBERTaTokenizer |
| 设备 | CUDA (GPU) 或 CPU fallback |

#### 11 个原始类别 → 12 类违规映射

```
原始类别索引 (0-10)          映射目标 (I1-I12)
─────────────────           ─────────────────
0: 数据收集           ──→   I1(过度收集) + I4(超出范围)
1: 权限获取           ──→   I3(未获明示同意)
2: 共享转让           ──→   I5(第三方范围) + I6(单独授权) + I7(共享用途)
3: 使用目的           ──→   I2(未说明目的)
4: 存储方式           ──→   I8(留存期限)
5: 安全措施           ──→   I9(销毁机制)
6: 特殊人群           ──→   I3(复用: 未获明示同意)
7: 权限管理           ──→   I10(用户权利) + I12(响应时限)
8: 联系方式           ──→   I11(行使途径)
9: 政策变更           ──→   I11(复用: 行使途径)
10: 停止运营          ──→   I9(复用: 销毁机制)
```

**注意**: 一个原始类别可以映射到 **多个** 违规 ID（如类别0映射到 I1+I4）。这是"一对多"映射。

#### 双重阈值过滤机制

```python
# mapper.py

CONFIDENCE_THRESHOLD = 2.0   # logits 最高值与次高值的差值 ≥ 2.0
PROB_THRESHOLD = 0.6          # 最大概率 ≥ 0.6

def map_to_12_classes(probs, confidence=None):
    """
    probs: List[float], 长度=11, sigmoid 输出的每个类别的概率
    confidence: float | None, logits 差值
    
    返回: List[str], 如 ["I1", "I4"] 或 [] (无违规)
    """
    max_idx = probs.index(max(probs))
    max_prob = probs[max_idx]
    
    # 双重阈值: 必须同时满足才触发
    if confidence is not None:
        if confidence < CONFIDENCE_THRESHOLD or max_prob < PROB_THRESHOLD:
            return []  # 不满足 → 静默跳过，不算违规
    
    return ID_MAPPING.get(max_idx, [])
```

**阈值调优历史**:
- `CONFIDENCE_THRESHOLD`: 原 `3.0` → 现 `2.0`（降低以提高检出率，减少漏报）
- `PROB_THRESHOLD`: 固定 `0.6`（经验值，平衡精确率和召回率）

#### 推理流程 (`roberta_predict()`)

```python
def roberta_predict(sentence: str) -> dict:
    """
    输入: 一句中文文本
    输出: {
        'mapped': ['I1', 'I4'],        # 映射后的违规ID列表
        'raw_probs': [0.23, 0.85, ...], # 11个原始概率
        'confidence': 3.42,             # logits差值
        'max_class_idx': 0,             # 最大概率的原始类别索引
        'max_prob': 0.85,               # 最大概率值
        'class_name': '数据收集'         # 原始类别中文名
    }
    """
    # Step 1: Tokenize
    inputs = tokenizer(
        sentence,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )
    
    # Step 2: Forward pass
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0]  # shape: (11,)
        probs = torch.sigmoid(logits).tolist()  # 多标签sigmoid
    
    # Step 3: 取top-2计算置信度
    top2 = torch.topk(logits, 2)
    confidence = (top2.values[0] - top2.values[1]).item()
    
    # Step 4: 映射到12类
    mapped = map_to_12_classes(probs, confidence)
    
    # Step 5: 获取类别名
    class_names = ['数据收集','权限获取','共享转让','使用目的',
                   '存储方式','安全措施','特殊人群','权限管理',
                   '联系方式','政策变更','停止运营']
    
    return {
        'mapped': mapped,
        'raw_probs': probs,
        'confidence': confidence,
        'max_class_idx': int(torch.argmax(logits).item()),
        'max_prob': max(probs),
        'class_name': class_names[int(torch.argmax(logits).item())],
    }
```

### 2.4 RAG 法律知识库检索引擎

#### 架构层次

```
initialize_rag() [app.py startup]
    │
    ├── Config (config.py)
    │   knowledge_dir = "./knowledge"
    │   embedding_model = "paraphrase-multilingual-MiniLM-L12-v2"
    │
    ├── LegalKBLoader (loader/legal_kb_loader.py)
    │   ├── load_all()
    │   │   ├── _load_laws_from_dir("knowledge/laws/")
    │   │   │   └─ 解析 *.json → LawDocument → Article[]
    │   │   ├── _load_laws_from_dir("knowledge/custom_laws/")
    │   │   ├── _load_mappings() → violation_mapping.json
    │   │   └─ _build_violation_index()
    │   └─ 结果: LoadedKnowledge { articles[], laws[], violation_index{} }
    │
    ├── VectorStore (store/vector_store.py)
    │   ├── restore() 尝试从磁盘恢复 vector_store/
    │   │   ├── index.faiss (FAISS 二进制索引)
    │   │   └── chunks.pkl (Article 元数据 pickle)
    │   └─ 若恢复失败 → initialize(articles)
    │       ├── SentenceTransformer.encode(all_texts)  # 向量化
    │       ├── faiss.normalize_L2(embeddings)         # L2归一化
    │       └── IndexFlatIP(dimension).add_with_ids(embeddings, ids)
    │
    └── Retriever (search/retriever.py)
        └── 组合 loader + vector_store
            └── expose: retrieve_by_violation_type(violation_type, context, top_k)
```

#### 知识库数据源

```
knowledge/
├── laws/                          # 内置法律 (~141条)
│   ├── pipl.json                  # 个人信息保护法 (47条)
│   │   { law_name: "个人信息保护法",
│   │     articles: [
│   │       { article_number: "第六条",
│   │         title: "处理个人信息的基本原则",
│   │         content: "处理个人信息应当具有合法、正当...",
│   │         keywords: ["最小必要", "目的明确", "公开透明"],
│   │         violation_types: ["I1", "I4"]
│   │       }, ...
│   │     ]}
│   ├── dsl.json                   # 数据安全法 (30条)
│   ├── csl.json                   # 网络安全法 (30条)
│   └── gb_35273.json             # GB/T 35273-2020 信息安全 个人信息安全规范 (34条)
│
├── custom_laws/                   # 自定义法律扩展目录 (空)
│
└── mapping/
    └── violation_mapping.json     # 违规类型→法律条款额外映射配置
```

#### Article 数据模型

```python
# models.py
class Article(BaseModel):
    article_id: str              # 如 "PIPL-006" (法律缩写-序号)
    article_number: str           # 如 "第六条"
    title: str                    # 如 "处理个人信息的基本原则"
    content: str                  # 法律条文完整原文
    keywords: List[str]           # 如 ["最小必要", "目的明确", "公开透明"]
    violation_types: List[str]    # 关联的违规类型, 如 ["I1", "I4"]
```

#### 全库语义检索策略 (当前方案)

**旧策略 (已废弃)**: 按 `violation_types` 字段硬过滤 → 只在预标注的同类别条文中检索 → **容易漏检**

**新策略 (当前)**: 全库自由语义检索 → 在全部 141 条中按相似度排序 → **覆盖面最大**

```
调用链:
get_legal_basis_from_rag(violation_type="I1", context=sentence)
    │
    ▼
retriever.retrieve_by_violation_type("I1", context=sentence, top_k=5)
    │
    ▼
vector_store.search_by_violation("I1", context=sentence, top_k=5)
    │
    ├── Step 1: 构建查询文本
    │   query = f"{context} {get_violation_keywords('I1')}"
    │   例: "我们会收集您的位置信息... 过度收集 敏感数据 最小必要 超范围收集"
    │
    ├── Step 2: 向量编码
    │   query_embedding = model.encode([query])
    │   faiss.normalize_L2(query_embedding)
    │
    ├── Step 3: FAISS 相似度搜索 (全库 141 条, 不过滤!)
    │   scores, indices = index.search(query_embedding, top_k * 2)  # 取2倍候选
    │   → 返回按余弦相似度降序排列的结果
    │
    └── Step 4: 转换为 SearchResult 结构
        → law_reference = "《个人信息保护法》第六条；网络安全法第四十一条"
        → content = 完整条文正文
```

#### 违规关键词增强表

| 违规 ID | 检索关键词 (拼接到 query 后面) |
|---------|------------------------------|
| I1 | 过度收集 敏感数据 最小必要 超范围收集 |
| I2 | 收集目的 未说明 目的不明确 |
| I3 | 明示同意 未获得同意 捆绑授权 默认勾选 |
| I4 | 超出服务需求 收集范围 过度 非必要 |
| I5 | 第三方共享 未告知 接收方 合作伙伴 |
| I6 | 单独同意 第三方共享授权 单独征得 |
| I7 | 共享用途 数据用途 不明确 扩大用途 |
| I8 | 留存期限 存储期限 未明确 保存时间 |
| I9 | 销毁机制 数据删除 匿名化 处理方式 |
| I10 | 用户权利 知情权 更正权 删除权 撤回同意 |
| I11 | 权利行使途径 渠道 便捷 在线申请 |
| I12 | 响应时限 处理期限 时间承诺 工作日 |

#### RAG 返回数据结构

```python
# get_legal_basis_from_rag() 返回值
{
    "reference": "《个人信息保护法》第六条；网络安全法第四十一条",
    # 逗号分隔格式 → 用于简洁展示 (如表格中的"法律依据"列)

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
    # 结构化列表 → 用于前端 Drawer 的"合规依据"区域展示

    "content": "处理个人信息应当具有合法、正当...\n\n网络运营者收集、使用..."
    # 所有正文的拼接版, 每条截断200字 → 注入 LLM prompt (控制token数)
}
```

### 2.5 Phi-4 整改建议生成模块

#### LLM 三种调用模式

| 模式 | 环境变量 `LLM_MODE` | 调用方式 | 说明 |
|------|---------------------|---------|------|
| **github** (推荐/默认) | `"github"` | OpenAI 兼容 API | GitHub Models 免费 Phi-4 Mini |
| **local** | `"local"` | llama-cpp-python | 本地 GGUF Q6_K 量化模型 |
| **hf** (fallback) | `"hf"` | HuggingFace InferenceClient | HF Inference API |

**Token 分工**:
- `HF_TOKEN`: 仅用于下载模型权重 (RoBERTa checkpoint、嵌入模型等)
- `GITHUB_TOKEN`: 用于 GitHub Models 推理 API 调用

#### github 模式初始化

```python
# rectifier/llm_client.py
from openai import OpenAI

llm_github = OpenAI(
    base_url="https://models.inference.ai.azure.com",  # GitHub Models endpoint
    api_key=GITHUB_TOKEN,
)
```

#### 整改接口完整内部流程

```
POST /api/v1/rectify
Body: { original_snippet, violation_type, mode, legal_basis? }
         │
         ▼
    ┌──────────────────────────────────────────────┐
    │           rectifier.rectify()                │
    │                                              │
    │  ① RAG 检索法律依据                          │
    │     get_legal_basis_from_rag(                │
    │       violation_type,                        │
    │       context=original_snippet               │
    │     )                                        │
    │     → legal_reference (引用格式)              │
    │     → legal_content (条文正文, 截断200字/条)   │
    │     → legal_references (完整结构化列表)        │
    │                                              │
    │  ② 获取违规提示语                             │
    │     ID_TO_HINT[violation_type]                │
    │     例: "涉及收集个人信息，必须遵守最小必要..."  │
    │                                              │
    │  ③ 根据 mode 构建 Prompt                     │
    │     mode=="rewrite" → rewrite_mode_prompt()   │
    │     mode=="summary" → summary_mode_prompt()   │
    │                                              │
    │  ④ 调用 LLM                                  │
    │     response = llm.chat.completions.create(   │
    │       model="Phi-4-mini-instruct",            │
    │       messages=[system, user],                │
    │       max_tokens=256,  temperature=0.3        │
    │     )                                         │
    │     suggested_text = response.choices[0]      │
    │       .message.content                        │
    │                                              │
    │  ⑤ 返回                                      │
    │     { suggested_text, legal_basis,            │
    │       legal_detail, mode }                    │
    └──────────────────────────────────────────────┘
```

#### Prompt 设计: Rewrite 模式 (v2.1 版本)

**设计原则 — 解决 Phi-4 Mini「复读」问题**:

> **问题根因**: Phi-4 Mini 等小模型有强烈的「输入复述」倾向——prompt 中出现多少法律文本，
> 模型就会在输出中复述多少。
>
> **解决策略**:
> 1. **prompt 中零法律文本** — 不出现任何法律条文原文
> 2. **违规类型 → 具体编辑指令映射** — 告诉模型「怎么改」而非「违反了什么法」
> 3. **before→after 示例驱动** — 用两个具体示例锁定输出格式
> 4. **极简 prompt 结构** — 减少输入材料 = 减少可复述内容

**System Role**:
```
你是隐私政策编辑。输入有问题的条款，输出修改后的干净版本。
不解释、不引用法律、不加标题。像用查找替换工具改文章一样工作。
```

**User Content**:
```
你是一位隐私政策文案编辑。你的任务只有一项：修改下面这段隐私政策条款，使其合规。

【原条款】
{original_snippet}

【修改要求】
{edit_instruction}   # ← 根据 violation_type 从 EDIT_INSTRUCTIONS 字典选取

【示例】
原句：「为了提供更好的服务，我们可能会收集您的位置信息、通讯录等。」
修改后：「在使用地图导航功能时，我们会收集您的位置信息，
用于实时导航和路线规划。您可以随时在设置中关闭。」

原句：「注册即视为您已同意本政策全部条款。」
修改后：「请您仔细阅读本政策。勾选'我同意'并完成注册，
即表示您已知晓并同意以下内容。您可以随时撤回同意。」

【现在请修改上面的原条款】
直接输出修改后的文字，不要任何解释、标注、引用。
```

**EDIT_INSTRUCTIONS 字典 (12 类违规 → 具体编辑指令)**:

| 违规ID | 编辑指令 |
|--------|----------|
| I1 | 删除或缩小敏感数据收集范围。只保留与核心功能直接相关的信息类型，加上'仅限于用户主动使用该功能时'的限定语。 |
| I2 | 在每项信息收集后面补上具体用途说明，格式为'用于[具体功能]'。删除'提升体验''业务需要'等模糊表述。 |
| I3 | 把默认同意改为主动选择。加上'您可以选择是否'前缀，删除'即视为同意''注册即表示'等捆绑表述。 |
| I4 | 删除与服务核心功能无关的信息收集项。保留的每项都要能回答'这个功能为什么需要它'。 |
| I5 | 把'合作伙伴''第三方'替换为具体类型（如'支付服务商''物流配送方'），并列出共享的数据种类。 |
| I6 | 在第三方共享描述前加上'我们将单独征得您的同意后'，明确区分于主政策同意。 |
| I7 | 在第三方共享描述后补充具体用途，如'仅用于[指定目的]，不得用于其他用途'。 |
| I8 | 为每类数据添加留存时限，格式为'保存期限为[时间]，届满后将删除或匿名化'。 |
| I9 | 补充销毁说明：'保存期限届满后，我们将采取[技术手段]删除或匿名化处理'。 |
| I10 | 列举用户权利项目：查询、更正、删除、撤回同意、获取可携带副本、投诉举报。 |
| I11 | 提供具体联系方式：在线入口路径、邮箱地址、客服热线，加上'我们将在[时限]内响应'。 |
| I12 | 加上具体时限承诺：'将在收到请求后15个工作日内处理并反馈结果'。 |

**LLM 调用参数**:
- `max_tokens`: **256** (从512降低，强制短输出，减少复读空间)
- `temperature`: **0.3** (低温度保证稳定性)
- `model`: **Phi-4-mini-instruct**

#### Prompt 设计: Summary 模式 (v2.1 版本)

**System Role**:
```
你是一个擅长把复杂文件翻译成普通人能听懂的话的人。
你的回答应该像一个懂行的朋友在给不懂技术的朋友解释事情。
简短、直接、有例子。
```

**User Content**:
```
请用大白话帮我理解下面这条隐私政策条款有什么问题。
不要用任何专业术语，就像跟朋友聊天一样解释。

【条款原文】
{original_snippet}

【这条条款的核心问题】
{core_issue}   # ← 根据 violation_type 从 VIOLATION_CORE_ISSUE 字典选取

请分两部分回答：

第一部分：这句话到底什么意思
用一句大白话翻译这句条款，说出它实际上在干什么。（不要重复原文，用自己的话重新表述）

第二部分：现实中会怎样
先说"实际情况："然后解释这个条款在实际运作中是怎么影响用户的。
再说"最坏情况："一句话说如果被滥用会有什么后果。
```

**VIOLATION_CORE_ISSUE 字典 (12 类 → 一句话问题本质)**:

| 违规ID | 问题本质描述 |
|--------|-------------|
| I1 | 这条条款在收集敏感个人信息（如生物识别、健康、位置、通讯录），但没有说明为什么需要这些信息，也没有限制收集范围。 |
| I2 | 这条条款在收集用户信息，但没有说清楚收集每项信息的具体用途，用了模糊的说法。 |
| I3 | 这条条款把同意和服务捆绑在一起，用户没有真正的选择权——不同意就不能用。 |
| I4 | 这条条款收集的信息超出了提供服务实际需要的范围。 |
| I5 | 这条条款提到向第三方共享用户信息，但没有说清楚共享给谁、共享什么。 |
| I6 | 这条条款在向第三方提供用户信息时，没有取得用户的单独同意。 |
| I7 | 这条条款允许第三方使用用户数据，但没有限定使用的具体目的和范围。 |
| I8 | 这条条款没有说明收集的数据会保存多久。 |
| I9 | 这条条款没有说明数据保存期限到了之后怎么处理（删除或匿名化）。 |
| I10 | 这条条款没有完整告知用户对自己数据享有哪些权利。 |
| I11 | 这条条款虽然提到了用户权利，但没有给出方便行使这些权利的具体方式。 |
| I12 | 这条条款没有承诺在多长时间内响应用户的权利请求。 |

### 2.6 评分与风险等级计算引擎

#### 违规扣分逻辑

```
analyze() 内部循环:
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
│   penalty = Σ( INDICATORS[v_id]["weight"] × flag  for each v_id )
│   # 注意: 每种违规类型只扣一次权重（无论多少句子触发）
│
│   total_score = max(0, 100 - penalty × 100)
│   # 例: 触发 I1(0.15) + I3(0.15) + I6(0.12) = 0.42
│   # score = 100 - 42 = 58.0
│
└─ 风险等级判定:
    if score >= 70:   → "低风险"
    elif score >= 40:  → "中等风险"
    else:              → "高风险"
```

**关键点**: **每种违规类型只扣一次权重** —— 不是每条违规句子都扣，而是"触发了就扣"。这避免了同一类违规因多个句子触发而过度惩罚。

#### 风险等级阈值对照表

| 场景 | 阈值 | 等级 | 含义 |
|------|------|------|------|
| **审查级** (整体政策) | score >= 70 | 低风险 | 合格良好 |
| | 40 <= score < 70 | 中等风险 | 有改进空间 |
| | score < 40 | 高风险 | 严重不合规 |
| **句子级** (单条违规) | weight >= 0.12 | 高风险 | I1/I2/I3/I6 |
| | 0.08 <= weight < 0.12 | 中等风险 | I4/I5/I7 |
| | weight < 0.08 | 低风险 | I8/I9/I10/I11/I12 |

---

// Part 1 of 5

---

## 三、前端架构深度解析

### 3.1 状态管理中心 (App.tsx)

App.tsx 是整个前端应用的**唯一状态中心**，所有业务数据都集中在这里管理。

#### 完整状态定义

```typescript
// ===== 身份与认证 ======
const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
const [isRegistering, setIsRegistering] = useState<boolean>(false); // AuthPage 内部切换
const [currentUser, setCurrentUser] = useState<User | null>(null);

// ===== 导航与视图 ======
const [currentView, setCurrentView] = useState<ViewType>('overview');
const [riskFilterFromOverview, setRiskFilterFromOverview] = useState<string | null>(null);

// ===== 项目数据 ======
const [projects, setProjects] = useState<Project[]>([]);
const [currentProject, setCurrentProject] = useState<Project | null>(null);

// ===== 条款操作 ======
const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

// ===== 搜索与过滤 ======
const [searchQuery, setSearchQuery] = useState<string>('');

// ===== 分析状态 ======
const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
const [analysisStep, setAnalysisStep] = useState<string>('');
const abortControllerRef = useRef<AbortController | null>(null);

// ===== UI 反馈 ======
const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
```

#### Effect 生命周期时序

```
App 组件挂载
    │
    ├── [Effect 1] CTA 拦截器注册
    │   └── document.addEventListener('click', handleCTA, true)
    │       拦截营销站 "立即体验" 按钮 → navigate('/login')
    │
    ├── [Effect 2] Token 自动恢复
    │   ├── localStorage.getItem('token') → 有值?
    │   │   ├── YES → JSON.parse(user) → setIsLoggedIn(true) → navigate('/', {replace:true})
    │   │   └── NO → 保持未登录态
    │   └── 仅执行一次 (deps: [])
    │
    └── [Effect 3] 项目列表加载 (依赖 isLoggedIn 变化)
        ├── !isLoggedIn → return (不加载)
        ├── setIsLoadingProjects(true)
        ├── api.getProjects()
        │   ├── GET /api/v1/projects → [{id, name, score, risk_level, created_at}]
        │   └── 映射为 Project[] (注意: clauses 全部为 [] 空数组!)
        │
        ├── projects.length > 0?
        │   ├── YES:
        │   │   ├── 取第一个项目 firstProject
        │   │   ├── api.getProject(firstProject.id) → 加载完整 violations
        │   │   │   └── mapRawToClauses(result.violations) → 聚合后的 Clause[]
        │   │   ├── setProjects(mappedProjects)     // 列表(无clauses)
        │   │   └── setCurrentProject(fullProject)   // 当前项目(有clauses)
        │   │
        │   └── NO:
        │       ├── setProjects([])
        │       └── setCurrentProject(null)
        │
        └── finally: setIsLoadingProjects(false)


[Effect 4] Details 视图懒加载 (依赖 currentView 变化)
    ├── currentView !== 'details' → return
    ├── currentProject 已有 clauses? → return (无需重复加载)
    └── loadProjectDetails(currentProject) → getProject(id) + mapRawToClauses
```

#### 核心函数调用关系图

```
用户操作                    App.tsx 函数              API 调用                后端路由
─────────                   ─────────               ────────               ───────

Login按钮                  handleLogin(token,user)      —                     —
                           ├→ setIsLoggedIn(true)
                           └→ navigate('/')

Logout按钮                 handleLogout()                —                     —
                           ├→ localStorage.clear()
                           └→ setIsLoggedIn(false)

"开始审查"                  handleStartAnalysis(type,val)
                           ├→ (type=='file'?) → api.uploadFile(file)
                           │   └→ POST /api/v1/upload → {text}
                           ├→ (type=='url'?) → api.fetchUrl(url)
                           │   └→ POST /api/v1/fetch-url → {text}
                           ├→ api.analyze(text, type, signal)
                           │   └→ POST /api/v1/analyze → {id,score,violations...}
                           ├→ mapRawToClauses(violations)
                           ├→ setProjects([new, ...prev])
                           ├→ setCurrentProject(new)
                           └→ setCurrentView('details')

Sidebar 切换视图            handleViewChange(view)
                           └→ setCurrentView(view)

History 点击行              handleSelectProject(project)
                           ├→ loadProjectDetails(project)
                           │   └→ api.getProject(id) → mapRawToClauses
                           └→ setCurrentView('details')

Details "审查"按钮          onOpenDrawer(clause)         —                     —
                           ├→ setSelectedClause(clause)
                           └→ setIsDrawerOpen(true)

Drawer "采纳并应用"          handleAdopt(updatedClause)
                           ├→ 更新 currentProject.clauses[]
                           ├→ api.updateProject(id, violationsData)
                           │   └→ PUT /api/v1/projects/{id} → {message}
                           ├→ showToast("已采纳")
                           └→ setIsDrawerOpen(false)

Details "导出报告"           onDownload()                —                     —
                           └→ api.exportReport(id)
                               └→ GET /api/v1/export/{id} → blob下载

Overview "查看明细"         onViewChange('details')      —                     —
Overview 风险标签点击        onRiskFilter('high')         —                     —
                           └→ setRiskFilterFromOverview('high')
                              ↓ (传给 Details 的 initialRiskFilter prop)
```

### 3.2 后端→前端数据映射层 (types.ts)

这是**最关键的桥接层**——后端返回的原始 JSON 字段名（snake_case）和前端使用的字段名（camelCase）不同，且后端返回的是扁平的违规列表（每句每违规各一条），需要聚合为按句子分组的结构。

#### 核心映射函数: `mapRawToClause(raw, index?)`

```typescript
function mapRawToClause(raw: any, index?: number): Clause {
  return {
    // === ID ===
    id: raw.id ?? `V${stableRandomId(
      raw.snippet || raw.original_text || raw.originalText || String(index || 0)
    )}`,
    // FNV-1a 哈希: 相同内容永远相同ID, 不同内容大概率不同
    // 格式: V10000 ~ V99999

    // === 原始文本 ===
    originalText: raw.original_text 
      ?? raw.originalText 
      ?? raw.snippet 
      ?? '',

    // === AI 改写建议 ===
    suggestedText: raw.suggested_text 
      ?? raw.suggestedText 
      ?? '【系统建议】请根据合规要求修改。',

    // === 违规原因 ===
    reason: raw.indicator 
      ?? raw.reason 
      ?? getViolationName(
        raw.violation_id ?? raw.category ?? 0
      ),

    // === 违规类别编号 ===
    category: raw.violation_id 
      ?? raw.category 
      ?? 0,

    // === 权重/置信度 ===
    weight: raw.weight 
      ?? raw.probability 
      ?? getViolationWeight(
        raw.violation_id ?? raw.category ?? 0
      ),
    probability: raw.probability ?? raw.weight,

    // === 位置 ===
    location: raw.location 
      ?? `第${index != null ? index + 1 : 1}节`,

    // === 法律依据 ===
    legalBasis: raw.legal_basis ?? '',
    legalDetail: raw.legal_detail ?? undefined,

    // === Diff 对比 HTML ===
    diffOriginalHtml: raw.diff_original_html 
      ?? raw.snippet 
      ?? '',
    diffSuggestedHtml: raw.diff_suggested_html 
      ?? `<span class="diff-add">${escapeHtml(
        raw.suggested_text ?? raw.suggestedText ?? ''
      )}</span>`,

    // === 状态标记 ===
    isAdopted: false,
  };
}
```

#### 聚合函数: `mapRawToClauses(rawClauses[])` — **核心算法**

```typescript
function mapRawToClauses(rawClauses: Raw[]): Clause[] {
  // Step 1: 按 snippet (句子原文) 分组
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
      id: String(raw.violation_id),            // "I1", "I3"
      name: raw.indicator || '',                // "过度收集敏感数据"
      riskLevel: raw.risk_level || '',          // "高风险"
      confidence: raw.probability || 0,         // 0.8234
      legalBasis: raw.legal_basis || '',        // 引用格式
      legalDetail: raw.legal_detail || '',      // 条文正文
      legalReferences: raw.legal_references || [], // 结构化列表
    }));

    // 取最高风险等级 (优先级: 高 > 中 > 低)
    const RISK_PRIORITY: Record<string, number> = {
      '高风险': 3, '中等风险': 2, '低风险': 1
    };
    const highestRisk = violations.reduce((best, v) => 
      (RISK_PRIORITY[v.riskLevel] || 0) > (RISK_PRIORITY[best] || 0) ? v.riskLevel : best,
      violations[0]?.riskLevel || '低风险'
    );

    // 合并多个违规名称
    const reason = violations.map(v => v.name).filter(Boolean).join('、');

    // 合并多个类别标识
    const categoryName = violations
      .map(v => `${v.id} ${v.name}`)
      .join('、');

    return {
      ...mapRawToClause(group[0]),  // 用第一条作为基础模板
      originalText: snippet,         // 覆盖为分组 key
      reason,                        // 覆盖为合并后的原因
      riskLevel: highestRisk,        // 覆盖为最高风险
      categoryName,                  // 新增: 聚合类别名
      violations,                    // 新增: 所有违规明细
      weight: Math.max(...violations.map(v => 
        getViolationWeight(v.id) || 0
      )),                            // 取最高权重
    };
  });
}
```

**聚合示例**:

```javascript
// 后端 analyze() 返回的原始 violations (未聚合):
[
  { snippet: "我们会收集您的位置信息、通讯录和健康数据",
    violation_id: "I1", indicator: "过度收集敏感数据", confidence: 0.82 },
  { snippet: "我们会收集您的位置信息、通讯录和健康数据",
    violation_id: "I3", indicator: "未获得明示同意", confidence: 0.76 },
  { snippet: "我们可能会将您的数据分享给合作伙伴",
    violation_id: "I5", indicator: "未明确第三方共享范围", confidence: 0.65 },
]

// mapRawToClauses() 聚合后:
[
  {
    id: "V38472",                          // 基于 snippet 的固定哈希
    originalText: "我们会收集您的位置信息、通讯录和健康数据",
    reason: "过度收集敏感数据、未获得明示同意",  // 逗号连接
    riskLevel: "高风险",                      // I1 和 I3 都是高
    categoryName: "I1 过度收集敏感数据、I3 未获得明示同意",
    violations: [
      { id: "I1", name: "过度收集敏感数据", riskLevel: "高风险", confidence: 0.82 },
      { id: "I3", name: "未获得明示同意", riskLevel: "高风险", confidence: 0.76 }
    ],
    weight: 0.15,                             // max(I1=0.15, I3=0.15)
  },
  {
    id: "V12903",
    originalText: "我们可能会将您的数据分享给合作伙伴",
    reason: "未明确第三方共享范围",
    riskLevel: "低风险",                       // I5 权重 0.08 < 0.12
    categoryName: "I5 未明确第三方共享范围",
    violations: [
      { id: "I5", name: "未明确第三方共享范围", riskLevel: "低风险", confidence: 0.65 }
    ],
    weight: 0.08,
  }
]
```

#### 稳定随机 ID 算法: `stableRandomId(seed)`

```typescript
/**
 * FNV-1a 哈希变体
 * 输入: 任意字符串 (条款的 snippet 内容)
 * 输出: 10000~99999 之间的固定整数
 * 特性: 相同输入永远相同输出; 不同输入大概率不同
 */
function stableRandomId(seed: string): string {
  let h = 2166136261 ^ seed.length;  // FNV offset basis (32位)
  
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    // FNV prime: 16777619 (2^24 + 2^8 + 0x93)
    // >>>0 保证结果为无符号32位整数
    h = (h * 16777619) >>> 0;
  }
  
  // 映射到 10000~99999 范围 (5位数字)
  return String((h % 90000) + 10000);
}

// 测试用例:
// stableRandomId("我们会收集您的位置信息")  → "V38472" (每次一样)
// stableRandomId("我们可能会将您的数据分享")  → "V12903" (每次不一样)
// stableRandomId("我们会收集您的位置信息")  → "V38472" (跨会话一致)
```

### 3.3 API 请求封装层 (api.ts)

#### apiFetch() 核心函数 — **所有请求的统一入口**

```typescript
async function apiFetch(
  endpoint: string,           // 如 "/api/v1/auth/login"
  options: RequestInit = {},   // { method, body, headers? }
  externalSignal?: AbortSignal, // 外部取消信号 (来自 abortControllerRef)
  timeout?: number             // 自定义超时毫秒数
): Promise<any>
{
  // === Step 1: 创建内部 AbortController ===
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout || REQUEST_TIMEOUT);
  
  // 监听外部 signal: 用户点"取消审查"时联动内部 controller
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    // === Step 2: 发起 fetch ===
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getAuthHeaders(options.body instanceof FormData),
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    // === Step 3: 处理响应 ===
    
    // 401 → Token 过期 → 清除登录态
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';  // 强制跳转登录页
      throw new ApiError('登录已过期，请重新登录', 401, 'UNAUTHORIZED');
    }

    // 非 2xx → HTTP 错误
    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.json();
        detail = errBody.detail || errBody.message || errBody.error || '';
      } catch { /* ignore */ }
      throw new ApiError(detail || `请求失败 (${response.status})`, response.status, 'HTTP_ERROR');
    }

    // 204 No Content → 返回 null
    if (response.status === 204) return null;

    // 正常响应 → 解析 JSON
    const text = await response.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      return text;  // 非JSON响应 (如导出的纯文本)
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // AbortError → 转换为 CanceledError (统一错误类型)
    if (error.name === 'AbortError') {
      throw new ApiError('请求已取消', undefined, 'CanceledError');
    }
    
    // TypeError → 网络断开/DNS失败
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('网络连接异常，请检查网络', undefined, 'NETWORK_ERROR');
    }
    
    // 其他已知错误直接抛出
    if (error instanceof ApiError) throw error;
    
    // 未知错误包装
    throw new ApiError(error.message || '未知错误', undefined, 'UNKNOWN');
  }
}
```

#### 认证头生成

```typescript
function getAuthHeaders(isFormData: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // FormData 不手动设置 Content-Type (浏览器自动加 boundary)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // 从 localStorage 读取 token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

#### 超时配置

| 接口类型 | 超时时间 | 原因 |
|---------|---------|------|
| 普通接口 (login/projects等) | 60s (`REQUEST_TIMEOUT`) | 一般接口不会超过此时间 |
| AI 分析 (`analyze`) | 180s (`LLM_REQUEST_TIMEOUT`) | BERT推理+RAG检索可能较慢 |
| AI 整改 (`rectify`) | 180s (`LLM_REQUEST_TIMEOUT`) | Phi-4 LLM 生成可能较慢 |

#### 导出接口特殊实现

```typescript
// 导出不走 apiFetch! 因为返回的是文件流而非 JSON
export async function exportReport(projectId: string): Promise<void> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/api/v1/export/${projectId}`, { headers });
  
  if (!response.ok) throw new Error(`导出失败 (${response.status})`);

  // blob + 临时 <a> 标签触发下载 (跨域安全方案)
  const text = await response.text();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${projectId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 3.4 组件树与数据流向

```
App.tsx (State Center)
│
├── props downward (只读数据流):
│   │
│   ├── Sidebar ← { currentView, onViewChange, onLogout, currentUser }
│   │   └── callback: onViewChange('details') → setCurrentView('details')
│   │
│   ├── Header ← { title, searchQuery, onSearchChange, onShowToast }
│   │   └── callback: onSearchChange(val) → setSearchQuery(val)
│   │
│   ├── Overview ← { currentProject, projects, onViewChange, onRiskFilter, isLoading }
│   │   ├── 读取: currentProject.score, currentProject.clauses[], projects[].score
│   │   └── callback: onViewChange('new-task'), onRiskFilter('high')
│   │
│   ├── Details ← { currentProject, onOpenDrawer, onDownload, initialRiskFilter }
│   │   ├── 读取: currentProject.clauses[] (含聚合 violations[])
│   │   └── callback: onOpenDrawer(clause), onDownload()
│   │
│   ├── NewTask ← { onStartAnalysis }
│   │   └── callback: onStartAnalysis('text', value)
│   │
│   ├── History ← { projects, onSelectProject }
│   │   └── callback: onSelectProject(project)
│   │
│   ├── Drawer ← { clause, isOpen, onClose, onAdopt, onShowToast }
│   │   ├── 读取: clause.violations[], clause.suggestedText, etc.
│   │   └── callback: onAdopt(updatedClause), onClose()
│   │
│   └── Toast ← { toast }
│
└── callbacks upward (写入流):
    │
    ├── Drawer.onAdopt → App.handleAdopt()
    │   ├── setState: 更新 currentProject.clauses[] (本地同步)
    │   └── api.updateProject() → PUT /api/v1/projects/{id} (后端持久化)
    │
    ├── History.onSelectProject → App.handleSelectProject()
    │   └── loadProjectDetails() → getProject(id) → setCurrentProject(full)
    │
    └── NewTask.onStartAnalysis → App.handleStartAnalysis()
        ├── uploadFile/fetchUrl (预处理)
        ├── analyze() (核心AI分析)
        └── setState: 新建 Project → setProjects + setCurrentProject + setView('details')
```

---

## 四、核心工作流：完整审查链路

### 4.1 工作流总览图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         完整审查工作流总览                                │
│                                                                         │
│  用户输入 ──→ 预处理 ──→ 句子分割 ──→ BERT分类 ──→ RAG检索 ──→ 评分入库  │
│     │           │          │           │           │          │        │
│     ▼           ▼          ▼           ▼           ▼          ▼        │
│  文本/URL   提取纯文本   N个句子    12类违规    法律条文    SQLite     │
│  /文件/粘贴             分割结果    概率分布    匹配结果    写入       │
│                                                                         │
│  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←  │
│                                                                         │
│  前端展示: 映射 → 聚合 → Overview仪表盘 → Details表格 → Drawer整改      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 阶段一：输入预处理

**触发位置**: `App.tsx` → `handleStartAnalysis(type, value)`

**三种输入源的处理差异**:

```
输入类型: "file" (文件上传)
    │
    ├── 前端验证 (NewTask.tsx validateFile()):
    │   ├── 扩展名检查: .txt/.md/.json/.csv
    │   └── 大小检查: ≤ 20MB (20 * 1024 * 1024 bytes)
    │
    ├── api.uploadFile(file)
    │   └── POST /api/v1/upload
    │       Content-Type: multipart/form-data
    │       Body: FormData { file: File }
    │
    └── 后端 analyzer.upload_file():
        ├── 读取文件内容 (UTF-8 编码)
        ├── 根据扩展名选择解析方式:
        │   .txt/.md → 直接读取文本
        │   .json → 尝试提取 text/content 字段
        │   .csv → 按列拼接为文本
        └── 返回 { text: "文件中的纯文本内容" }


输入类型: "url" (URL 抓取)
    │
    ├── api.fetchUrl(url)
    │   └── POST /api/v1/fetch-url
    │       Body: { url: "https://example.com/privacy" }
    │
    └── 后端 analyzer.fetch_url():
        ├── requests.get(url, timeout=10s)
        ├── BeautifulSoup(html, 'html.parser')
        ├── 移除 script/style/nav/footer/header 标签
        ├── 提取 body 文本 (strip_tags)
        └── 返回 { text: "网页中的纯文本内容" }


输入类型: "text" (直接粘贴)
    │
    └── 无需预处理, textToAnalyze = value (用户输入的原始文本)
```

**预处理完成后的统一状态**: 无论哪种输入源，最终都得到一个字符串变量 `textToAnalyze`，进入下一阶段。

### 4.3 阶段二：句子分割与分类

**触发位置**: 后端 `analyzer.analyze_text()` 函数

```
POST /api/v1/analyze
Body: { text: "完整的隐私政策文本...", source_type: "text" }
         │
         ▼
    ┌──────────────────────────────────────────────┐
    │           analyzer.analyze_text()             │
    │                                              │
    │  Step 1: 句子分割                             │
    │  ─────────────────────────────────────────── │
    │  sentences = split_into_sentences(text)       │
    │                                              │
    │  分割策略 (中文隐私政策专用):                   │
    │  ├── 以 。！？；\n 为分隔符                     │
    │  ├── 过滤空白句和过短句 (< 10字符)              │
    │  └── 结果: ["句子1", "句子2", ..., "句子N"]    │
    │                                              │
    │  例: 输入 2000 字的政策文本 → 约 80~150 个句子  │
    │                                              │
    │  Step 2: 逐句分类 (核心循环)                    │
    │  ─────────────────────────────────────────── │
    │  FOR EACH sentence in sentences:               │
    │      │                                        │
    │      ├── roberta_predict(sentence)             │
    │      │   ├── tokenizer(sentence) → input_ids  │
    │      │   ├── model(input_ids) → logits (11维) │
    │      │   ├── sigmoid(logits) → probs (11个概率)│
    │      │   ├── top-2 logits 差值 → confidence   │
    │      │   └── argmax → max_class_idx            │
    │      │                                        │
    │      ├── map_to_12_classes(probs, confidence)  │
    │      │   ├── 双重阈值过滤:                     │
    │      │   │   confidence >= 2.0 ?               │
    │      │   │   AND max_prob >= 0.6 ?             │
    │      │   │                                      │
    │      │   ├── YES → 返回 mapped IDs 如 ["I1","I4"]│
    │      │   └── NO  → 返回 [] (该句无违规)          │
    │      │                                        │
    │      └── IF mapped 非空:                       │
    │          ├── FOR EACH violation_id in mapped:  │
    │          │   ├── IF prob > 0.5:                │
    │          │   │   └── 进入 Step 3 (RAG检索)     │
    │          │   └── ELSE: 忽略 (置信度不够)        │
    │          └── ELSE: 跳过 (该句合规)              │
    │                                              │
    └──────────────────────────────────────────────┘
```

**RoBERTa 推理单次耗时**: GPU 上约 10~30ms/句，CPU 上约 200~500ms/句。  
**100 句的典型处理时间**: GPU ~1~3s, CPU ~20~50s。

### 4.4 阶段三：RAG 法律检索

**触发条件**: BERT 分类检测到某句话存在违规（通过双重阈值）

```
对每个 detected violation (prob > 0.5):
    │
    ▼
get_legal_basis_from_rag(
    violation_type="I1",       # 违规类型ID
    context=sentence            # 触发违规的原始句子 (用于语义匹配上下文)
)
    │
    ▼
retriever.retrieve_by_violation_type("I1", sentence, top_k=5)
    │
    ├── Step 1: 构建增强查询
    │   query = f"{sentence} {VIOLATION_KEYWORDS['I1']}"
    │   例: "我们会收集您的位置信息... 过度收集 敏感数据 最小必要 超范围收集"
    │
    ├── Step 2: 向量编码
    │   query_embedding = SentenceTransformer.encode([query])
    │   维度: 384 (paraphrase-multilingual-MiniLM-L12-v2)
    │
    ├── Step 3: FAISS 全库搜索 (141条法律条文, 不过滤!)
    │   scores, indices = faiss_index.search(query_embedding, top_k*2)
    │   返回: 按余弦相似度降序排列
    │
    ├── Step 4: 取 top_k=5 条结果
    │   └── 转换为 SearchResult[] 结构
    │
    └── 返回 {
        reference: "《个人信息保护法》第六条；网络安全法第四十一条",
        references: [
            { law: "个人信息保护法", article: "第六条", reference: "...", content: "..." },
            { law: "网络安全法", article: "第四十一条", reference: "...", content: "..." },
            ...
        ],
        content: "处理个人信息应当具有合法...\n\n网络运营者收集..."
    }
```

**RAG 检索质量保障机制**:

| 机制 | 说明 |
|------|------|
| 关键词增强 | 在查询中拼接违规关键词，引导向量空间方向 |
| 全库不过滤 | 不预筛 violation_types 字段，避免漏检 |
| top_k×2 候选 | 取 10 条候选再精排，提高召回率 |
| L2 归一化 | 向量和索引都做 L2 归一化，余弦相似度 = 内积 |

### 4.5 阶段四：评分与聚合

**在所有句子处理完毕后执行**:

```
analyze_text() 内部 — 最终阶段:
    │
    ├── violation_flags = {}  # 初始化: {"I1":0, "I2":0, ..., "I12":0}
    │
    ├── FOR EACH detected_violation in violations_list:
    │   └── violation_flags[violation_id] = 1  # 标记该类已触发
    │
    ├── 计算总分:
    │   penalty = Σ( WEIGHT[id] × flags[id]  for id in I1..I12 )
    │   # 注意: 每种违规类型最多扣一次权重!
    │   # 例: I1触发(0.15) + I3触发(0.15) + I6触发(0.12) = 0.42
    │
    │   total_score = max(0, 100 - penalty × 100)
    │   # score = 100 - 42 = 58.0
    │
    ├── 风险等级:
    │   if score >= 70: risk_level = "低风险"
    │   elif score >= 40: risk_level = "中等风险"
    │   else: risk_level = "高风险"
    │
    ├── 数据库写入:
    │   project = Project(
    │       user_id=current_user.id,
    │       name=f"审查-{timestamp}",
    │       score=total_score,
    │       risk_level=risk_level,
    │       raw_text=text_to_analyze,
    │       result_json=json.dumps({
    │           violations: violations_list,      # 未聚合的原始列表
    │           sentence_results: sentence_results, # 逐句调试信息
    │           score: total_score,
    │           risk_level: risk_level
    │       }),
    │       source_type=source_type
    │   )
    │   db.add(project)
    │   db.commit()
    │
    └── 返回 AnalyzeResponse:
        {
            id: str(project.id),           # "p1739006400"
            name: project.name,             # "审查-20260208"
            score: total_score,             # 58.0
            risk_level: risk_level,         # "中等风险"
            violations: violations_list,    # 原始违规记录 (未聚合!)
            sentence_results: [...]        # 逐句分类详情
        }
```

### 4.6 阶段五：前端展示与聚合

**后端返回 → 前端接收 → 映射 → 聚合 → 展示**

```
后端返回的 AnalyzeResponse:
{
  violations: [                                    // 未聚合! 每句每违规各一条
    { violation_id:"I1", indicator:"过度收集敏感数据", 
      snippet:"我们会收集您的位置信息...", confidence:0.82, ... },
    { violation_id:"I3", indicator:"未获得明示同意", 
      snippet:"我们会收集您的位置信息...", confidence:0.76, ... },
    { violation_id:"I5", indicator:"未明确第三方共享范围", 
      snippet:"我们可能会将您的数据分享给合作伙伴", confidence:0.65, ... },
  ]
}
         │
         ▼
App.tsx handleStartAnalysis():
    │
    ├── mapRawToClauses(result.violations)
    │   │
    │   ├── Step 1: 按 snippet 分组
    │   │   Group A: "我们会收集您的位置信息..." → [I1记录, I3记录]
    │   │   Group B: "我们可能会将您的数据分享..." → [I5记录]
    │   │
    │   ├── Step 2: 聚合每组
    │   │   Group A → Clause {
    │   │     id: "V38472",
    │   │     originalText: "我们会收集您的位置信息...",
    │   │     reason: "过度收集敏感数据、未获得明示同意",
    │   │     riskLevel: "高风险",
    │   │     violations: [
    │   │       {id:"I1", name:"过度收集敏感数据", riskLevel:"高风险", conf:0.82},
    │   │       {id:"I3", name:"未获得明示同意", riskLevel:"高风险", conf:0.76}
    │   │     ]
    │   │   }
    │   │   Group B → Clause {
    │   │     id: "V12903",
    │   │     originalText: "我们可能会将您的数据分享...",
    │   │     reason: "未明确第三方共享范围",
    │   │     riskLevel: "低风险",
    │   │     violations: [{id:"I5", name:"未明确第三方共享范围", conf:0.65}]
    │   │   }
    │   │
    │   └── 返回 [Clause_A, Clause_B]
    │
    ├── 构建 Project 对象:
    │   newProject = {
    │     id: result.id,              # "p1739006400"
    │     name: result.name,          # "审查-20260208"
    │     score: result.score,        # 58.0
    │     riskStatus: result.risk_level,  # "中等风险"
    │     date: today,                # "2026-04-22"
    │     description: `自动化合规审查报告。共发现 ${N} 项潜在风险。`,
    │     clauseCount: N,             # 聚合后的条款数
    │     clauses: [Clause_A, Clause_B, ...],  # 聚合后的!
    │   }
    │
    ├── setProjects(prev => [newProject, ...prev])  // 置顶
    ├── setCurrentProject(newProject)
    ├── setCurrentView('details')                    // 跳转到详情页
    └── showToast('审计完成，已生成合规报告')
```

---

## 五、核心工作流：整改建议链路

### 5.1 Rewrite 模式完整链路

```
用户在 Details 表格点击某行的 "审查" 按钮
    │
    ▼
Details.tsx: onOpenDrawer(clause)
    │
    ├── App.tsx: setSelectedClause(clause)
    ├── App.tsx: setIsDrawerOpen(true)
    │
    ▼
Drawer.tsx 打开 (右侧滑入动画, width=900px)
    │
    ├── useEffect([clause, mode]) 触发
    │   │
    │   ├── mode 默认为 "rewrite"
    │   ├── 检查 generatedCache["rewrite_V38472"]
    │   │
    │   ├── 无缓存 → generateSuggestion(clause, "rewrite")
    │   │   │
    │   │   ├── 动态导入: const { api } = await import('../utils/api')
    │   │   │   # 为什么动态导入? 避免 api.ts ↔ Drawer.tsx 循环依赖
    │   │   │
    │   │   ├── api.rectify(
    │   │   │     original_snippet: clause.originalText,   # "我们会收集您的位置信息..."
    │   │   │     violation_type: String(clause.category),  # "I1"
    │   │   │     legal_basis: clause.legalBasis,          # (可选兜底)
    │   │   │     mode: "rewrite"
    │   │   │   )
    │   │   │
    │   │   │   POST /api/v1/rectify
    │   │   │   Body: { original_snippet, violation_type:"I1", mode:"rewrite" }
    │   │   │
    │   │   ▼
    │   │   ┌──────────────────────────────────────────────┐
    │   │   │         后端 rectifier.rectify()             │
    │   │   │                                              │
    │   │   │  ① RAG 检索 (同审查流程):                    │
    │   │   │     get_legal_basis_from_rag("I1", context)  │
    │   │   │     → legal_reference, content, references    │
    │   │   │                                              │
    │   │   │  ② 构建 Rewrite Prompt:                     │
    │   │   │     System: "你是隐私政策编辑..."              │
    │   │   │     User: "# Role / # Edit Instruction       │
    │   │   │           / # Examples / # Now Fix It"       │
    │   │   │     其中 Edit Instruction 来自:              │
    │   │   │     EDIT_INSTRUCTIONS["I1"] =                │
    │   │   │     "删除或缩小敏感数据收集范围..."           │
    │   │   │                                              │
    │   │   │  ③ 调用 Phi-4 Mini:                         │
    │   │   │     llm.chat.completions.create(             │
    │   │   │       model="Phi-4-mini-instruct",           │
    │   │   │       messages=[system, user],               │
    │   │   │       max_tokens=256, temperature=0.3        │
    │   │   │     )                                         │
    │   │   │                                              │
    │   │   │  ④ 解析响应:                                 │
    │   │   │     suggested_text = choices[0].message.content│
    │   │   │                                              │
    │   │   └──────────────────────────────────────────────┘
    │   │   │
    │   │   ▼
    │   │   返回 {
    │   │     suggested_text: "为了向您提供精准的路线导航...",
    │   │     legal_basis: "《个人信息保护法》第六条...",
    │   │     legal_detail: "处理个人信息应当具有合法...",
    │   │     mode: "rewrite"
    │   │   }
    │   │
    │   ├── generateDiffHtml(original, suggested)
    │   │   ├── diffWords(original, suggested) → Change[]
    │   │   └── 每个 Change → HTML span with .diff-add / .diff-remove
    │   │
    │   ├── setState:
    │   │   setEditedText(suggested_text)        // 编辑区默认值
    │   │   setLocalDiffHtml(diffHtml)            // 对比区显示
    │   │   setLocalLegalBasis(legal_basis)       // 依据区显示
    │   │   setLocalLegalDetail(legal_detail)     // 法条正文
    │   │
    │   └── 写入缓存:
    │       generatedCache["rewrite_V38472"] = {
    │         text: suggested_text,
    │         legal: legal_basis,
    │         detail: legal_detail,
    │         diff: diffHtml
    │       }
    │
    ▼
Drawer 渲染 Rewrite 模式 UI:

┌──────────────────────────────────────────────────────────┐
│ [风险解读 | 合规重写] 切换Tab                    [✕ 关闭] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📌 风险类别                                             │
│  ┌──────────────────────────────────────────────┐        │
│  │ [I1] 过度收集敏感数据          [89.2%] 🔴高   │        │
│  │ [I3] 未获得明示同意            [76.1%] 🔴高   │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  ✨ [改写对比]              [🔄 重生]  [👍] [👎]        │
│                                                          │
│  ┌────────────────────┬────────────────────┐             │
│  │  📄 原始条款        │  ✏️ 改写建议        │             │
│  │  ═════════════════  │  ═════════════════  │             │
│  │  我们会收集您的     │  为了向您提供精准   │             │
│  │  ~~位置信息~~、     │  的路线导航...      │             │
│  │  ~~通讯录和~~       │  ~~仅在您主动开启~~ │             │
│  │  ~~健康数据~~...    │  相关功能时...      │             │
│  └────────────────────┴────────────────────┘             │
│  [新增内容] [删除内容]                                   │
│                                                          │
│  ✏️ 人工二次编辑                    [📋 复制内容]        │
│  ┌──────────────────────────────────────────────┐        │
│  │  textarea (可编辑, 默认填充 suggested_text)    │        │
│  │  用户可在此处对模型建议进行最终微调             │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  📖 合规依据                                               │
│  ┌──────────────────────────────────────────────┐        │
│  │  《个人信息保护法》第六条                       │        │
│  │  ─────────────────────────────────────────    │        │
│  │  处理个人信息应当具有合法、正当、必要目的...     │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│              [取消]        [✅ 采纳并应用]                 │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Summary 模式完整链路

```
用户点击 Drawer 顶部的 "风险解读" Tab
    │
    ▼
setMode('summary')
    │
    ├── useEffect([mode]) 触发
    │   ├── 检查 generatedCache["summary_V38472"]
    │   │
    │   ├── 无缓存 → generateSuggestion(clause, "summary")
    │   │   │
    │   │   ├── api.rectify(originalText, category, legalBasis, "summary")
    │   │   │
    │   │   ▼
    │   │   后端 rectify():
    │   │   │
    │   │   │  ① RAG 检索 (同上)
    │   │   │
    │   │   │  ② 构建 Summary Prompt:
    │   │   │     System: "你是一个擅长把复杂文件翻译成..."
    │   │   │     User: "# 条款原文\n{original}\n# 问题本质\n{core_issue}"
    │   │   │           "\n请分两部分回答:\n第一部分: 这句话到底什么意思\n第二部分: 现实中会怎样"
    │   │   │     其中 core_issue 来自 VIOLATION_CORE_ISSUE["I1"]
    │   │   │
    │   │   │  ③ 调用 Phi-4 Mini (同参数)
    │   │   │
    │   │   │  ④ 返回 suggested_text (通俗解读文本)
    │   │   │
    │   │   ▼
    │   │   返回 { suggested_text, legal_basis, legal_detail, mode:"summary" }
    │   │
    │   ├── Summary 模式不生成 Diff (无需对比)
    │   │
    │   └── setState:
    │       setEditedText(suggested_text)
    │       setLocalLegalBasis(legal_basis)
    │       setLocalLegalDetail(legal_detail)
    │       写入 generatedCache["summary_V38472"]
    │
    ▼
Drawer 渲染 Summary 模式 UI:

┌──────────────────────────────────────────────────────────┐
│ [风险解读 | 合规重写] 切换Tab                    [✕ 关闭] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📌 风险类别 (同 Rewrite)                                │
│                                                          │
│  💬 通俗解读                    [🔄 重生]  [👍] [👎]     │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │  📖 条款原文                                  │        │
│  │  ┌──────────────────────────────────────┐    │        │
│  │  │ 我们会收集您的位置信息、通讯录和健康数据│    │        │
│  │  └──────────────────────────────────────┘    │        │
│  │                                              │        │
│  │  👤 AI 大白话解读                             │        │
│  │  ┌──────────────────────────────────────┐    │        │
│  │  │ 第一部分: 这句话到底什么意思            │    │        │
│  │  │ 这段话实际上是在说: 他们想拿你的定位、  │    │        │
│  │  │ 通讯录甚至健康数据。而且没说清楚到底要  │    │        │
│  │  │ 这些干嘛。就像你去便利店, 店员要你把钱包  │    │        │
│  │  │ 里东西全倒出来看看, 但不告诉你为什么。   │    │        │
│  │  │                                              │    │        │
│  │  │ 第二部分: 现实中会怎样                      │    │        │
│  │  │ 实际情况: 你的位置会被持续追踪, 用来给你  │    │        │
│  │  │ 推广告或者卖给别的公司。                   │    │        │
│  │  │ 最坏情况: 如果这些数据泄露了, 有人能知道   │    │        │
│  │  │ 你每天去哪、联系谁、身体有什么问题。       │    │        │
│  │  └──────────────────────────────────────┘    │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  📖 合规依据 (同 Rewrite)                                 │
│                                                          │
│              [取消]        [📋 复制解读]                   │
└──────────────────────────────────────────────────────────┘
```

### 5.3 缓存与采纳机制

#### 缓存设计

```typescript
// Drawer.tsx 内部状态
const [generatedCache, setGeneratedCache] = useState<Record<string, {
  text: string;       // AI 生成的文本
  legal: string;      // 法律引用
  detail: string;     // 法条正文
  diff: string;       // Diff HTML (仅 rewrite)
}>>({});

// Cache Key 格式: `${mode}_${clauseId}`
// 例: "rewrite_V38472", "summary_V38472", "rewrite_V12903"

// 缓存命中逻辑:
useEffect(() => {
  const cacheKey = `${mode}_${clause?.id}`;
  const cached = generatedCache[cacheKey];
  
  if (cached) {
    // 命中缓存 → 直接恢复状态 (无需再次调用 API)
    setEditedText(cached.text);
    setLocalDiffHtml(cached.diff);
    setLocalLegalBasis(cached.legal);
    setLocalLegalDetail(cached.detail);
  } else {
    // 未命中 → 检查是否有默认值 (rewrite 模式下 clause 自带的 suggestedText)
    if (mode === 'rewrite' && hasDefaultSuggestion) {
      // 使用默认值 (来自 analyze 接口的原始 suggested_text)
    } else {
      // 无任何缓存 → 调用 API 生成
      generateSuggestion(clause, mode);
    }
  }
}, [clause, mode]);  // clause 或 mode 变化时重新检查缓存
```

**缓存生命周期**:
- **创建**: `generateSuggestion()` 成功后写入
- **读取**: 切换 mode 或切换 clause 时检查
- **失效**: 点击"🔄 重生"按钮清除当前 cacheKey
- **范围**: 仅内存级 (组件卸载即丢失, 无持久化)

#### 采纳流程 (Rewrite 模式独有)

```
用户点击 "✅ 采纳并应用" 按钮
    │
    ▼
handleAdoptClick()
    │
    ├── 读取当前编辑区的文本 (editedText) —— 用户可能已经手动修改过!
    │
    ├── 构建 updatedClause:
    │   updatedClause = {
    │     ...clause,                    // 保留原有字段
    │     suggestedText: editedText,     // 使用编辑后的文本 (非原始AI输出)
    │     diffSuggestedHtml: generateDiffHtml(clause.originalText, editedText),
    │     legalBasis: localLegalBasis,
    │     isAdopted: true,              // 标记为已采纳
    │   }
    │
    ├── onAdopt(updatedClause)  // 回调到 App.tsx
    │   │
    │   ▼
    │   App.handleAdopt():
    │   ├── 更新本地 state (立即生效, UI 同步更新):
    │   │   updatedClauses = currentProject.clauses.map(c =>
    │   │     c.id === updatedClause.id ? updatedClause : c
    │   │   )
    │   │   setCurrentProject({ ...currentProject, clauses: updatedClauses })
    │   │
    │   ├── 异步同步到后端 (fire-and-forget, 不阻塞UI):
    │   │   api.updateProject(String(currentProject.id), violationsData)
    │   │   │
    │   │   ├── 将 clauses[] 转换为后端格式:
    │   │   │   violationsData = clauses.map(c => ({
    │   │   │     indicator: c.categoryName || c.reason,
    │   │   │     violation_id: String(c.category),
    │   │   │     snippet: c.originalText,
    │   │   │     legal_basis: c.legalBasis,
    │   │   │     legal_detail: c.legalDetail || '',
    │   │   │     suggested_text: c.suggestedText !== DEFAULT_TEXT
    │   │   │       ? c.suggestedText : '',  // 排除占位文本
    │   │   │   }))
    │   │   │
    │   │   ├── PUT /api/v1/projects/{projectId}
    │   │   │   Body: { violations: [...] }
    │   │   │
    │   │   └── 后端 database.update_project():
    │   │       UPDATE projects SET result_json=?, updated_at=now
    │   │       WHERE id=? AND user_id=?
    │   │       (将新的 violations 数据序列化为 JSON 存入 DB)
    │   │
    │   ├── showToast("整改方案已应用到当前草稿")
    │   └── setIsDrawerOpen(false)  // 关闭抽屉
    │
    ▼
UI 更新完成:
- Details 表格中该行的 suggestedText 已更新
- Overview 仪表盘的数据也同步更新 (因为引用同一个 currentProject)
- 后端数据库已持久化 (下次加载该项目时能看到采纳结果)
```

---

## 六、核心工作流：认证与会话管理

### 6.1 注册流程

```
Register 页面
    │
    ├── 用户填写: email, password, username, 确认密码
    ├── 勾选隐私协议 (PolicyModal 强制阅读)
    │
    ├── 点击 "注册"
    │   ├── 前端校验:
    │   │   ├── email 非空且包含 @
    │   │   ├── password 非空
    │   │   ├── username 非空
    │   │   └── confirmPassword === password
    │   │
    │   ├── api.register(email, password, username)
    │   │   POST /api/v1/auth/register
    │   │   Body: { email, password, name: username }
    │   │   │
    │   │   ▼
    │   │   后端 auth.register():
    │   │   ├── 检查 email 是否已存在 (SELECT users WHERE email=?)
    │   │   ├── 已存在 → raise HTTPException(400, "邮箱已被注册")
    │   │   ├── 密码哈希: password_hash = bcrypt.hash(password, rounds=12)
    │   │   ├── 创建 User: db.add(User(email, username, hash))
    │   │   └── db.commit() → 返回 201 Created
    │   │
    │   ├── 注册成功! → 自动登录 (无缝体验):
    │   │   ├── api.login(email, password)
    │   │   │   POST /api/v1/auth/login
    │   │   │   Body: { email, password }
    │   │   │   │
    │   │   │   ▼
    │   │   │   后端 auth.login():
    │   │   │   ├── 查询 User: SELECT * FROM users WHERE email=?
    │   │   │   ├── bcrypt.verify(password, stored_hash)
    │   │   │   ├── 密码错误 → raise HTTPException(401, "密码错误")
    │   │   │   ├── 生成 JWT: token = create_jwt({user_id, email})
    │   │   │   │   payload: { sub: user_id, exp: now + 7days }
    │   │   │   │   secret: SECRET_KEY (环境变量)
    │   │   │   └── 返回 { token, user: {id, email, name} }
    │   │   │
    │   │   ▼
    │   │   返回 { token: "eyJ...", user: {...} }
    │   │
    │   ├── 存储:
    │   │   localStorage.setItem('token', data.token)
    │   │   localStorage.setItem('user', JSON.stringify(normalizedUser))
    │   │   # normalizedUser: { id: Number(email.id), email, username, name }
    │   │
    │   └── onRegister(data.token, normalizedUser)
    │       → App.handleLogin() → setIsLoggedIn(true) → navigate('/')
    │
    ▼
用户自动进入 B端产品首页 (Overview 仪表盘)
```

### 6.2 登录流程

```
Login 页面
    │
    ├── 用户填写: 企业账号 (email), 密码
    ├── 勾选隐私协议 (PolicyModal 强制阅读)
    │
    ├── 点击 "登录"
    │   ├── 前端校验: email/password 非空
    │   ├── api.login(email, password)
    │   │   POST /api/v1/auth/login
    │   │   → 后端 auth.login() (见上方)
    │   │   → 返回 { token, user }
    │   │
    │   ├── localStorage 存储 token + user
    │   └── onLogin(token, user) → App.handleLogin()
    │       ├── setCurrentUser(user)
    │       ├── setIsLoggedIn(true)
    │       ├── setIsLoadingProjects(true)
    │       └── navigate('/', { replace: true })
    │
    ▼
Effect 3 触发: getProjects() → 加载首个项目 → 渲染 Overview
```

### 6.3 Token 恢复流程 (页面刷新/重新打开)

```
用户刷新页面 或 重新打开浏览器标签
    │
    ▼
main.tsx → <BrowserRouter><App /></BrowserRouter>
    │
    ├── App 组件挂载
    │
    ├── [Effect 2] Token 自动恢复:
    │   ├── token = localStorage.getItem('token')
    │   ├── userStr = localStorage.getItem('user')
    │   │
    │   ├── 两者都有值?
    │   │   ├── YES:
    │   │   │   ├── JSON.parse(userStr) → user object
    │   │   │   ├── setCurrentUser(user)
    │   │   │   ├── setIsLoggedIn(true)
    │   │   │   ├── setIsLoadingProjects(true)
    │   │   │   └── navigate('/', { replace: true })
    │   │   │       │
    │   │   │       ▼
    │   │   │   [Effect 3] 触发 → getProjects() → 正常加载
    │   │   │
    │   │   └── NO (任一缺失):
    │   │       ├── 清除残留: removeItem('token'), removeItem('user')
    │   │       └── 保持 isLoggedIn=false → 显示营销站
    │   │
    │   └── JSON.parse 失败 (损坏的数据)?
    │       └── 清除两者 → 保持未登录
    │
    ▼
正常渲染对应模式 (营销站 or B端产品)
```

### 6.4 登出流程

```
用户点击 Sidebar 底部的 "退出登录"
    │
    ▼
handleLogout()
    │
    ├── localStorage.removeItem('token')
    ├── localStorage.removeItem('user')
    ├── setCurrentUser(null)
    ├── setIsLoggedIn(false)
    ├── setCurrentView('overview')  // 重置视图
    │
    └── (不调用 navigate!)
        因为 isLoggedIn 变为 false 后
        App.tsx render 分支自动切换到 <Routes> (营销站)
```

### 6.5 401 错误处理 (Token 过期)

```
任意 API 请求返回 401 Unauthorized
    │
    ▼
apiFetch() 内部检测到 response.status === 401
    │
    ├── localStorage.removeItem('token')
    ├── localStorage.removeItem('user')
    ├── window.location.href = '/'  // 强制跳转
    │
    └── 抛出 ApiError('登录已过期', 401, 'UNAUTHORIZED')
        (被调用方的 catch 捕获, 显示 toast 或忽略)
```

---

## 七、接口协议完整定义

### 7.1 接口总览矩阵

| # | 方法 | 路径 | 认证 | Content-Type | 超时 | 功能 | 前端调用位置 |
|---|------|------|------|-------------|------|------|------------|
| 1 | POST | `/api/v1/auth/register` | 否 | JSON | 60s | 用户注册 | Register.tsx |
| 2 | POST | `/api/v1/auth/login` | 否 | JSON | 60s | 用户登录 | Login.tsx |
| 3 | GET | `/api/v1/auth/me` | **是** | JSON | 60s | 获取当前用户 | App.tsx (init) |
| 4 | **POST** | **`/api/v1/analyze`** | **是** | **JSON** | **180s** | **合规分析(核心)** | **App.tsx → handleStartAnalysis** |
| 5 | **POST** | **`/api/v1/rectify`** | **是** | **JSON** | **180s** | **整改建议(核心)** | **Drawer.tsx → generateSuggestion** |
| 6 | POST | `/api/v1/upload` | **是** | FormData | 60s | 文件上传+文本提取 | App.tsx → handleStartAnalysis |
| 7 | POST | `/api/v1/fetch-url` | **是** | JSON | 60s | URL抓取+文本提取 | App.tsx → handleStartAnalysis |
| 8 | GET | `/api/v1/projects` | **是** | JSON | 60s | 项目列表(元数据) | App.tsx → Effect 3 |
| 9 | GET | `/api/v1/projects/{id}` | **是** | JSON | 60s | 项目详情(含violations) | App.tsx → loadProjectDetails |
| 10 | PUT | `/api/v1/projects/{id}` | **是** | JSON | 60s | 更新项目(采纳整改) | App.tsx → handleAdopt |
| 11 | GET | `/api/v1/export/{id}` | **是** | — | 60s | 导出报告(blob下载) | Details.tsx → onDownload |
| 12 | GET | `/health` | 否 | — | 5s | 健康检查 | — |
| 13 | GET | `/api/v1/kb/status` | 否 | JSON | 5s | 知识库初始化状态 | — |
| 14 | POST | `/api/v1/kb/search` | **是** | JSON | 30s | 手动测试RAG检索 | — |

### 7.2 核心接口详细定义

#### 7.2.1 `POST /api/v1/analyze` — 合规分析 (最核心接口)

**Request**:
```http
POST /api/v1/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "text": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。注册即视为您同意本政策全部条款。",
  "source_type": "text"
}
```

| 参数 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| text | string | **是** | 10~50,000 字符 | 待分析的隐私政策全文 |
| source_type | string | 否 | `"text"` / `"url"` / `"file"` | 来源标识 (日志用途) |

**Response** (`200 OK`):
```json
{
  "id": "p1745356800",
  "name": "审查-20260422T103000",
  "score": 42.5,
  "risk_level": "高风险",
  "violations": [
    {
      "indicator": "过度收集敏感数据",
      "violation_id": "I1",
      "snippet": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "original_text": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "suggested_text": "",
      "weight": 0.15,
      "probability": 0.8234,
      "confidence": 3.42,
      "risk_level": "高风险",
      "location": "第1节",
      "legal_basis": "《个人信息保护法》第六条；网络安全法第四十一条",
      "legal_detail": "处理个人信息应当具有合法、正当、必要目的...(截断)",
      "diff_original_html": "<span>我们收集您的位置信息...</span>",
      "diff_suggested_html": "",
      "legal_references": [
        {
          "law": "个人信息保护法",
          "article": "第六条",
          "reference": "《个人信息保护法》第六条",
          "content": "处理个人信息应当具有合法、正当、必要目的..."
        }
      ]
    },
    {
      "indicator": "未获得明示同意",
      "violation_id": "I3",
      "snippet": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "original_text": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "suggested_text": "",
      "weight": 0.15,
      "probability": 0.7612,
      "confidence": 2.89,
      "risk_level": "高风险",
      "location": "第1节",
      "legal_basis": "《个人信息保护法》第十四条；网络安全法第四十一条",
      "legal_references": [...]
    }
  ],
  "sentence_results": [
    {
      "index": 0,
      "sentence": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "class_name": "数据收集",
      "max_class_idx": 0,
      "max_prob": 0.85,
      "confidence": 3.42,
      "raw_probs": [0.23, 0.85, 0.31, 0.57, 0.11, 0.18, 0.52, 0.29, 0.73, 0.43, 0.14],
      "detected_violations": ["I1", "I4"]
    },
    {
      "index": 1,
      "sentence": "注册即视为您同意本政策全部条款。",
      "class_name": "权限获取",
      "max_class_idx": 1,
      "max_prob": 0.78,
      "confidence": 2.56,
      "raw_probs": [...],
      "detected_violations": ["I3"]
    }
  ]
}
```

**Response 字段详解**:

| 字段 | 类型 | 说明 | 前端使用 |
|------|------|------|---------|
| id | string | 项目ID (Unix时间戳前缀) | 作为 Project.id |
| name | string | 项目名称 | 作为 Project.name |
| score | float | 合规得分 0~100 | Overview 圆环分数 |
| risk_level | string | 风险等级 | Overview 风险标签 |
| violations | array | **违规列表 (未聚合!)** | mapRawToClauses() 输入 |
| violations[].violation_id | string | 违规ID "I1"~"I12" | Clause.category |
| violations[].indicator | string | 违规中文名 | Clause.reason (fallback) |
| violations[].snippet | string | 触发违规的句子 | 分组key + Clause.originalText |
| violations[].original_text | string | 原始文本 | Clause.originalText (优先) |
| violations[].probability | float | 模型置信度 | Clause.probability |
| violations[].confidence | float | logits差值 | 内部调试用 |
| violations[].weight | float | 违规权重 | Clause.weight |
| violations[].risk_level | string | 句子级风险 | Clause.riskLevel |
| violations[].legal_basis | string | 法律引用(分号分隔) | Clause.legalBasis |
| violations[].legal_detail | string | 法条正文(截断) | Clause.legalDetail |
| violations[].legal_references | array | 结构化法律列表 | Clause.violations[].legalReferences |
| sentence_results | array | 逐句分类明细 | 调试用, 前端不直接使用 |

**错误码**:

| HTTP Status | error code | 含义 |
|-------------|-----------|------|
| 401 | UNAUTHORIZED | Token 无效/过期 |
| 413 | PAYLOAD_TOO_LARGE | 文本超过 50,000 字符 |
| 500 | ANALYSIS_ERROR | BERT推理/RAG检索/DB写入失败 |

#### 7.2.2 `POST /api/v1/rectify` — 整改建议 (第二个核心接口)

**Request**:
```http
POST /api/v1/rectify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "original_snippet": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
  "violation_type": "I1",
  "mode": "rewrite",
  "legal_basis": ""
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| original_snippet | string | **是** | 原始违规条款文本 |
| violation_type | string | **是** | 违规ID ("I1"~"I12") |
| mode | string | 否 | `"rewrite"`(默认) 或 `"summary"` |
| legal_basis | string | 否 | 前端传入的法律依据(RAG失败时的兜底) |

**Response** (`200 OK`):
```json
{
  "suggested_text": "在使用地图导航功能时，我们会申请获取您的位置信息，仅用于实时导航和路线规划。您可以随时在设置中关闭此功能。对于通讯录，仅在您选择邀请好友时读取，且不会存储或用于其他目的。我们承诺不会收集您的健康数据。",
  "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条",
  "legal_detail": "处理个人信息应当具有合法、正当、必要目的。应当与处理目的直接相关，采取对个人权益影响最小的方式...",
  "mode": "rewrite"
}
```

#### 7.2.3 `GET /api/v1/projects` — 项目列表

**Response** (`200 OK`):
```json
[
  {
    "id": "p1745356800",
    "name": "审查-20260422T103000",
    "score": 42.5,
    "risk_level": "高风险",
    "created_at": "2026-04-22T10:30:00"
  },
  {
    "id": "p1745270400",
    "name": "某公司隐私政策",
    "score": 73.0,
    "risk_level": "低风险",
    "created_at": "2026-04-21T15:00:00"
  }
]
```

**关键**: 此接口 **不返回** `violations` 字段! 只有元数据。需要详情必须调 `GET /api/v1/projects/{id}`。

#### 7.2.4 `GET /api/v1/projects/{id}` — 项目详情

**Response** (`200 OK`):
```json
{
  "id": "p1745356800",
  "name": "审查-20260422T103000",
  "score": 42.5,
  "risk_level": "高风险",
  "created_at": "2026-04-22T10:30:00",
  "violations": [
    /* 同 analyze 接口的 violations 格式 */
  ]
}
```

**关键**: 此接口 **返回完整的 violations 数组**, 用于填充 `currentProject.clauses`。

#### 7.2.5 `PUT /api/v1/projects/{id}` — 更新项目 (采纳整改)

**Request**:
```http
PUT /api/v1/projects/p1745356800
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "violations": [
    {
      "indicator": "过度收集敏感数据、未获得明示同意",
      "violation_id": "I1",
      "snippet": "我们收集您的位置信息、通讯录和健康数据以提供更好的服务。",
      "legal_basis": "《个人信息保护法》第六条；网络安全法第四十一条",
      "legal_detail": "处理个人信息应当具有合法...",
      "suggested_text": "在使用地图导航功能时，我们会申请获取您的位置信息..."
    }
  ]
}
```

**Response** (`200 OK`):
```json
{
  "message": "更新成功",
  "id": "p1745356800"
}
```

**后端行为**: 将 `violations` 数组 JSON 序列化后写入 `projects.result_json` 字段。

---

## 八、12类违规体系完整定义

### 8.1 权重与阈值配置

```python
# violation-config.ts (前端) / config.py (后端) 同步维护

INDICATORS = {
  "I1": { "name": "过度收集敏感数据",        "weight": 0.15, "dimension": "data_collection" },
  "I2": { "name": "未说明收集目的",            "weight": 0.12, "dimension": "data_collection" },
  "I3": { "name": "未获得明示同意",            "weight": 0.15, "dimension": "data_collection" },
  "I4": { "name": "收集范围超出服务需求",        "weight": 0.10, "dimension": "data_collection" },
  "I5": { "name": "未明确第三方共享范围",        "weight": 0.08, "dimension": "data_sharing" },
  "I6": { "name": "未获得单独共享授权",          "weight": 0.12, "dimension": "data_sharing" },
  "I7": { "name": "未明确共享数据用途",          "weight": 0.08, "dimension": "data_sharing" },
  "I8": { "name": "未明确留存期限",              "weight": 0.05, "dimension": "data_retention" },
  "I9": { "name": "未说明数据销毁机制",          "weight": 0.05, "dimension": "data_retention" },
  "I10":{ "name": "未明确用户权利范围",          "weight": 0.05, "dimension": "user_rights" },
  "I11":{ "name": "未提供便捷权利行使途径",      "weight": 0.03, "dimension": "user_rights" },
  "I12":{ "name": "未明确权利响应时限",          "weight": 0.02, "dimension": "user_rights" },
}
# 权重总和 = 1.00 ✓
```

### 8.2 四大维度分组

| 维度 | 包含违规 | 总权重 | 占比 |
|------|---------|--------|------|
| **数据收集** | I1, I2, I3, I4 | 0.15+0.12+0.15+0.10 = **0.52** | 52% |
| **数据共享** | I5, I6, I7 | 0.08+0.12+0.08 = **0.28** | 28% |
| **数据留存** | I8, I9 | 0.05+0.05 = **0.10** | 10% |
| **用户权利** | I10, I11, I12 | 0.05+0.03+0.02 = **0.10** | 10% |

### 8.3 得分计算示例

**场景A**: 检测到 I1 + I3 + I6 三种违规
```
penalty = 0.15(I1) + 0.15(I3) + 0.12(I6) = 0.42
score = 100 - 0.42 × 100 = 58.0
risk_level = "中等风险" (40 ≤ 58 < 70)
```

**场景B**: 检测到全部 12 种违规 (极端情况)
```
penalty = 1.00 (所有权重之和)
score = 100 - 1.00 × 100 = 0.0
risk_level = "高风险" (0 < 40)
```

**场景C**: 仅检测到 I8 + I11 + I12 (轻微违规)
```
penalty = 0.05(I8) + 0.03(I11) + 0.02(I12) = 0.10
score = 100 - 0.10 × 100 = 90.0
risk_level = "低风险" (90 ≥ 70)
```

### 8.4 风险等级颜色映射 (前端)

```typescript
// violation-config.ts
export function getRiskColorClass(level: RiskLevelType): string {
  switch(level) {
    case RISK_LEVEL.HIGH:   return 'text-red-600 bg-red-50 border-red-200';
    case RISK_LEVEL.MEDIUM: return 'text-amber-600 bg-amber-50 border-amber-200';
    case RISK_LEVEL.LOW:    return 'text-green-600 bg-green-50 border-green-200';
    default:                return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getRiskDotClass(level: RiskLevelType): string {
  switch(level) {
    case RISK_LEVEL.HIGH:   return 'bg-red-500';     // ● 红色圆点
    case RISK_LEVEL.MEDIUM: return 'bg-amber-500';    // ● 琥珀圆点
    case RISK_LEVEL.LOW:    return 'bg-green-500';    // ● 绿色圆点
    default:                return 'bg-gray-400';
  }
}
```

---

## 九、已知问题与修复记录

| # | 问题 | 根因分析 | 修复方案 | 状态 |
|---|------|---------|---------|------|
| 1 | 登录后仪表盘空白 | `currentProject` 为 null, clauses 未加载 | `getProjects()` 成功后立即 `getProject(firstId)` 加载详情; `Overview` 加 `key={id}` 强制 remount | ✅ |
| 2 | 条款编号每次审查不同 | `Math.random()` 生成随机 ID | FNV-1a 哈希算法基于 `snippet` 内容生成固定 5 位数字 | ✅ |
| 3 | 历史日期分两行显示 | 日期列未设置 nowrap | 添加 `whitespace-nowrap` CSS 类 | ✅ |
| 4 | Cloudflare 构建失败 JSX 语法错误 | `Overview.tsx` 未闭合 `</div>` 标签 | 补全闭合标签 | ✅ |
| 5 | JS 文件返回 HTML 导致 `Unexpected token '<'` | Dev server 进程异常 / Cloudflare 构建产物问题 | 重新 `pnpm build` + push 触发重建; `_headers` 确保 JS MIME 类型 | ✅ |
| 6 | 累计发现问题显示 0 | `totalClauses = projects.reduce(p => p.clauses.length)` 但列表中 clauses 全为 `[]` | 改为 `currentProject?.clauses?.length \|\| 0` | ✅ |
| 7 | `clauseCount` 不准确 | 仅在 `handleStartAnalysis` 中设准确值, 历史项目为 0 | ⚠️ 可优化: `loadProjectDetails` 后同步更新 | 已知 |

---

> **文档结束** — 本文档覆盖系统级全链路: 前端状态管理 + 后端FastAPI架构 + RoBERTa-MoE分类 + RAG法律检索 + Phi-4整改生成 + SQLite持久化 + 14个接口协议 + 4个核心工作流 + 12类违规体系。

