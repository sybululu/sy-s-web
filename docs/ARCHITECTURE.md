# 隐私政策合规智能审查平台 — 技术文档（简化版）

> **项目**: sy-s-web (PrivacyGuard / 智审合规)  
> **技术栈**: React 19 + TypeScript + Vite + Tailwind CSS 4  
> **部署**: Cloudflare Pages (前端) + HuggingFace Spaces (后端)

---

## 一句话说明

**一个 NLP 驱动的隐私政策合规审查平台**：上传/粘贴隐私政策 → AI 自动检测 12 类违规 → 匹配法律条文 → 生成整改建议 → 导出报告。

---

## 架构总览

```
┌──────────────────┐         ┌──────────────────────┐
│   营销站 (未登录)  │  ←→     │    B端产品 (已登录)    │
│                  │  登录    │                      │
│  Landing 首页     │ ──────► │  Sidebar + Header      │
│  Pricing 定价页   │         │  Overview 仪表盘       │
│  Login/Register   │         │  Details 违规明细      │
└──────────────────┘         │  NewTask 新建任务      │
                             │  History 历史报告      │
                             │  Drawer 整改面板       │
                             └──────────────────────┘
                                      ↕ API
                             ┌──────────────────────┐
                             │   FastAPI 后端        │
                             │   BERT-MoE 分类       │
                             │   Phi-4 整改生成      │
                             │   RAG 法律检索        │
                             └──────────────────────┘
```

**核心设计**: 单项目双模式 —— 同一套代码，未登录展示营销站，已登录展示 B 端产品。

---

## 核心文件速查

| 文件 | 行数 | 一句话职责 |
|------|------|-----------|
| `src/App.tsx` | 508 | **大脑**: 路由分发、全局状态、所有业务逻辑 |
| `src/types.ts` | 205 | 类型定义 + 后端数据→前端映射 |
| `src/utils/api.ts` | 210 | **所有 HTTP 接口封装**（6 个模块） |
| `src/config/violation-config.ts` | 338 | **12 类违规配置**：编号/权重/阈值/详情 |
| `src/components/Drawer.tsx` | 536 | 最复杂组件: 条款整改(摘要+重写双模式) |
| `src/components/Overview.tsx` | 365 | 仪表盘: 分数/分布/趋势/统计 |
| `src/pages/Landing.tsx` | 793 | 营销站首页(最大单文件) |

---

## 数据流

```
后端 API → api.ts (请求封装) → App.tsx (状态中心) → 各子组件 (props 只读)
                                                    ↑
子组件回调 → App.tsx handler → api.ts → 后端 (写入)
```

**关键点**: 所有状态集中在 App.tsx，子组件通过 props 接收数据和回调函数。

---

## 全部接口清单

### 认证 (2个)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登录，返回 token + user |
| POST | `/api/v1/auth/register` | 注册（成功后自动登录） |

### 分析/AI (2个) — 核心接口
| 方法 | 路径 | 超时 | 说明 |
|------|------|------|------|
| POST | `/api/v1/analyze` | **180s** | **主入口**: 输入文本→返回违规列表+得分 |
| POST | `/api/v1/rectify` | **180s** | **AI 整改**: 给定条款→返回改写建议 |

### 文件处理 (2个)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/upload` | 上传文件(TXT/MD/JSON/CSV, 最大20MB)→提取文本 |
| POST | `/api/v1/fetch-url` | 抓取 URL 内容→返回纯文本 |

### 项目管理 (3个)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/projects` | 项目列表(仅元数据, 无 clauses) |
| GET | `/api/v1/projects/{id}` | 项目详情(含完整 violations) |
| PUT | `/api/v1/projects/{id}` | 更新项目的 violations(采纳整改后同步) |

### 导出 (1个)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/export/{id}` | 导出纯文本报告(blob下载) |

---

## 12 类违规体系

基于论文《基于NLP的隐私政策合规审查方法研究》:

| 维度 | 编号 | 名称 | 权重 | 风险等级 |
|------|------|------|------|---------|
| **数据收集** | I1 | 过度收集敏感数据 | 0.15 | 高 |
| | I2 | 未说明收集目的 | 0.12 | 中高 |
| | I3 | 未获得明示同意 | 0.15 | 高 |
| | I4 | 收集范围超出需求 | 0.10 | 低 |
| **数据共享** | I5 | 未明确第三方共享范围 | 0.08 | 低 |
| | I6 | 未获得单独共享授权 | 0.12 | 中高 |
| | I7 | 未明确共享数据用途 | 0.08 | 低 |
| **数据留存** | I8 | 未明确留存期限 | 0.05 | 低 |
| | I9 | 未说明数据销毁机制 | 0.05 | 低 |
| **用户权利** | I10 | 未明确用户权利范围 | 0.05 | 低 |
| | I11 | 未提供便捷权利行使途径 | 0.03 | 低 |
| | I12 | 未明确权利响应时限 | 0.02 | 低 |

**得分公式**: `S = 100 - Σ(每条违规权重 × 100)`  
**风险判定**: ≥70 低风险 / 40~69 中等 / <40 高风险

---

## 关键工作流

### 工作流 1: 完整审查流程

```
用户输入(文件/URL/文本)
    ↓
[提取文本] → uploadFile() 或 fetchUrl()
    ↓
[分析中遮罩] "正在进行合规性分析..." (最长3分钟, 可取消)
    ↓
POST /api/v1/analyze → BERT-MoE 分类 + RAG 检索
    ↓
[构建 Project] mapRawToClauses() → 聚合同句多违规
    ↓
[结果] projects[] 置顶 + 切换到 Details 页面
```

### 工作流 2: 条款整改流程

```
Details 页点击"审查" → 打开 Drawer
    ↓
自动调用 rectify() API (Phi-4 LLM)
    ↓
两种模式:
  ├─ [合规重写] 原文 vs 改写 diff 对比 + 可编辑 + 采纳应用
  └─ [风险解读] 通俗 Q&A 解读 + 复制
    ↓
采纳 → updateProject() 同步到后端
```

### 工作流 3: 登录恢复

```
页面加载 → 检查 localStorage(token + user)
    ↓ 有值 → 自动恢复登录态
    ↓
getProjects() → 加载项目列表
    ↓
getProject(firstId) → 加载首个项目 clauses (关键!)
    ↓
渲染 Overview 仪表盘
```

---

## 已知问题 & 修复记录

| # | 问题 | 状态 | 说明 |
|---|------|------|------|
| 1 | 登录后仪表盘空白 | ✅ | 首个项目 clauses 未加载 → getProjects 后立即加载 |
| 2 | 条款编号随机变化 | ✅ | Math.random() → FNV-1a 内容哈希固定 ID |
| 3 | 历史日期换行 | ✅ | 添加 whitespace-nowrap |
| 4 | JS 文件返回 HTML | ✅ | 重新 build + push 触发 Cloudflare 重建 |
| 5 | 累计发现问题=0 | ✅ | projects[].clauses 全为空数组 → 改读 currentProject.clauses |
| 6 | clauseCount 不准确 | ⚠️ | 仅新项目有准确值，历史项目为 0（低优先级） |

---

## 部署信息

| 项目 | 值 |
|------|-----|
| 前端部署 | Cloudflare Pages (git push main 自动触发) |
| 后端部署 | HuggingFace Spaces (FastAPI) |
| 构建命令 | `pnpm build` (Vite → dist/) |
| 开发端口 | **5000** (必须) |
| API 代理 | `/api/*` → `localhost:7860` (开发环境) |
| 生产 API | 通过 `VITE_API_URL` 环境变量配置 |

---

## 设计系统速览

| 元素 | 值 |
|------|-----|
| 字体 | Inter (正文) + JetBrains Mono (代码) + Newsreader (衬线) |
| 背景 | 渐变 (indigo→purple→teal) + Glass Morphism 毛玻璃 |
| 强调色 | #d97757 (赤陶橙) |
| 动画库 | Motion (Framer Motion) + GSAP (营销站) |
| 图标 | Lucide React |
| 图表 | Recharts (趋势图) |

---

> 完整版文档见 `docs/FULL_ARCHITECTURE.md` (~3000+ 行，含每个文件的逐行解析)
