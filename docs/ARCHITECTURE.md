# 隐私政策合规智能审查平台 — 系统架构文档（简化版）

> **项目**: sy-s-web (PrivacyGuard / 智审合规)  
> **范围**: 前后端全链路架构 + 核心工作流 + 接口协议

---

## 一、系统全景

```
用户浏览器 (React 19 SPA)
        │
        │ HTTPS (REST API)
        ▼
┌───────────────────────────────────────┐
│         FastAPI 后端                    │
│                                       │
│  ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │RoBERTa   │ │RAG 检索   │ │Phi-4  │ │
│  │MoE 分类  │ │141条法律  │ │整改   │ │
│  └──────────┘ └──────────┘ └───────┘ │
│         │            │          │     │
│  ┌──────┴────────────┴──────────┐    │
│  │      SQLite + SQLAlchemy       │    │
│  │  users 表 + projects 表       │    │
│  └───────────────────────────────┘    │
└───────────────────────────────────────┘
```

**部署**: 前端 Cloudflare Pages + 后端 HuggingFace Spaces

---

## 二、核心工作流总览

### 工作流 1: 完整审查链路 (最重要)

```
用户输入(文件/URL/文本)
       │
       ▼
[预处理] 提取纯文本 (upload/fetch-url 或直接使用)
       │
       ▼
[句子分割] 中文隐私政策专用分割 → N个句子 (~80~150句)
       │
       ▼
[BERT分类] 逐句 RoBERTa-MoE 推理 → 11类概率 → 映射12类违规
       │  双重阈值: confidence≥2.0 AND prob≥0.6 才触发
       │
       ▼
[RAG检索] 对每个触发违规 → FAISS全库语义搜索 → 匹配法律条文
       │  知识库: 141条法律条文 (PIPL/DSL/CSL/GB35273)
       │
       ▼
[评分聚合] 每种违规类型扣一次权重 → score=100-Σ(weight×100)
       │  ≥70低风险 / 40-69中等 / <40高风险
       │
       ▼
[入库] SQLite projects 表 (raw_text + result_json)
       │
       ▼
[前端映射] mapRawToClauses() → 按句子聚合 → 渲染 Details/Overview
```

### 工作流 2: 整改建议链路

```
Details 点击"审查" → 打开 Drawer
       │
       ▼
[RAG检索] 获取法律依据 (同工作流1)
       │
       ▼
[Prompt构建] 根据 mode 选择:
  ├─ Rewrite: "编辑指令" + before→after 示例 → Phi-4 输出改写文本
  └─ Summary: "问题本质" + Q&A框架 → Phi-4 输出通俗解读
       │
       ▼
[Diff生成] diffWords() → HTML高亮对比 (仅Rewrite模式)
       │
       ▼
[缓存] generatedCache["mode_V+ID"] → 切换条款/模式时复用
       │
       ▼
[采纳] 用户编辑后点采纳 → updateProject API → DB持久化
```

### 工作流 3: 认证流程

```
注册: email+password → bcrypt哈希 → 写入users表 → 自动login → JWT token
登录: email+password → bcrypt验证 → JWT签发(7天有效期) → 存localStorage
恢复: 页面刷新 → 读localStorage token → 自动恢复登录态 → 加载项目列表
登出: 清除localStorage → isLoggedIn=false → 切换到营销站
过期: 任一API返回401 → 清除token → 强制跳转登录页
```

---

## 三、全部接口 (14个)

| # | 方法 | 路径 | 认证 | 功能 |
|---|------|------|------|------|
| 1 | POST | `/api/v1/auth/register` | 否 | 注册 (成功后自动登录) |
| 2 | POST | `/api/v1/auth/login` | 否 | 登录 (返回JWT) |
| 3 | GET | `/api/v1/auth/me` | 是 | 当前用户信息 |
| **4** | **POST** | **`/api/v1/analyze`** | **是** | **★ 合规分析 (BERT+RAG+评分)** |
| **5** | **POST** | **`/api/v1/rectify`** | **是** | **★ AI整改 (Phi-4)** |
| 6 | POST | `/api/v1/upload` | 是 | 文件上传→提取文本 |
| 7 | POST | `/api/v1/fetch-url` | 是 | URL抓取→提取文本 |
| 8 | GET | `/api/v1/projects` | 是 | 项目列表 (仅元数据,无clauses) |
| 9 | GET | `/api/v1/projects/{id}` | 是 | 项目详情 (含完整violations) |
| 10 | PUT | `/api/v1/projects/{id}` | 是 | 更新项目 (采纳整改后同步) |
| 11 | GET | `/api/v1/export/{id}` | 是 | 导出报告 (blob下载) |
| 12 | GET | `/health` | 否 | 健康检查 |
| 13 | GET | `/api/v1/kb/status` | 否 | RAG知识库状态 |
| 14 | POST | `/api/v1/kb/search` | 是 | 手动测试RAG |

---

## 四、12类违规体系

| 维度 | ID | 名称 | 权重 | 风险 |
|------|-----|------|------|------|
| 数据收集 | I1 | 过度收集敏感数据 | 0.15 | 高 |
| 数据收集 | I2 | 未说明收集目的 | 0.12 | 中高 |
| 数据收集 | I3 | 未获得明示同意 | 0.15 | 高 |
| 数据收集 | I4 | 收集范围超出需求 | 0.10 | 低 |
| 数据共享 | I5 | 未明确第三方共享范围 | 0.08 | 低 |
| 数据共享 | I6 | 未获得单独共享授权 | 0.12 | 中高 |
| 数据共享 | I7 | 未明确共享数据用途 | 0.08 | 低 |
| 数据留存 | I8 | 未明确留存期限 | 0.05 | 低 |
| 数据留存 | I9 | 未说明数据销毁机制 | 0.05 | 低 |
| 用户权利 | I10 | 未明确用户权利范围 | 0.05 | 低 |
| 用户权利 | I11 | 未提供便捷权利行使途径 | 0.03 | 低 |
| 用户权利 | I12 | 未明确权利响应时限 | 0.02 | 低 |

**得分公式**: `score = 100 - Σ(触发权重 × 100)`，每种违规只扣一次

---

## 五、关键数据结构

### 后端 → 前端映射 (最关键的桥接)

```
后端 analyze() 返回 (未聚合, 每句每违规各一条):
  violations[{ violation_id, indicator, snippet, probability, legal_basis, ... }]

        ↓ mapRawToClauses()

前端 Clause[] (按句子聚合):
  Clause{
    id: "V38472",              // FNV-1a 固定哈希 (同内容永远相同)
    originalText: "...",        // 句子原文
    reason: "I1名称、I3名称",   // 多违规逗号连接
    riskLevel: "高风险",        // 取最高等级
    violations:[                // 聚合明细 (Drawer展示用)
      { id:"I1", name:"...", riskLevel:"...", confidence:0.82 },
      { id:"I3", name:"...", riskLevel:"...", confidence:0.76 }
    ]
  }
```

### 数据库模型

```sql
-- users 表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- projects 表
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(500) NOT NULL,
    score REAL DEFAULT 100.0,
    risk_level VARCHAR(20) DEFAULT '低风险',
    raw_text TEXT,
    result_json TEXT,           -- JSON: 完整分析结果(violations+score等)
    source_type VARCHAR(20) DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 六、AI 模型配置

| 模型 | 用途 | 规格 | 调用方式 |
|------|------|------|---------|
| `hfl/chinese-roberta-wwm-ext` | 违规分类 | 11类序列分类, sigmoid | 本地GPU/CPU推理 |
| `paraphrase-multilingual-MiniLM-L12-v2` | 法律条文向量化 | 384维, 余弦相似度 | 本地CPU编码 |
| `Phi-4-mini-instruct` | 整改建议生成 | max_tokens=256, temp=0.3 | GitHub Models API (免费) |

**LLM 三种模式**: github(推荐) / local(GGUF量化) / hf(HF Inference API)

---

## 七、已知问题记录

| # | 问题 | 状态 |
|---|------|------|
| 1 | 登录后仪表盘空白 | ✅ 首个项目clauses自动加载 + key remount |
| 2 | 条款编号随机变化 | ✅ FNV-1a 内容哈希固定ID |
| 3 | 历史日期换行 | ✅ whitespace-nowrap |
| 4 | JS返回HTML导致空白 | ✅ rebuild + _headers MIME修复 |
| 5 | 累计发现问题=0 | ✅ 改读 currentProject.clauses.length |

---

> 完整版见 `docs/FULL_ARCHITECTURE.md` (2449行, 含代码/架构图/时序图/接口详情)
