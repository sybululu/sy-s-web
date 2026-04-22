# 隐私政策合规智能审查平台 — 完整技术文档（详细版）

> **文档版本**: v1.0  
> **生成日期**: 2026-04-22  
> **项目名称**: sy-s-web (PrivacyGuard / 智审合规)  
> **覆盖范围**: 全部源码文件、架构设计、接口协议、数据流、组件树、状态管理、部署配置

---

## 目录

- [一、项目概览](#一项目概览)
  - [1.1 产品定位与核心价值](#11-产品定位与核心价值)
  - [1.2 技术栈全景](#12-技术栈全景)
  - [1.3 项目目录结构](#13-项目目录结构)
- [二、系统架构](#二系统架构)
  - [2.1 单项目双模式架构](#21-单项目双模式架构)
  - [2.2 路由策略详解](#22-路由策略详解)
  - [2.3 组件层级树](#23-组件层级树)
  - [2.4 数据流架构](#24-数据流架构)
- [三、核心状态管理 — App.tsx 深度解析](#三核心状态管理--apptsx-深度解析)
  - [3.1 状态定义全集](#31-状态定义全集)
  - [3.2 生命周期与副作用](#32-生命周期与副作用)
  - [3.3 核心业务函数](#33-核心业务函数)
  - [3.4 渲染分支逻辑](#34-渲染分支逻辑)
- [四、类型系统 — types.ts 完整解析](#四类型系统--types-ts-完整解析)
  - [4.1 业务类型定义](#41-业务类型定义)
  - [4.2 Clause 接口详解](#42-clause-接口详解)
  - [4.3 Project 接口详解](#43-project-接口详解)
  - [4.4 后端→前端映射工具](#44-后端前端映射工具)
  - [4.5 稳定随机 ID 算法](#45-稳定随机-id-算法)
  - [4.6 聚合模式映射逻辑](#46-聚合模式映射逻辑)
- [五、API 层 — api.ts 完整解析](#五-api-层--api-ts-完整解析)
  - [5.1 基础设施](#51-基础设施)
  - [5.2 认证相关 API](#52-认证相关-api)
  - [5.3 分析相关 API](#53-分析相关-api)
  - [5.4 文件/URL 处理 API](#54-文件url-处理-api)
  - [5.5 项目管理 API](#55-项目管理-api)
  - [5.6 导出功能](#56-导出功能)
- [六、违规配置系统 — violation-config.ts 完整解析](#六违规配置系统--violation-config-ts-完整解析)
  - [6.1 12 类违规类型编号体系](#61-12-类违规类型编号体系)
  - [6.2 权重配置与风险等级阈值](#62-权重配置与风险等级阈值)
  - [6.3 四大维度分组](#63-四大维度分组)
  - [6.4 违规详情信息库](#64-违规详情信息库)
  - [6.5 辅助函数集](#65-辅助函数集)
- [七、B端产品组件深度解析](#七b端产品组件深度解析)
  - [7.1 Sidebar 侧边栏](#71-sidebar-侧边栏)
  - [7.2 Header 顶部栏](#72-header-顶部栏)
  - [7.3 Overview 总览仪表盘](#73-overview-总览仪表盘)
  - [7.4 Details 违规条款明细](#74-details-违规条款明细)
  - [7.5 NewTask 新建审查任务](#75-newtask-新建审查任务)
  - [7.6 History 历史审查报告](#76-history-历史审查报告)
  - [7.7 Drawer 整改抽屉面板](#77-drawer-整改抽屉面板)
  - [7.8 Toast 轻提示](#78-toast-轻提示)
  - [7.9 Login 登录页](#79-login-登录页)
  - [7.10 Register 注册页](#710-register-注册页)
  - [7.11 PolicyModal 政策弹窗](#711-policymodal-政策弹窗)
- [八、营销站组件深度解析](#八营销站组件深度解析)
  - [8.1 Navbar 导航栏](#81-navbar-导航栏)
  - [8.2 Landing 首页 Hero](#82-landing-首页-hero)
  - [8.3 Pricing 定价页](#83-pricing-定价页)
  - [8.4 Footer 页脚](#84-footer-页脚)
  - [8.5 营销动效组件族](#85-营销动效组件族)
- [九、样式系统](#九样式系统)
  - [9.1 设计令牌 (Design Tokens)](#91-设计令牌-design-tokens)
  - [9.2 Glass Morphism 体系](#92-glass-morphism-体系)
  - [9.3 Diff 对比样式](#93-diff-对比样式)
  - [9.4 自定义滚动条](#94-自定义滚动条)
  - [9.5 营销站动画](#95-营销站动画)
- [十、构建与部署](#十构建与部署)
  - [10.1 Vite 配置](#101-vite-配置)
  - [10.2 构建流程](#102-构建流程)
  - [10.3 Cloudflare Pages 部署](#103-cloudflare-pages-部署)
  - [10.4 环境变量](#104-环境变量)
- [十一、接口协议完整清单](#十一接口协议完整清单)
  - [11.1 认证模块](#111-认证模块)
  - [11.2 分析模块](#112-分析模块)
  - [11.3 文件/URL 模块](#113-文件url-模块)
  - [11.4 项目管理模块](#114-项目管理模块)
  - [11.5 导出模块](#115-导出模块)
- [十二、完整工作流时序图](#十二完整工作流时序图)
  - [12.1 用户登录流程](#121-用户登录流程)
  - [12.2 新建审查任务流程](#122-新建审查任务流程)
  - [12.3 条款审查与整改流程](#123-条款审查与整改流程)
  - [12.4 历史报告查看流程](#124-历史报告查看流程)
- [十三、已知问题与修复记录](#十三已知问题与修复记录)
- [十四、附录](#十四附录)

---

## 一、项目概览

### 1.1 产品定位与核心价值

**智审合规 (PrivacyGuard)** 是一个基于 NLP 的隐私政策合规智能审查平台，面向 B 端企业用户提供：

| 能力 | 描述 |
|------|------|
| **违规检测** | 基于 BERT-MoE 分类模型，自动识别 12 类隐私政策违规项 |
| **RAG 法律检索** | 通过 Sentence-Transformers 向量检索，为每个违规项匹配具体法律条文 |
| **AI 整改建议** | 基于 Phi-4 大语言模型，提供「摘要解读」和「合规重写」双模式整改 |
| **合规评分** | 基于权重算法计算综合合规得分（0-100）及风险等级 |
| **报告导出** | 一键导出包含所有审查结果的综合文本报告 |

**目标用户**：法务团队、中小企业合规部门、需要定期自查隐私政策的互联网公司。

### 1.2 技术栈全景

```

---

## 附录 H: Cloudflare Pages 构建与缓存行为

### 构建流程（git push 触发）

```
git push origin main
    ↓
Cloudflare Webhook 接收
    ↓
克隆仓库 → npm ci (或 pnpm install)
    ↓
pnpm run build  →  vite build
    ↓
复制 _headers + _routes.json 到 dist/
    ↓
部署到 CDN 边缘节点（全球 ~300+ POP）
    ↓
HTTPS://<project>.dev.coze.site 可访问
```

### 缓存策略

| 资源类型 | Cache-Control | 说明 |
|---------|--------------|------|
| `index.html` | `no-cache` | 每次检查新版本 |
| `assets/*.js` | 基于文件名 hash | 长期缓存（文件名含 hash） |
| `assets/*.css` | 基于文件名 hash | 同上 |

**注意**: Vite 构建时自动在文件名中注入 content hash（如 `index-BguhZab6.js`），确保更新后 URL 变化，浏览器加载最新版本。

### 常见部署问题排查

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| 页面空白, JS 报 `Unexpected token '<'` | JS 文件返回 HTML | 检查 `_routes.json` 的 exclude 列表; 检查 `_headers` 中 JS MIME 类型 |
| 页面显示旧版本 | CDN 缓存未失效 | 清除浏览器缓存; 或在 Cloudflare Dashboard 手动清除缓存 |
| 构建失败 | TypeScript 错误 / 依赖安装失败 | 查看 Cloudflare 构建日志; 本地 `pnpm run lint` 先验证 |
| API 请求 401 | Token 过期 | 重新登录; 检查后端 token 有效期配置 |
| API 请求 CORS 错误 | 后端未配置允许来源 | 后端添加 `Access-Control-Allow-Origin` 头 |

---

## 附录 I: 开发环境调试指南

### 常用调试命令

```bash
# 启动开发服务器 (端口 5000)
pnpm dev

# 类型检查 (无输出 = 通过)
pnpm lint   # 即 tsc --noEmit

# 构建 (产物在 dist/)
pnpm build

# 预览构建产物
pnpm preview

# 检查端口占用
ss -lptn 'sport = :5000'

# 重启服务 (如果卡死)
kill $(ss -lptn 'sport = :5000' | grep -oP 'pid=\K\d+')
coze dev > /app/work/logs/bypass/dev.log 2>&1 &
```

### 日志位置

| 日志 | 路径 | 用途 |
|------|------|------|
| 应用日志 | `/app/work/logs/bypass/app.log` | 主流程错误 |
| 开发日志 | `/app/work/logs/bypass/dev.log` | Vite/构建日志 |
| 控制台日志 | `/app/work/logs/bypass/console.log` | 前端 console.* 输出 |

### 浏览器 DevTools 调试技巧

1. **查看网络请求**: Network 标签筛选 `api/v1`，检查请求/响应/状态码
2. **查看 localStorage**: Application → Local Storage → 检查 token/user 是否存在
3. **查看组件状态**: React DevTools → 选择 App 组件 → 查看 hooks state
4. **查看 Motion 动画**: DevTools → Performance 录制 → 分析动画帧
5. **模拟慢网络**: Network → No throttling → Slow 3G（测试超时处理）

---

> **文档最终版结束** — 详细版 **2997 行** + 简化版 **211 行** = **3208 行总计**。
┌─────────────────────────────────────────────────────────────┐
│                        前端技术栈                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   框架/运行时  │    UI 库      │   动画/交互    │   图表/可视化   │
│              │               │               │                │
│ React 19     │ Tailwind CSS 4 │ Motion        │ Recharts       │
│ TypeScript 5 │ shadcn/ui 风格 │ Framer Motion │ (趋势图)       │
│ Vite 6       │ Lucide Icons  │ GSAP          │                │
│ React Router 7│ Glass Morphism│ Three.js/OGL  │                │
│              │               │ (营销站)       │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                      包管理与构建                             │
│  pnpm · Vite build → dist/ (静态产物)                       │
│  部署: Cloudflare Pages (CDN + Edge)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        后端技术栈 (外部)                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Web 框架    │    数据库      │   AI 模型      │   向量检索     │
│              │               │               │                │
│ FastAPI      │ SQLite        │ RoBERTa      │ Sentence-Trans │
│ (Python)     │ SQLAlchemy    │ (分类)        │ (Embedding)    │
│              │               │ Phi-4         │ FAISS/ChromaDB │
│              │               │ (整改生成)     │                │
│ 部署: HuggingFace Spaces                                    │
└─────────────────────────────────────────────────────────────┘
```

**依赖清单 (package.json)**:

| 依赖 | 版本 | 用途 |
|------|------|------|
| `react` / `react-dom` | ^19.0.0 | 核心 UI 框架 |
| `typescript` | ~5.8.2 | 类型安全 |
| `vite` | ^6.2.0 | 构建工具 & Dev Server |
| `@vitejs/plugin-react` | ^5.0.4 | React Fast Refresh |
| `@tailwindcss/vite` | ^4.1.14 | Tailwind CSS v4 集成 |
| `tailwindcss` | ^4.1.14 | 原子化 CSS 框架 |
| `react-router-dom` | ^7.14.1 | 客户端路由 |
| `motion` | ^12.23.24 | 动画库 (Framer Motion) |
| `lucide-react` | ^0.546.0 | 图标库 |
| `recharts` | ^3.8.1 | 数据可视化图表 |
| `diff` | ^9.0.0 | 文本差异对比 |
| `gsap` | ^3.15.0 | 高级动画 (营销站) |
| `three` / `@types/three` | ^0.184.0 | 3D 渲染 (营销站背景) |
| `ogl` | ^1.0.11 | OpenGL 封装 (营销站) |

### 1.3 项目目录结构

```
sy-s-web/
├── .coze                          # Coze CLI 配置（预置，勿修改）
├── .cozeproj                      # Coze 项目脚本（预置）
├── _routes.json                   # Cloudflare Pages 路由规则
├── cloudflare.json                # Cloudflare 项目配置
├── index.html                     # Vite 入口 HTML（开发用）
├── metadata.json                  # 项目元数据
├── package.json                   # 依赖声明与 npm scripts
├── pnpm-lock.json                 # 锁定文件
├── tsconfig.json                  # TypeScript 编译配置
├── vite.config.ts                 # Vite 构建配置
│
├── public/                        # 静态资源
│   └── _headers                  # Cloudflare Headers 规则
│
├── dist/                          # 构建输出（git tracked）
│   ├── index.html
│   ├── _headers
│   ├── _routes.json
│   └── assets/
│       ├── index-*.js            # 主 JS bundle (~1.5MB)
│       └── index-*.css           # 主 CSS bundle (~80KB)
│
└── src/                           # 源代码根目录
    ├── main.tsx                   # 应用入口：BrowserRouter + App
    ├── App.tsx                    # 根组件：路由分发 + 全局状态
    ├── index.css                  # 全局样式：Design Tokens + Glass + 动画
    ├── vite-env.d.ts              # Vite 类型声明
    │
    ├── types.ts                   # 类型定义 + 映射工具函数
    ├── constants.ts               # 运行时常量（隐私政策范文）
    │
    ├── config/
    │   └── violation-config.ts    # 违规配置统一源（12类违规+权重+阈值）
    │
    ├── utils/
    │   └── api.ts                 # API 层：请求封装 + 所有接口方法
    │
    ├── components/                # 可复用组件
    │   ├── Sidebar.tsx            # B端侧边导航
    │   ├── Header.tsx             # B端顶栏（搜索+标题+操作按钮）
    │   ├── Overview.tsx           # 总览仪表盘（分数+分布+趋势+统计）
    │   ├── Details.tsx            # 违规条款明细表格（筛选+分页）
    │   ├── NewTask.tsx            # 新建审查任务（文件/URL/文本输入）
    │   ├── History.tsx            # 历史审查报告列表（筛选+分页）
    │   ├── Drawer.tsx             # 条款整改抽屉（摘要/重写双模式）
    │   ├── Toast.tsx              # 全局轻提示
    │   ├── Login.tsx              # 登录页面
    │   ├── Register.tsx           # 注册页面
    │   ├── PolicyModal.tsx        # 隐私政策阅读弹窗（强制阅读）
    │   ├── Navbar.tsx             # 营销站导航栏
    │   ├── Footer.tsx             # 营销站页脚
    │   ├── ColorBends.tsx/css     # 波浪背景动效
    │   ├── LineWaves.tsx/css      # 线条波浪动效
    │   ├── ScrollFloat.tsx/css    # 浮动文字动画
    │   ├── Folder.tsx/css         # 文件夹图标动效
    │   ├── Threads.tsx/css        # 线程线条动效
    │   ├── Stack.tsx/css          # 卡片堆叠组件
    │   └── ScrollFloat.css        # 滚动浮动样式
    │
    └── pages/                     # 页面级组件
        ├── Landing.tsx            # 营销站首页（Hero + Features + Workflow）
        ├── Pricing.tsx            # 营销站定价页（4档方案）
        └── Dashboard.tsx          # B端仪表盘容器（当前未使用）
```

---

## 十五、组件 Props 接口完整定义

### 15.1 SidebarProps

```typescript
interface SidebarProps {
  currentView: ViewType;           // 当前激活视图
  onViewChange: (view: ViewType) => void;  // 视图切换回调
  onLogout: () => void;            // 登出回调
  currentUser?: User | null;       // 当前用户（用于显示头像和名称）
}
```

**使用位置**: `App.tsx` 第 440 行

**行为说明**:
- `currentView` 决定哪个导航项高亮（通过 `layoutId` 动画指示器）
- `onViewChange` 由 App 的 `handleViewChange` 提供，内部执行 `setCurrentView(view)`
- `onLogout` 触发清除 localStorage + 设置 `isLoggedIn = false`
- 用户名显示优先级: `username` > `name` > `email@` 前缀

### 15.2 HeaderProps

```typescript
interface HeaderProps {
  title: string;                    // 当前页面标题（随 currentView 变化）
  searchQuery: string;              // 搜索框当前值
  onSearchChange: (query: string) => void;  // 搜索变更
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}
```

**使用位置**: `App.tsx` 第 447 行

**title 映射表**:
| currentView | title |
|-------------|-------|
| `'overview'` | `'总览仪表盘'` |
| `'new-task'` | `'新建审查任务'` |
| `'details'` | `'违规条款明细'` |
| `'history'` | `'历史审查报告'` |

**搜索功能现状**: `searchQuery` 状态存在但 **未在 Details/History 中实际使用** —— 这是一个待实现的功能点。

### 15.3 OverviewProps

```typescript
interface OverviewProps {
  currentProject: Project | null;   // 当前项目（必须含 clauses）
  projects: Project[];              // 所有项目列表（用于统计）
  onViewChange: (view: ViewType) => void;   // 跳转到新任务/详情页
  onRiskFilter?: (level: string) => void;    // 风险筛选传递到 Details
  isLoading?: boolean;              // 加载状态
}
```

**使用位置**: `App.tsx` 第 451 行, 带 `key={currentProject?.id}`

**key 的作用**: 当 `currentProject.id` 变化时强制销毁并重建 Overview 组件实例，确保所有内部 state（计算结果）重新初始化。这是修复"切换项目后数据不更新"问题的关键。

### 15.4 DetailsProps

```typescript
interface DetailsProps {
  currentProject: Project | null;            // 当前项目
  onOpenDrawer: (clause: Clause) => void;     // 打开 Drawer 查看条款
  onDownload: () => void;                     // 导出报告
  initialRiskFilter?: string | null;          // 从 Overview 传入的初始风险筛选
}
```

**使用位置**: `App.tsx` 第 457 行

**initialRiskFilter 联动机制**:
1. Overview 点击 "高风险 X 项" → `onRiskFilter('high')`
2. App 收到后设置 `riskFilterFromOverview = 'high'`
3. 传给 Details 的 `initialRiskFilter='high'`
4. Details 内部 useEffect 将 'high' 映射为对应的 categoryId 并设置 filterCategory

### 15.5 NewTaskProps

```typescript
interface NewTaskProps {
  onStartAnalysis: (type: string, value: any) => void;
}
```

**type 参数值**: `'file'` | `'url'` | `'text'`  
**value 参数类型**: `File` 对象 / URL 字符串 / 文本字符串

### 15.6 HistoryProps

```typescript
interface HistoryProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}
```

**onSelectProject 行为**: 
1. 调用 `loadProjectDetails(project)` 加载 clauses
2. 设置 `currentView = 'details'`

### 15.7 DrawerProps

```typescript
interface DrawerProps {
  clause: Clause | null;             // 当前查看的条款（null 时关闭）
  isOpen: boolean;                   // 是否打开
  onClose: () => void;               // 关闭回调
  onAdopt: (updatedClause: Clause) => void;  // 采纳整改建议
  onShowToast?: (msg, type?) => void;
}
```

**最复杂的 Props**:
- `clause` 变化时触发 useEffect → 加载/恢复 AI 建议或生成新建议
- `isOpen` 控制 Motion 动画（右侧滑入/滑出）
- `onAdopt` 更新本地 clauses + 同步到后端 API

### 15.8 ToastState & ToastProps

```typescript
// 全局状态（App.tsx 中）
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// 组件 Props
interface ToastProps {
  toast: ToastState;
}
```

**自动消失**: 3 秒后 `setVisible(false)`，使用 AnimatePresence 动画退出。

---

## 十六、动画系统详解

### 16.1 Motion (Framer Motion) 使用清单

本项目中 Motion 主要用于 B端产品的微交互：

| 使用场景 | 组件 | 动画类型 | 配置要点 |
|---------|------|---------|---------|
| 视图切换 | App.tsx `<AnimatePresence>` | 页面级过渡 | `mode="wait"` + `key={currentView}` |
| 侧边栏导航指示器 | Sidebar | layoutId 滑动 | `layoutId="active-nav-indicator"` |
| 标题切换 | Header | fade + slide | `motion.span` + `key={title}` |
| 仪表盘 staggered reveal | Overview | 交错入场 | `containerVariants` + `itemVariants` + delay |
| 圆环进度条 | Overview | strokeDashoffset | `animate={{ pathLength }}`, duration 1.5s |
| 进度条填充 | Overview | width 动画 | `animate={{ width }}`, delay idx*0.1 |
| 分类条形图 | Overview | width 动画 | 同上 |
| 抽屉开关 | Drawer | slide from right | `x: "100%" → "0%"`, spring stiffness |
| Toast 出现/消失 | Toast | scale + opacity | `initial={{scale:0.8}}` → `animate={{scale:1}}` |
| 登录卡片入场 | Login/Register | bounce | `bounce: 0.3` |
| PolicyModal 开关 | PolicyModal | scale + opacity | spring 类型 |

### 16.2 GSAP 使用清单（营销站专用）

GSAP 仅在 Landing.tsx 中使用：

| 效果 | 用途 |
|------|------|
| `gsap.fromTo` | Hero 区域文字逐行揭示动画（y 偏移 + opacity） |
| `gsap.timeline` | Features 区域 Tab 切换的内容过渡 |
| ScrollTrigger | 各区块滚动触发的入场动画 |

### 16.3 Three.js / OGL（营销站背景）

| 组件 | 效果 |
|------|------|
| ColorBends | WebGL 波浪色彩混合背景（基于 OGL） |
| LineWaves | Canvas 线条波浪动画 |

---

## 十七、安全相关设计

### 17.1 认证机制

```
登录流程:
  POST /api/v1/auth/login { email, password }
  → 返回 { token: JWT/Bearer token, user: {...} }

后续请求:
  Authorization: Bearer <token>  (存储在 localStorage)

Token 过期处理:
  apiFetch() 收到 401 → 清除 localStorage → navigate('/') → 显示登录页
```

### 17.2 输入验证

| 验证点 | 规则 | 位置 |
|--------|------|------|
| 文件上传扩展名 | `.txt/.md/.json/.csv` | NewTask.validateFile() |
| 文件大小 | ≤ 20MB | NewTask.validateFile() |
| Email 格式 | 包含 @ | Login 组件内联检查 |
| 密码非空 | length > 0 | Login/Register |
| 注册确认密码 | === password | Register |
| 协议勾选 | 必须滚动到底部 | PolicyModal |

### 17.3 XSS 防护

- **Diff HTML**: `escapeHtml()` 函数对 diff 中的文本进行转义（`< > & "` → HTML entity）
- **法律依据**: 直接渲染为纯文本（`<pre>` 标签），不使用 `dangerouslySetInnerHTML`
- **用户输入**: 文件名/URL 通过 React JSX 自动转义
- **AI 生成内容**: rectify API 返回的 suggested_text 在 rewrite 模式下经过 diffWords 处理后以 HTML 渲染，但每段都经过 escapeHtml

### 17.4 CSRF / 其他

- 本项目为 SPA + Token 认证，不依赖 Cookie Session，天然免疫 CSRF
- API 代理仅在开发环境启用 (`VITE_API_URL` 未设置时)
- 生产环境直接请求外部后端域名

---

## 十八、性能考量

### 18.1 Bundle 大小

| 资源 | 原始大小 | Gzip 后 | 说明 |
|------|---------|---------|------|
| index.js | ~1.57 MB | ~468 KB | 单 bundle（含 React/Motion/Recharts/GSAP/Three/diff） |
| index.css | ~80 KB | ~13 KB | Tailwind CSS (purged) |
| index.html | 425 B | 320 B | 入口 HTML |

**注意**: 当前配置 `manualChunks: undefined`，所有 JS 打包为单文件。可考虑拆分:
- `react` + `react-dom` (vendor chunk)
- `recharts` (图表 chunk)
- `motion` (动画 chunk)

### 18.2 渲染优化

| 优化点 | 实现方式 | 位置 |
|--------|---------|------|
| 列表分页 | Details(8条/页), History(6条/页) | 手动 slice |
| 筛选缓存 | `useMemo` 依赖 clauses + filterCategory | Details |
| 组件 remount | `key={currentProject?.id}` | Overview |
| AI 结果缓存 | `generatedCache[cacheKey]` 对象 | Drawer |
| 动态导入 | `import('../utils/api')` in Drawer | 解决循环依赖 |
| 条件渲染 | `isAnalyzing` 遮罩层 | App.tsx |

### 18.3 可优化的方向

| 方向 | 当前状态 | 建议 |
|------|---------|------|
| 长列表虚拟化 | 无 | History/Details 数据量大时可引入 react-virtualized |
| 图片懒加载 | 无图片资源 | N/A |
| 代码分割 | 单 bundle | 按路由/组件拆分 chunks |
| 搜索防抖 | 无 debounce | Header searchQuery 应加 debounce |
| API 请求去重 | 无 | 快速切换项目可能触发重复 getProject |

---

## 十九、测试策略建议

### 19.1 单元测试覆盖建议

| 模块 | 测试重点 | 工具建议 |
|------|---------|---------|
| `types.ts` | `mapRawToClause()` 字段映射正确性 | Vitest |
| `types.ts` | `stableRandomId()` 相同输入相同输出 | Vitest |
| `violation-config.ts` | 权重之和=1, 阈值边界值 | Vitest |
| `api.ts` | `apiFetch()` 错误处理(401/超时/网络断开) | Vitest + MSW |
| `Drawer.tsx` | 缓存命中/未命中逻辑 | Testing Library |

### 19.2 E2E 测试关键路径

1. **登录流程**: 输入凭据 → 勾选协议 → 登录成功 → 仪表盘展示数据
2. **新建审查**: 粘贴文本 → 分析完成 → Details 展示违规列表
3. **条款整改**: 打开 Drawer → AI 生成 → 编辑 → 采纳 → 数据同步
4. **导出报告**: 点击导出 → 文件下载
5. **营销站→产品流**: Landing CTA → Login → 产品首页

### 19.3 可访问性 (A11y) 待改进项

- [ ] Sidebar 导航项缺少 `aria-current` 标记
- [ ] 表格缺少 `<caption>` 或 `aria-label`
- [ ] Drawer 打开时焦点陷阱未实现
- [ ] Toast 缺少 `role="alert"` 和 `aria-live`
- [ ] Modal 缺少 `aria-modal="true"` 和焦点管理

---

## 二十、版本历史与迭代记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0-base | - | 项目初始化: Vite + React 19 + Tailwind 4 + 双模式架构 |
| v1.0-fix-1 | - | 修复登录后仪表盘空白 (clauses 自动加载 + key remount) |
| v1.0-fix-2 | - | 修复条款编号随机 (FNV-1a 固定哈希) |
| v1.0-fix-3 | - | 修复历史日期换行 (whitespace-nowrap) |
| v1.0-fix-4 | - | 修复 Cloudflare 构建失败 (JSX 闭合标签) |
| v1.0-fix-5 | - | 修复累计发现问题=0 (取 currentProject.clauses.length) |
| v1.0-docs | 今天 | 生成完整技术文档 (详细版 + 简化版) |

---

> **文档结束** — 共计约 3000+ 行，覆盖全部 22 个源码文件、6 个接口模块、12 类违规体系、4 个核心工作流、以及性能/安全/测试建议。

---

## 附录 E: 完整错误处理矩阵

### apiFetch() 错误分类

| 错误类型 | 触发条件 | 抛出对象 | code 字段 | 前端处理方式 |
|---------|---------|---------|----------|------------|
| **AbortError** | 用户取消 / 超时 | `Error` (name='AbortError') | - | 检测 `error.name === 'AbortError'` → "已取消" |
| **CanceledError** | 外部 signal abort | `ApiError` | `'CanceledError'` | 同上（兼容不同环境） |
| **UNAUTHORIZED** (401) | Token 过期/无效 | `ApiError` (status=401) | `'UNAUTHORIZED'` | 清除 localStorage → navigate('/') |
| **TIMEOUT** | 超过 REQUEST_TIMEOUT | `ApiError` | `'TIMEOUT'` | 显示"请求超时，请重试" |
| **NETWORK_ERROR** | 断网/DNS失败 | `ApiError` | `'NETWORK_ERROR'` | 显示"网络连接异常" |
| **HTTP_ERROR** | 其他 4xx/5xx | `ApiError` (status=xxx) | `'HTTP_ERROR'` | 显示后端返回的 detail/message |
| **PARSE_ERROR** | 响应非有效 JSON | `ApiError` | - | 显示"数据解析失败" |

### 各组件的错误展示策略

| 组件 | 错误场景 | 展示方式 |
|------|---------|---------|
| Login/Register | 登录/注册 API 失败 | 表单下方红色文字 `setLoginError()` |
| NewTask | 文件验证失败 | 红色 toast + 清空 input |
| Overview | 无项目数据 | 空状态插图 + 引导按钮 |
| Details | 无 clauses | 空状态提示 |
| Drawer | AI 生成失败 | 红色 toast ("生成失败") |
| History | 无历史记录 | 空状态插图 |
| 全局 | 分析中取消 | toast ("已取消审查", error) |
| 全局 | 分析超时/失败 | toast (error.message \|\| "分析失败") |

---

## 附录 F: localStorage 数据结构

### 存储的键值对

| Key | 类型 | 写入时机 | 读取时机 | 清除时机 |
|-----|------|---------|---------|---------|
| `token` | `string` (JWT) | Login/Register 成功后 | 每次 API 请求 (apiFetch) | Logout / 401 响应 |
| `user` | `string` (JSON) | Login/Register 成功后 | 应用启动恢复登录态 | Logout / 401 响应 |

### User 对象序列化格式

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "zhangsan",
  "name": "张三"
}
```

**注意**: 后端可能返回 `name` 而非 `username`，Login 组件做了归一化处理:
```typescript
username: rawUser.username || rawUser.name || '',
```

---

## 附录 G: Motion 动画配置速查

### 项目中使用的 spring 配置

```typescript
// Sidebar 导航指示器
type: 'spring', stiffness: 400, damping: 30

// Drawer 开关
type: 'spring', stiffness: 300, damping: 30

// Toast 出现
type: 'spring', stiffness: 500, damping: 30

// PolicyModal
type: 'spring', damping: 25, stiffness: 350

// Login/Register 卡片
bounce: 0.3  // GSAP bounce 效果
```

### staggered reveal 配置 (Overview)

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }  // 子元素依次延迟 100ms
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
```

### Landing 页 GSAP ScrollTrigger 配置

```typescript
gsap.fromTo(element, 
  { y: 60, opacity: 0 },     // 初始状态
  {                           // 目标状态
    y: 0, 
    opacity: 1, 
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: element,
      start: 'top 85%',      // 元素顶部进入视口 85% 时触发
      toggleActions: 'play none none none'
    }
  }
);
```


## 二、系统架构

### 2.1 单项目双模式架构

本项目采用 **单代码仓库、双运行模式** 的架构设计：

```
                    ┌─────────────────────────────────┐
                    │         用户访问 / URL            │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │        main.tsx 入口              │
                    │   <BrowserRouter> <App />         │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │         App.tsx 根组件            │
                    │                                   │
                    │  检查 isLoggedIn 状态             │
                    └──────┬──────────────────┬────────┘
                           │                  │
              ┌────────────▼─────┐  ┌────────▼────────┐
              │   未登录 (false)  │  │  已登录 (true)   │
              │                  │  │                  │
              │  营销站模式       │  │  B端产品模式      │
              │  - Landing 首页   │  │  - Sidebar       │
              │  - Pricing 定价   │  │  - Header        │
              │  - Login 登录页   │  │  - Overview      │
              │                  │  │  - NewTask       │
              │  Routes 分发:    │  │  - Details       │
              │  / → Landing     │  │  - History       │
              │  /pricing → Price│  │  - Drawer        │
              │  /login → Auth   │  │  - Toast         │
              └──────────────────┘  └─────────────────┘
```

**关键设计决策**：
- 未登录时使用 React Router 的 `<Routes>` 进行页面级路由切换
- 已登录后脱离 Router，使用内部 `currentView` 状态进行视图切换（非 URL 路由）
- 这种设计避免了登录前后 URL 冲突，同时保持营销站的 SEO 友好性

### 2.2 路由策略详解

#### 未登录路由表（React Router `<Routes>`）

| 路径 | 组件 | 布局 | 说明 |
|------|------|------|------|
| `/` | `<Landing />` | MarketingLayout | 营销站首页 |
| `/pricing` | `<Pricing />` | MarketingLayout | 定价方案页 |
| `/login` | `<AuthPage />` | 全屏 | 登录/注册页 |

**MarketingLayout 结构**:
```jsx
<MarketingLayout>
  <Navbar />        {/* 固定顶部导航，支持滚动隐藏 */}
  <main>{children}</main>  {/* 页面内容区 */}
  <Footer />        {/* 页脚 */}
</MarketingLayout>
```

#### 已登录视图状态机（非 URL 路由）

| ViewType 值 | 组件 | 说明 |
|-------------|------|------|
| `'overview'` | `<Overview />` | 总览仪表盘 |
| `'new-task'` | `<NewTask />` | 新建审查任务 |
| `'details'` | `<Details />` | 违规条款明细 |
| `'history'` | `<History />` | 历史审查报告 |

**视图切换通过 `handleViewChange(viewType)` 触发**，不改变 URL。这是有意为之的设计——B端产品不需要浏览器前进/后退，且避免了与营销站路由冲突。

### 2.3 组件层级树

```
App (BrowserRouter 包裹)
│
├── [未登录] Routes
│   ├── MarketingLayout
│   │   ├── Navbar
│   │   ├── Landing (pages/Landing.tsx, ~800行)
│   │   │   ├── MagneticButton (内联组件)
│   │   │   ├── ScrollUnfold (内联组件)
│   │   │   ├── ScrollSlide (内联组件)
│   │   │   ├── ScrollFlip (内联组件)
│   │   │   ├── InteractiveFlipCard (内联组件)
│   │   │   ├── ScrollReveal (内联组件)
│   │   │   ├── DemoClauseCard (内联组件)
│   │   │   ├── ColorBends (波浪背景)
│   │   │   └── Stack (卡片堆叠)
│   │   └── Footer
│   │
│   ├── MarketingLayout
│   │   ├── Navbar
│   │   ├── Pricing (pages/Pricing.tsx)
│   │   └── Footer
│   │
│   └── AuthPage (全屏)
│       ├── Login (或 Register)
│       └── PolicyModal (条件渲染)
│
└── [已登录] B端布局
    ├── Sidebar
    ├── Header
    ├── main 内容区 (AnimatePresence 切换)
    │   ├── Overview (key={projectId})
    │   ├── NewTask
    │   ├── Details
    │   └── History
    ├── Drawer (条件渲染, 右侧滑入)
    └── Toast (条件渲染)
    └── 分析遮罩层 (条件渲染, isAnalyzing)
```

### 2.4 数据流架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   后端 API   │────▶│   api.ts    │────▶│   App.tsx    │
│ (FastAPI)   │◀────│  (请求封装)  │◀────│  (状态中心)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                 │
                    ┌────────────────────────────┼────────────────────┐
                    │                            │                    │
              ┌─────▼──────┐              ┌──────▼──────┐     ┌──────▼──────┐
              │  Overview   │              │   Details    │     │   Drawer    │
              │ (只读展示)  │              │ (筛选+分页)  │     │ (编辑+采纳)  │
              └────────────┘              └─────────────┘     └─────────────┘
                    ▲                            ▲                    │
                    │                            │                    │
              ┌─────┴──────┐              ┌──────┴──────┐     ┌──────┴──────┐
              │  projects[] │              │ currentProject│    │ handleAdopt  │
              │ currentProj│              │  .clauses[]  │    │ (更新clauses)│
              └────────────┘              └─────────────┘     └─────────────┘
```

**数据流向说明**：

1. **下行流（读取）**: `api.ts` → `App.tsx state` → 各子组件 props
2. **上行流（写入）**: 子组件回调 → `App.tsx handler` → `api.ts` → 后端
3. **横向流（同步）**: `handleAdopt` 更新本地 clauses → 同步调用 `updateProject` API

---

## 三、核心状态管理 — App.tsx 深度解析

### 3.1 状态定义全集

```typescript
// ====== 身份与认证 ======
isLoggedIn: boolean;              // 是否已登录（控制营销站/B端切换）
isRegistering: boolean;          // 是否处于注册模式（控制 AuthPage 内部切换）
currentUser: User | null;        // 当前登录用户信息 { id, email, username, name? }

// ====== 导航与视图 ======
currentView: ViewType;           // 当前 B 端视图: 'overview' | 'new-task' | 'details' | 'history'
riskFilterFromOverview: string | null; // 从仪表盘传入的风险筛选值

// ====== 项目数据 ======
projects: Project[];             // 项目列表（仅含基础信息: id, name, score, riskStatus）
currentProject: Project | null;  // 当前选中项目（含完整 clauses 数据）

// ====== 条款操作 ======
selectedClause: Clause | null;   // 当前在 Drawer 中查看的条款
isDrawerOpen: boolean;          // Drawer 抽屉是否打开

// ====== 搜索与过滤 ======
searchQuery: string;             // 全局搜索关键词（Header 输入框）

// ====== 分析状态 ======
isAnalyzing: boolean;           // 是否正在执行分析（显示全局遮罩）
analysisStep: string;            // 分析进度文字描述
abortControllerRef: useRef<AbortController | null>; // 取消分析控制器

// ====== UI 反馈 ======
toast: ToastState;               // 全局轻提示 { message, type, visible }
isLoadingProjects: boolean;     // 项目列表加载状态（防止闪烁"暂无数据"）
```

### 3.2 生命周期与副作用

#### Effect 1: 营销站 CTA 拦截（第 112-128 行）

```typescript
useEffect(() => {
  if (isLoggedIn) return;  // 已登录不监听
  const handleExperienceClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') &&
      (target.textContent?.includes('立即体验') || 
       target.textContent?.includes('立即开始使用'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      setIsRegistering(false);
      navigate('/login');  // 跳转到全屏登录页
    }
  };
  document.addEventListener('click', handleExperienceClick, true);  // 捕获阶段
  return () => document.removeEventListener('click', handleExperienceClick, true);
}, [isLoggedIn, navigate]);
```

**作用**: 拦截营销站 Landing/Pricing 页面上所有包含"立即体验"/"立即开始使用"文字的按钮点击事件，强制跳转到 `/login` 登录页。使用捕获阶段 (`true`) 确保优先于子组件的事件处理程序。

#### Effect 2: Token 自动恢复（第 130-147 行）

```typescript
useEffect(() => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setIsLoadingProjects(true);
      navigate('/', { replace: true });  // 强制导航到产品首页
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}, []);
```

**作用**: 应用启动时检查 localStorage 中是否存在有效 token 和用户信息。如果存在，自动恢复登录状态并导航到 B 端产品首页（`replace: true` 避免用户按后退回到营销站）。如果 JSON 解析失败则清除无效数据。

#### Effect 3: 项目列表加载（第 149-211 行）— **核心数据加载**

```typescript
useEffect(() => {
  if (!isLoggedIn) return;
  setIsLoadingProjects(true);
  api.getProjects()
    .then(async (data) => {
      if (Array.isArray(data)) {
        // 映射为 Project[]（此时 clauses 为空数组）
        const mappedProjects = data.map((p) => ({
          id: p.id,
          name: p.name,
          date: p.created_at?.split('T')[0] || '',
          description: `审查得分: ${p.score}，风险等级: ${p.risk_level}`,
          score: p.score,
          riskStatus: p.risk_level,
          clauseCount: 0,
          clauses: []  // ⚠️ 关键：列表中不含 clauses 详情
        }));
        
        if (mappedProjects.length > 0) {
          const firstProject = mappedProjects[0];
          // 加载首个项目的完整 clauses 数据
          const detail = await api.getProject(String(firstProject.id));
          const fullProject = {
            ...firstProject,
            clauses: mapRawToClauses(detail.violations || []),
          };
          setProjects(mappedProjects);
          setCurrentProject(fullProject);  // 仅 currentProject 有 clauses
        } else {
          setProjects(mappedProjects);
          setCurrentProject(null);
        }
      }
    })
    .finally(() => setIsLoadingProjects(false));
}, [isLoggedIn]);
```

**关键行为**:
1. `getProjects()` 返回的项目列表**只有基础元数据**（id, name, score, risk_level），**没有 violations/clauses**
2. 只有 `currentProject`（当前选中的第一个项目）会额外调用 `getProject(id)` 加载完整的 clauses 数据
3. 这就是为什么 Overview 中 `totalClauses` 不能从 `projects.reduce(p => p.clauses.length)` 计算——因为全是空数组

#### Effect 4: Details 视图懒加载（第 245-249 行）

```typescript
useEffect(() => {
  if (currentView === 'details' && currentProject && 
      (!currentProject.clauses || currentProject.clauses.length === 0)) {
    loadProjectDetails(currentProject);
  }
}, [currentView]);
```

**作用**: 当用户切换到 details 视图但当前项目的 clauses 还没加载时，自动触发加载。这是为了处理从 History 页点击进入的场景——History 中的 project 对象可能没有 clauses。

### 3.3 核心业务函数

#### `handleLogin(token, user)` — 登录处理

```typescript
const handleLogin = (token: string, user: User) => {
  setCurrentUser(user);
  setIsLoggedIn(true);
  setIsLoadingProjects(true);
  setCurrentView('overview');
  navigate('/', { replace: true });  // 跳到产品首页
};
```

注意：**token 和 user 的存储是在 Login/Register 组件内部完成的**（写入 localStorage），App.tsx 只负责更新内存状态。

#### `handleLogout()` — 登出处理

```typescript
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setCurrentUser(null);
  setIsLoggedIn(false);
  setCurrentView('overview');
  // 不调用 navigate —— isLoggedIn 变 false 后 Routes 自动切换到营销站
};
```

#### `loadProjectDetails(project)` — 加载项目详情

```typescript
const loadProjectDetails = async (project: Project) => {
  const detail = await api.getProject(String(project.id));
  const fullProject: Project = {
    ...project,
    clauses: mapRawToClauses(detail.violations || []),
  };
  setCurrentProject(fullProject);
};
```

#### `handleSelectProject(project)` — 从 History 选择项目

```typescript
const handleSelectProject = async (project: Project) => {
  await loadProjectDetails(project);  // 先加载 clauses
  setCurrentView('details');          // 再跳到详情页
};
```

#### `handleAdopt(updatedClause)` — 采纳整改建议

```typescript
const handleAdopt = (updatedClause: Clause) => {
  if (!currentProject) return;
  
  // 1. 更新本地 state
  const updatedClauses = currentProject.clauses.map(c =>
    c.id === updatedClause.id ? updatedClause : c
  );
  const updatedProject = { ...currentProject, clauses: updatedClauses };
  setCurrentProject(updatedProject);
  
  // 2. 同步到后端（fire-and-forget，不阻塞 UI）
  api.updateProject(String(currentProject.id), updatedClauses.map(c => ({
    indicator: c.categoryName || c.reason,
    violation_id: String(c.category),
    snippet: c.originalText,
    legal_basis: c.legalBasis,
    legal_detail: c.legalDetail || '',
    suggested_text: c.suggestedText !== '【系统建议】请根据合规要求修改。' 
      ? c.suggestedText : '',
  }))).catch(err => console.error('Failed to sync:', err));
  
  showToast('整改方案已应用到当前草稿');
  setIsDrawerOpen(false);
};
```

**字段映射注意事项**:
- `indicator`: 使用 `categoryName` 或 `reason`（人类可读名称）
- `violation_id`: 使用 `category`（可能是数字或字符串 "I1" 格式）
- `suggested_text`: 排除默认占位文本后再发送

#### `handleStartAnalysis(type, value)` — 执行审查分析 — **最复杂的业务函数**

```typescript
const handleStartAnalysis = async (type: string, value: any) => {
  if (!value) { showToast('请输入有效内容', 'error'); return; }
  
  abortControllerRef.current = new AbortController();
  setIsAnalyzing(true);
  setAnalysisStep('正在提取文本内容...');
  
  try {
    let textToAnalyze = value;
    
    // 步骤 1: 如果是文件，先上传提取文本
    if (type === 'file') {
      const uploadRes = await api.uploadFile(value as File);
      textToAnalyze = uploadRes.text;
    } 
    // 步骤 2: 如果是 URL，先抓取内容
    else if (type === 'url') {
      const urlRes = await api.fetchUrl(value as string);
      textToAnalyze = urlRes.text;
    }
    
    // 步骤 3: 调用分析 API（支持取消）
    setAnalysisStep('正在进行合规性分析...');
    const result = await api.analyze(textToAnalyze, type, abortControllerRef.current.signal);
    
    setAnalysisStep('正在生成审查报告与整改建议...');
    
    // 步骤 4: 构建新 Project 对象
    const newProject: Project = {
      id: result.id,
      name: result.name,
      date: new Date().toISOString().split('T')[0],
      description: `自动化合规审查报告。共发现 ${result.violations.length} 项潜在风险。`,
      score: result.score,
      riskStatus: result.risk_level,
      clauseCount: result.violations?.length || 0,
      clauses: mapRawToClauses(result.violations || []),
    };
    
    // 步骤 5: 更新状态
    setProjects(prev => [newProject, ...prev]);  // 置顶
    setCurrentProject(newProject);
    setCurrentView('details');  // 直接跳到详情页
    setSearchQuery('');
    showToast('审计完成，已生成合规报告');
    
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      showToast('已取消审查', 'error');
    } else {
      showToast(error.message || '分析失败，请重试', 'error');
    }
  } finally {
    abortControllerRef.current = null;
    setIsAnalyzing(false);
    setAnalysisStep('');
  }
};
```

**分析流程时序**:
```
用户提交 → [遮罩出现: "正在提取文本..."]
         → 上传文件/抓取URL (如需)
         → [遮罩更新: "正在进行合规性分析..."]
         → POST /api/v1/analyze (最长180s超时, 可取消)
         → [遮罩更新: "正在生成审查报告..."]
         → 构建 Project + mapRawToClauses
         → 更新 projects[] + currentProject
         → 切换到 details 视图
         → [遮罩消失]
```

#### `cancelAnalysis()` — 取消分析

```typescript
const cancelAnalysis = useCallback(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();  // 触发 AbortError
    abortControllerRef.current = null;
  }
  setIsAnalyzing(false);
  setAnalysisStep('');
}, []);
```

### 3.4 渲染分支逻辑

App.tsx 的 render 方法有两个完全不同的分支：

#### 分支 A: 未登录 — 营销站（第 380-405 行）

```jsx
if (!isLoggedIn) {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout><Landing /></MarketingLayout>} />
      <Route path="/pricing" element={<MarketingLayout><Pricing /></MarketingLayout>} />
      <Route path="/login" element={<AuthPage ... />} />
    </Routes>
  );
}
```

#### 分支 B: 已登录 — B端产品（第 434-508 行）

```jsx
return (
  <div className="flex h-screen overflow-hidden">
    <Sidebar ... />                    {/* 左侧固定导航 */}
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header ... />                   {/* 顶部搜索栏 */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">   {/* 视图切换动画 */}
          <motion.div key={currentView}>
            {currentView === 'overview' && <Overview key={...} />}
            {currentView === 'new-task' && <NewTask ... />}
            {currentView === 'details' && <Details ... />}
            {currentView === 'history' && <History ... />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
    <Drawer ... />                      {/* 条款整改抽屉 */}
    {isAnalyzing && <AnalysisOverlay />}  {/* 分析中遮罩 */}
    <Toast ... />                        {/* 全局提示 */}
  </div>
);
```

---

## 四、类型系统 — types.ts 完整解析

### 4.1 业务类型定义

```typescript
/** 视图类型枚举 */
type ViewType = 'overview' | 'new-task' | 'details' | 'history';

/** Toast 状态 */
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

/** 用户信息 */
interface User {
  id: number;
  email: string;
  username: string;
  name?: string;  // 后端可能返回 name 而非 username
}
```

### 4.2 Clause 接口详解

```typescript
interface Clause {
  id: number | string;              // 条款标识（V+5位数字，基于内容哈希）
  originalText: string;             // 原始条款文本（触发违规的句子）
  suggestedText: string;            // AI 改写建议（默认占位: "【系统建议】..."）
  reason: string;                  // 违规原因（人类可读，多违规时逗号分隔）
  category: number | string;        // 违规类别编号（I1-I12 或数字 1-12）
  categoryName?: string;           // 违规类别中文名
  snippet?: string;                // 条款摘要片段（用于搜索）
  weight?: number;                 // 权重值（0-1，多违规取最高）
  probability?: number;            // 模型预测置信度
  riskLevel?: string;              // 风险等级: '高风险' | '中等风险' | '低风险'
  location: string;               // 条款位置描述（如 "第1节"）
  legalBasis: string;              // 法律依据引用（多违规时分号分隔）
  legalDetail?: string;            // 法律依据完整条文正文（RAG 检索结果）
  diffOriginalHtml?: string;       // 原文 diff HTML（用于对比展示）
  diffSuggestedHtml?: string;      // 改写对比 HTML
  isAdopted?: boolean;             // 是否已被用户采纳
  
  // ========== 聚合模式特有字段 ==========
  violations?: Array<{
    id: string;                           // 违规ID ("I1")
    name: string;                         // 违规名称
    riskLevel: string;                    // 该违规的风险等级
    confidence: number;                   // 置信度 (0-1)
    legalBasis: string;                   // 法律依据
    legalDetail?: string;                 // 法条正文
    legalReferences?: Array<{             // RAG 检索到的多条法律依据
      law: string;                        // 法律名称
      article: string;                    // 条款号
      reference: string;                  // 引用格式
      content: string;                    // 法条内容
    }>;
  }>;
}
```

**聚合模式 vs 单条模式**:

| 特征 | 聚合模式 | 单条模式 |
|------|---------|---------|
| 触发条件 | 同一句子触发多个违规 | 一句对应一个违规 |
| `violations` 数组 | 有值（多个元素） | 无/空 |
| `reason` | 多个名称逗号分隔 | 单个名称 |
| `category` | 第一个违规的 ID | 该违规的 ID |
| `riskLevel` | 取最高等级 | 该违规的等级 |

### 4.3 Project 接口详解

```typescript
interface Project {
  id: number;                      // 项目唯一标识
  name: string;                    // 项目名称（通常来自原始文件名或 URL）
  description: string;             // 项目描述（自动生成: "审查得分: XX，风险等级: XX"）
  date: string;                    // 创建日期 (YYYY-MM-DD)
  score: number;                   // 合规得分 (0-100)
  riskStatus: string;              // 风险状态: '高风险' | '中等风险' | '低风险'
  clauseCount: number;             // 条款总数（⚠️ 可能不准确，见下文）
  clauses: Clause[];               // 条款详细列表（⚠️ 仅 currentProject 有值）
  policyText?: string;             // 原始政策文本（可选）
}
```

**关于 `clauseCount` 的已知问题**:
- 在 `getProjects()` 映射时设为 `0`（因为列表接口不返回 clauses）
- 在 `handleStartAnalysis` 中设为 `result.violations?.length || 0`（新项目有准确值）
- **其他场景可能过时** —— 这是 `totalClauses` 显示为 0 的根因之一

### 4.4 后端→前端映射工具

#### `mapRawToClause(raw, index?)` — 单条映射

将后端返回的原始对象（字段名可能是 snake_case 或 camelCase）映射为标准 `Clause` 类型。

**字段映射规则**:

| 后端字段 (优先级) | 前端字段 | 默认值 |
|-------------------|---------|--------|
| `raw.id` | `id` | `V${stableRandomId(...)}` |
| `raw.original_text ?? raw.originalText ?? raw.snippet` | `originalText` | `''` |
| `raw.suggested_text ?? raw.suggestedText` | `suggestedText` | `'【系统建议】请根据合规要求修改。'` |
| `raw.indicator ?? raw.reason` | `reason` | `getViolationName(categoryId)` |
| `raw.violation_id ?? raw.category` | `category` | `0` |
| `raw.weight ?? raw.probability` | `weight` | `getViolationWeight(categoryId)` |
| `raw.snippet ?? raw.original_text` | `snippet` | 同 originalText |
| `raw.location` | `location` | `` `第${index + 1节` `` |
| `raw.legal_basis` | `legalBasis` | `''` |
| `raw.legal_detail` | `legalDetail` | `undefined` |
| `raw.diff_original_html ?? raw.snippet` | `diffOriginalHtml` | snippet |
| `raw.diff_suggested_html` | `diffSuggestedHtml` | `<span class="diff-add">...</span>` |
| — | `isAdopted` | `false` |

#### `mapRawToClauses(rawClauses[])` — 批量映射（含聚合）

这是更高级的映射函数，实现了 **同一句子多违规聚合**：

**算法步骤**:
1. 按 `snippet`（句子原文）分组
2. 对每组（即同一句子的所有违规）：
   a. 为每条原始记录构建 `violations[]` 明细
   b. 取最高风险等级（按 RISK_PRIORITY 排序）
   c. 取最高置信度
   d. 合并 reason（逗号连接所有违规名）
   e. 合并 categoryName（逗号连接 `"I1 名称"、"I3 名称"`）
   f. 合并 legalBasis（分号连接）
   g. 合并 legalDetail（换行连接）
3. 返回聚合后的 `Clause[]`

### 4.5 稳定随机 ID 算法

```typescript
function stableRandomId(seed: string): string {
  let h = 2166136261 ^ seed.length;  // FNV offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;       // FNV prime, >>>0 保证无符号
  }
  return String((h % 90000) + 10000);  // 映射到 10000-99999
}
```

**算法**: FNV-1a 哈希变体
- **输入**: 条款的 `snippet` 或 `original_text` 内容
- **输出**: 10000~99999 之间的固定整数（转为字符串）
- **特性**: 相同内容永远产生相同 ID；不同内容大概率不同
- **用途**: 生成 `V12345` 格式的条款编号，替代原来不稳定的 `Math.random()`

### 4.6 聚合模式映射逻辑详解

```typescript
// 风险等级优先级（用于取最高）
const RISK_PRIORITY: Record<string, number> = { 
  '高风险': 3, '中等风险': 2, '低风险': 1 
};

// 示例输入: 同一句话触发了 I1 和 I3 两条违规
const rawClauses = [
  { snippet: "我们可能会收集您的位置信息...", violation_id: "I1", weight: 0.15, ... },
  { snippet: "我们可能会收集您的位置信息...", violation_id: "I3", weight: 0.15, ... },
];

// 输出: 聚合为一条 Clause
{
  id: "V38472",                              // 基于内容的固定 ID
  originalText: "我们可能会收集您的位置信息...", // 句子原文
  reason: "过度收集敏感数据、未获得明示同意",    // 逗号分隔
  category: "I1",                               // 取第一个
  categoryName: "I1 过度收集敏感数据、I3 未获得明示同意",
  weight: 0.15,                                // 最高权重
  riskLevel: "高风险",                          // I1 和 I3 都是高
  violations: [
    { id: "I1", name: "过度收集敏感数据", riskLevel: "高风险", confidence: 0.89 },
    { id: "I3", name: "未获得明示同意", riskLevel: "高风险", confidence: 0.76 },
  ],
  legalBasis: "《个人信息保护法》第六条；《个人信息保护法》第十四条",
  // ...
}
```

---

## 五、API 层 — api.ts 完整解析

### 5.1 基础设施

#### 配置常量

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '';  // 后端基地址（空字符串表示同源）
const REQUEST_TIMEOUT = 60000;      // 默认超时 60s
const LLM_REQUEST_TIMEOUT = 180000; // LLM 接口超时 3min（analyze/rectify）
```

#### 认证头生成

```typescript
function getAuthHeaders(isFormData: boolean = false) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';  // FormData 不手动设置
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
```

#### 自定义错误类

```typescript
export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}
// code 可能的值: 'UNAUTHORIZED'(401), 'TIMEOUT', 'NETWORK_ERROR', 'HTTP_ERROR'
```

#### 核心请求函数 `apiFetch()`

```typescript
export async function apiFetch(
  endpoint: string,           // API 路径 (如 '/api/v1/auth/login')
  options: RequestInit = {},   // fetch 选项 (method, body 等)
  externalSignal?: AbortSignal, // 外部取消信号（来自 abortControllerRef）
  timeout?: number             // 自定义超时（毫秒）
): Promise<any>
```

**完整流程**:
1. 创建内部 `AbortController` + 设置超时定时器
2. 监听外部 `signal` 的 abort 事件，联动内部 controller
3. 发起 `fetch(`${API_BASE}${endpoint}`, ...)`
4. **网络错误处理**: 区分 `AbortError`（转为 `CanceledError`）和其他网络错误
5. **401 处理**: 清除 localStorage + 跳转首页 + 抛出 `ApiError(401, UNAUTHORIZED)`
6. **HTTP 错误**: 解析响应体中的 `detail`/`message` 字段
7. **空响应**: 返回 `null`
8. **JSON 解析**: 尝试 `JSON.parse()`，失败则返回原始文本

**超时机制**:
- 默认 60s（普通接口）
- LLM 接口 180s（analyze/rectify）
- 外部 signal 可随时中断（用户点"取消审查"）

### 5.2 认证相关 API

#### `api.login(email, password)`

```
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { token: string, user: { id: string, email: string, name?: string } }
```

**Login 组件中的后续处理**:
```typescript
const data = await api.login(email, password);
localStorage.setItem('token', data.token);
// 归一化 user 对象（兼容 id 为字符串或数字的情况）
const normalizedUser: User = {
  id: typeof rawUser.id === 'number' ? rawUser.id : parseInt(rawUser.id, 10),
  email: rawUser.email || '',
  username: rawUser.username || rawUser.name || '',
  name: rawUser.name,
};
localStorage.setItem('user', JSON.stringify(normalizedUser));
onLogin(data.token, normalizedUser);
```

#### `api.register(email, password, name)`

```
POST /api/v1/auth/register
Body: { email: string, password: string, name: string }
Response: void (204 No Content 或类似)
```

**Register 组件的特殊行为**: 注册成功后**自动调用 login** 实现无缝登录：
```typescript
await api.register(email, password, username.trim());
const loginData = await api.login(email, password);  // 自动登录
// ... 存储 token/user 并触发 onRegister
```

### 5.3 分析相关 API

#### `api.analyze(text, source_type, signal?)` — **核心 AI 接口**

```
POST /api/v1/analyze
Body: { text: string, source_type: 'text' | 'url' | 'file' }
Timeout: 180000ms (3分钟)
Signal: 支持 AbortController 取消
Response: {
  id: string,
  name: string,
  score: number,           // 0-100 合规得分
  risk_level: string,      // '高风险' | '中等风险' | '低风险'
  violations: Array<{      // 原始违规记录
    violation_id: string | number,
    indicator: string,
    snippet: string,
    original_text: string,
    suggested_text: string,
    weight?: number,
    probability?: number,
    risk_level?: string,
    location?: string,
    legal_basis?: string,
    legal_detail?: string,
    diff_original_html?: string,
    diff_suggested_html?: string,
    legal_references?: Array<{...}>
  }>
}
```

**后端处理流程（推断）**:
1. 接收文本 → 句子分割（Sentence Splitting）
2. 每句经过 BERT-MoE 分类模型 → 12 类违规概率分布
3. 超阈值的违规项保留
4. 对每个违规项调用 RAG 检索匹配法律条文
5. 计算综合得分 S = 100 - Σ(wi × 100)
6. 返回结构化结果

#### `api.rectify(original_snippet, violation_type, legal_basis?, mode?)` — **AI 整改接口**

```
POST /api/v1/rectify
Body: {
  original_snippet: string,    // 原始条款文本
  violation_type: string,      // 违规类型 (如 "I1" 或 "1")
  legal_basis?: string,        // 已有的法律依据（辅助 LLM 生成）
  mode?: 'summary' | 'rewrite' // 模式: 摘要解读 | 合规重写
}
Timeout: 180000ms (3分钟)
Response: {
  suggested_text: string,      // 生成的建议文本
  legal_basis: string,         // 引用的法律依据
  legal_detail: string,        // 法条正文
  mode: string                 // 实际使用的模式
}
```

**两种模式区别**:
| 模式 | 输出风格 | 典型场景 |
|------|---------|---------|
| `summary` | 通俗语言解释风险，Q&A 式解读 | 用户想快速理解"这条为什么违规" |
| `rewrite` | 专业合规文本，可直接替换原条款 | 用户需要直接修改隐私政策 |

### 5.4 文件/URL 处理 API

#### `api.uploadFile(file)`

```
POST /api/v1/upload
Body: FormData { file: File }
Response: { text: string }  // 提取出的纯文本内容
```

**前端限制**（NewTask 组件）:
- 允许的扩展名: `.txt`, `.md`, `.json`, `.csv`
- 最大文件大小: 20MB (`20 * 1024 * 1024`)
- 验证失败时清空 input 并显示错误消息

#### `api.fetchUrl(url)`

```
POST /api/v1/fetch-url
Body: { url: string }
Response: { text: string }  // 抓取到的网页纯文本
```

### 5.5 项目管理 API

#### `api.getProjects()`

```
GET /api/v1/projects
Response: Array<{
  id: string,
  name: string,
  score: number,
  risk_level: string,
  created_at: string  // ISO 8601 格式
}>
```

**注意**: 此接口**不返回** violations/clauses 数据，仅返回项目元数据列表。

#### `api.getProject(id)`

```
GET /api/v1/projects/{id}
Response: {
  id: string,
  name: string,
  score: number,
  risk_level: string,
  violations: Array<RawViolation>  // 完整违规记录（同 analyze 接口的 violations 格式）
}
```

**此接口返回完整的 violations 数组**，用于填充 `currentProject.clauses`。

#### `api.updateProject(id, violations)`

```
PUT /api/v1/projects/{id}
Body: { violations: Array<{
  indicator: string,
  violation_id: string,
  snippet: string,
  legal_basis: string,
  legal_detail?: string,
  suggested_text: string
}> }
Response: { message: string, id: string }
```

**调用时机**: 用户在 Drawer 中点击"采纳并应用"时，将修改后的 clauses 同步到后端持久化。

### 5.6 导出功能

#### `api.exportReport(projectId)` — **特殊实现**

此方法**不走 `apiFetch`**，而是直接使用原生 `fetch` + blob 下载：

```typescript
exportReport: async (projectId: string) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE}/api/v1/export/${projectId}`, { headers });
  if (!response.ok) throw new Error(`导出失败 (${response.status})`);
  
  const text = await response.text();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${projectId}.txt`;  // 固定文件名格式
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**原因**: 导出接口返回的是文件流（非 JSON），不能走 `apiFetch` 的 JSON 解析逻辑。使用 blob + 临时 `<a>` 标签触发浏览器下载。

---

## 六、违规配置系统 — violation-config.ts 完整解析

### 6.1 12 类违规类型编号体系

本系统的核心知识来源于论文《基于NLP的隐私政策合规审查方法研究》，定义了 **12 类违规指示符**：

| ID | 名称 | 维度 | 权重 | 核心检测内容 |
|----|------|------|------|-------------|
| I1 | 过度收集敏感数据 | 数据收集 | 0.15 | 收集生物识别/金融/医疗/未成年人等敏感信息 |
| I2 | 未说明收集目的 | 数据收集 | 0.12 | 目的模糊（"提升体验""业务需要"等笼统表述） |
| I3 | 未获得明示同意 | 数据收集 | 0.15 | 默认勾选/捆绑授权/未显著方式获取同意 |
| I4 | 收集范围超出服务需求 | 数据收集 | 0.10 | 收集与核心功能无关的非敏感信息 |
| I5 | 未明确第三方共享范围 | 数据共享 | 0.08 | 未披露共享的具体类型/数量/场景 |
| I6 | 未获得单独共享授权 | 数据共享 | 0.12 | 以整体政策代替单独同意 |
| I7 | 未明确共享数据用途 | 数据共享 | 0.08 | 第三方用途模糊/扩大 |
| I8 | 未明确留存期限 | 数据留存 | 0.05 | 无具体留存时长 |
| I9 | 未说明数据销毁机制 | 数据留存 | 0.05 | 未说明销毁方式/流程/责任主体 |
| I10 | 未明确用户权利范围 | 用户权利保障 | 0.05 | 未完整告知法定权利 |
| I11 | 未提供便捷权利行使途径 | 用户权利保障 | 0.03 | 无在线申请/客服渠道 |
| I12 | 未明确权利响应时限 | 用户权利保障 | 0.02 | 无具体时间承诺 |

**权重之和 = 1.00**（归一化）

**四大维度分布**:
- 数据收集 (I1-I4): 权重合计 **0.52** (52%)
- 数据共享 (I5-I7): 权重合计 **0.28** (28%)
- 数据留存 (I8-I9): 权重合计 **0.10** (10%)
- 用户权利保障 (I10-I12): 权重合计 **0.10** (10%)

### 6.2 权重配置与风险等级阈值

#### 句子级风险判定（基于单条违规权重）

```typescript
export const WEIGHT_THRESHOLDS = {
  HIGH: 0.12,        // weight >= 0.12 → 高风险
  MEDIUM_LOW: 0.08,  // 0.08 <= weight < 0.12 → 中等风险
                   // weight < 0.08 → 低风险
} as const;
```

**各违规类型的句子级风险**:
| 高风险 (>=0.12) | 中等风险 (0.08-0.12) | 低风险 (<0.08) |
|-----------------|---------------------|---------------|
| I1 (0.15) | I2 (0.12) | I5 (0.08) |
| I3 (0.15) | I6 (0.12) | I7 (0.08) |
| | | I8 (0.05) |
| | | I9 (0.05) |
| | | I10 (0.05) |
| | | I11 (0.03) |
| | | I12 (0.02) |

#### 审查级风险判定（基于总分）

```typescript
export const SCORE_THRESHOLDS = {
  LOW_RISK: 70,    // score >= 70 → 低风险
  HIGH_RISK: 40,   // score < 40 → 高风险
                 // 40 <= score < 70 → 中等风险
} as const;
```

**得分计算公式** (推断):
```
S = 100 - Σ(每条违规的 weight × 100)
```
例如: 发现 1 条 I1 (0.15) + 1 条 I3 (0.15) → S = 100 - 30 = **70 分** (低风险边界)

### 6.3 四大维度分组

```typescript
export const DIMENSION_GROUPS = {
  data_collection:  { label: '数据收集', ids: ['I1', 'I2', 'I3', 'I4'] },
  data_sharing:     { label: '数据共享', ids: ['I5', 'I6', 'I7'] },
  data_retention:   { label: '数据留存', ids: ['I8', 'I9'] },
  user_rights:      { label: '用户权利保障', ids: ['I10', 'I11', 'I12'] },
} as const;

export type DimensionKey = keyof typeof DIMENSION_GROUPS;
// = 'data_collection' | 'data_sharing' | 'data_retention' | 'user_rights'
```

### 6.4 违规详情信息库

`VIOLATION_DETAILS` 数组包含每类违规的完整信息，用于详情页展示：

```typescript
interface ViolationDetailInfo {
  id: string;           // "I1"
  name: string;         // "过度收集敏感数据"
  dimension: DimensionKey; // "data_collection"
  description: string;   // 核心检测内容（一段话）
  legalBasis: string;    // 违规判定依据（法律条文引用）
  example: string;       // 违规示例（具体的反面案例）
  suggestion: string;    // 整改建议（如何修改才合规）
  weight: number;        // 权重值
}
```

**示例 (I1)**:
```typescript
{
  id: 'I1',
  name: '过度收集敏感数据',
  dimension: 'data_collection',
  description: '是否收集与服务无关的生物识别数据、金融账户、医疗健康、未成年人等敏感个人信息',
  legalBasis: '《个人信息保护法》第六条"最小必要"原则',
  example: '"我们可能会收集您的位置信息、通讯录、健康数据等以提供更好的服务" — 未区分敏感与非敏感信息，超范围收集',
  suggestion: '明确区分敏感个人信息与一般个人信息，仅收集实现功能所必需的最小范围敏感信息，并取得单独同意',
  weight: 0.15,
}
```

### 6.5 辅助函数集

| 函数 | 签名 | 返回值 | 说明 |
|------|------|--------|------|
| `getRiskLevel(weight)` | `(weight: number) => RiskLevelType` | `'高风险'\|'中等风险'\|'低风险'` | 基于权重获取句子级风险 |
| `getRiskStatus(score)` | `(score: number) => string` | 同上 | 基于总分获取审查级风险 |
| `getRiskColorClass(level)` | `(level) => string` | Tailwind class 字符串 | 风险等级对应的颜色样式 |
| `getRiskDotClass(level)` | `(level) => string` | Tailwind class 字符串 | 风险等级对应的圆点颜色 |
| `getViolationName(id)` | `(id: string\|number) => string` | 中文名称 | 支持 "I1" 和 1 两种格式 |
| `getViolationWeight(id)` | `(id: string\|number) => number` | 权重值 (0-1) | 支持 "I1" 和 1 两种格式 |
| `getViolationDetailById(id)` | `(id: string\|number) => ViolationDetailInfo \| undefined` | 完整详情 | 用于详情展示 |

---

## 七、B端产品组件深度解析

### 7.1 Sidebar 侧边栏

**文件**: `src/components/Sidebar.tsx` (88行)

**Props**:
```typescript
interface SidebarProps {
  currentView: ViewType;       // 当前激活的视图
  onViewChange: (view: ViewType) => void;  // 视图切换回调
  onLogout: () => void;         // 登出回调
  currentUser?: User | null;    // 当前用户信息
}
```

**导航项配置**:
```typescript
const navItems = [
  { id: 'overview', label: '总览仪表盘', icon: LayoutDashboard },
  { id: 'new-task', label: '新建审查任务', icon: PlusSquare },
  { id: 'details', label: '违规条款明细', icon: Gavel },
  { id: 'history', label: '历史审查报告', icon: History },
];
```

**UI 特性**:
- 固定宽度 `w-64` (256px)，高度 `h-screen`
- 使用 `glass-panel` 样式（毛玻璃效果）
- 左侧有 `layoutId="active-nav-indicator"` 的 Motion 动画指示器（切换时有滑动过渡效果）
- 底部显示用户头像（首字母）、名称、"合规审计师"角色标签
- 最底部是退出登录按钮

**用户名显示优先级**: `username` > `name` > `email@` 前缀

### 7.2 Header 顶部栏

**文件**: `src/components/Header.tsx` (57行)

**Props**:
```typescript
interface HeaderProps {
  title: string;                    // 当前页面标题（动态变化）
  searchQuery: string;              // 搜索关键词
  onSearchChange: (query) => void;  // 搜索变更回调
  onShowToast?: (msg, type?) => void; // Toast 回调（通知/帮助按钮用）
}
```

**UI 布局**:
```
┌──────────────────────────────────────────────────────┐
│ [页面标题 (动态)]              [🔍 搜索框] [🔔] [❓] │
└──────────────────────────────────────────────────────┘
```

- `sticky top-0 z-50` 固定在顶部
- 标题使用 `motion.span` + `key={title}` 实现切换时的淡入滑动动画
- 搜索框宽度 `w-64`，带搜索图标
- 通知铃铛和帮助按钮目前只是 toast 占位（"暂无新通知"/"帮助文档正在建设中"）

### 7.3 Overview 总览仪表盘

**文件**: `src/components/Overview.tsx` (365行)

**Props**:
```typescript
interface OverviewProps {
  currentProject: Project | null;   // 当前项目（含 clauses）
  projects: Project[];              // 所有项目列表
  onViewChange: (view) => void;     // 视图切换回调
  onRiskFilter?: (level) => void;   // 风险筛选回调（跳转到 Details）
  isLoading?: boolean;              // 加载状态
}
```

**三种渲染状态**:

1. **Loading 状态** (`isLoading=true`): 显示旋转 spinner + "加载审查历史"
2. **空状态** (`!currentProject`): 显示空状态插图 + "暂无审查数据" + "开始第一次审查"按钮
3. **正常状态**: 显示完整仪表盘

**仪表盘布局** (正常状态):

```
┌──────────────────────────────────────────────────────────┐
│ 审计总览                                  [开始新审计]    │
├────────────────────────────────────┬─────────────────────┤
│                                  │                     │
│   ┌──────┐  项目名 [风险标签]     │  当前风险分布         │
│   │  73  │  Score                │  ● 高危违规  X 项     │
│   │ 圆环  │  风险描述文字         │  ● 一般隐患  X 项     │
│   └──────┘  [查看明细]           │  ● 合规建议  X 项     │
│              X 项待修复          │                     │
│                                  │  ═══ 进度条 ═══      │
├──────────┬──────────┬───────────┤  点击查看全部明细      │
│累计发现  │平均合规  │历史审查  │当前高危              │
│  X 项    │ XX.X 分  │ X 次     │  X 项 ↑               │
├──────────┴──────────┴───────────┴─────────────────────┤
│  合规得分趋势 (近10次)    │  频发违规类型 (当前)       │
│  ┌─────────────────────┐  │  ████████ I1  X项         │
│  │   📈 LineChart      │  │  ████ I3  X项            │
│  │   (Recharts)        │  │  ██ I2  X项              │
│  └─────────────────────┘  └──────────────────────────┘
└──────────────────────────────────────────────────────────┘
```

**关键计算逻辑**:

1. **风险等级统计** (遍历 `currentProject.clauses`):
```typescript
let highCount = 0, mediumCount = 0, lowCount = 0;
(currentProject.clauses || []).forEach(c => {
  if (c.violations?.length) {
    // 聚合模式：遍历 violations 数组逐个统计
    for (const v of c.violations) {
      if (v.riskLevel === '高风险') highCount++;
      else if (v.riskLevel === '中等风险') mediumCount++;
      else lowCount++;
    }
  } else {
    // 兼容旧格式：直接读 clause.riskLevel
    const rl = c.riskLevel || '';
    if (rl === '高风险') highCount++;
      else if (rl === '中等风险') mediumCount++;
      else lowCount++;
  }
});
```

2. **累计发现问题** (修复后的版本):
```typescript
// ⚠️ 不能用 projects.reduce(p => p.clauses.length)
// 因为 projects 列表中 clauses 全是 []
const totalClauses = currentProject?.clauses?.length || 0;
```

3. **平均合规得分**:
```typescript
const avgScore = projects.length > 0
  ? (projects.reduce((acc, p) => acc + p.score, 0) / projects.length).toFixed(1)
  : '0.0';
```

4. **频发违规类型 Top 4**:
```typescript
const categoryCounts = (currentProject.clauses || []).reduce((acc, clause) => {
  // 从 violations 数组中提取 name/id 作为 key 计数
  // 兼容无 violations 时用 categoryName
}, {});
const topCategories = Object.entries(categoryCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 4);  // 取前 4
```

5. **趋势图数据**:
```typescript
const trendData = [...projects].reverse().slice(-10).map((p, i) => ({
  name: `Task ${i + 1}`,
  score: p.score,
  date: p.date
}));
```

**动画系统**:
- 使用 `containerVariants` + `itemVariants` 实现 staggered reveal（交错入场）
- 圆环进度条使用 `motion.circle` 的 `strokeDashoffset` 动画（1.5s easeOut）
- 风险分布进度条使用 `animate={{ width }}` + delay 实现依次填充
- 分类条形图同样使用 width 动画 + `idx * 0.1` delay

**交互**:
- "开始新审计"按钮 → `onViewChange('new-task')`
- "查看明细"按钮 → `onViewChange('details')`
- 风险分布各项 → `onRiskFilter?(level)` （传递 'high'/'medium'/'low'/'all'）
- 进度条点击 → `onRiskFilter?('all')`

### 7.4 Details 违规条款明细

**文件**: `src/components/Details.tsx` (337行)

**Props**:
```typescript
interface DetailsProps {
  currentProject: Project | null;
  onOpenDrawer: (clause: Clause) => void;  // 打开 Drawer 查看条款
  onDownload: () => void;                 // 导出报告
  initialRiskFilter?: string | null;       // 从 Overview 传入的初始筛选
}
```

**内部状态**:
```typescript
const [currentPage, setCurrentPage] = useState(1);           // 当前页码
const [filterCategory, setFilterCategory] = useState<string | null>(null);  // 违规类别筛选
const [showFilterDropdown, setShowFilterDropdown] = useState(false);  // 筛选下拉菜单显隐
```

**常量**:
```typescript
const ITEMS_PER_PAGE = 8;  // 每页显示 8 条
```

**筛选类别来源** (从统一配置生成):
```typescript
const VIOLATION_CATEGORIES = VIOLATION_DETAILS.map(v => ({
  id: v.id,           // "I1" ~ "I12"
  name: v.name,       // 中文名称
  risk: getRiskLevel(v.weight) === RISK_LEVEL.HIGH ? 'high'
    : getRiskLevel(v.weight) === RISK_LEVEL.MEDIUM ? 'medium' : 'low',
  dimension: v.dimension,
}));
```

**筛选逻辑** (支持聚合模式):
```typescript
const filteredClauses = useMemo(() => {
  if (!filterCategory) return currentProject?.clauses || [];
  return (currentProject?.clauses || []).filter(clause => {
    if (clause.violations?.length) {
      // 聚合模式：检查 violations 数组中是否包含目标类别
      return clause.violations.some(v => v.id === filterCategory);
    }
    // 兼容旧格式
    return clause.category === filterCategory || 
           clause.categoryName?.includes(VIOLATION_DETAILS.find(c => c.id === filterCategory)?.name || '');
  });
}, [currentProject?.clauses, filterCategory]);
```

**初始筛选联动** (从 Overview 传入):
```typescript
useEffect(() => {
  if (!initialRiskFilter) return;
  if (initialRiskFilter === 'all') { setFilterCategory(null); return; }
  // 将 Overview 的 riskLevel ('高风险') 映射为 categoryId
  const riskKey = initialRiskFilter === RISK_LEVEL.HIGH ? 'high'
    : initialRiskFilter === RISK_LEVEL.MEDIUM ? 'medium' : 'low';
  const match = VIOLATION_CATEGORIES.find(c => c.risk === riskKey);
  setFilterCategory(match?.id ?? null);
}, [initialRiskFilter]);
```

**表格列定义**:

| 列名 | 宽度 | 内容 | 说明 |
|------|------|------|------|
| 条款 ID | w-24 | `clause.id` | V+5位数字 |
| 位置 | w-32 | `index + 1` | 序号（非实际位置） |
| 风险类别 | w-40 | `clause.violations[].name` | 多标签展示，带颜色 |
| 内容片段 | auto | `clause.snippet` | 截断显示，title 显示全文 |
| 等级 | w-24 | `clause.violations[].riskLevel` | 去重后显示 |
| 操作 | w-24 | "审查" 按钮 | 打开 Drawer |

**分页控件**:
- 显示范围: "第 X 到 Y 条，共 Z 条"
- 页码导航: `< 上一页 | current/total | 下一页 >`
- 切换筛选时自动重置到第 1 页

**点击外部关闭下拉菜单**:
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
      setShowFilterDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 7.5 NewTask 新建审查任务

**文件**: `src/components/NewTask.tsx` (157行)

**Props**:
```typescript
interface NewTaskProps {
  onStartAnalysis: (type: string, value: any) => void;
}
```

**UI 布局** (5列 Grid):
```
┌─────────────────────────────┬───────────────────────────┐
│                             │                           │
│   📁 文件上传区域            │  🌐 URL 地址输入            │
│   (lg:col-span-3)           │  ┌─────────────────────┐   │
│                             │  │ https://example.com  │   │
│   点击或拖拽文件至此处       │  └─────────────────────┘   │
│   支持 TXT/MD/JSON/CSV      │  [抓取并分析]              │
│   最大 20MB                 │                           │
│                             │  📄 文本直传              │
│                             │  ┌─────────────────────┐   │
│                             │  │ 粘贴隐私政策全文...  │   │
│                             │  └─────────────────────┘   │
│                             │  [开始审查]                │
└─────────────────────────────┴───────────────────────────┘
```

**文件验证逻辑**:
```typescript
function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `不支持的文件类型。支持的格式：${ALLOWED_EXTENSIONS.join(', ')}` };
  }
  if (file.size > MAX_FILE_SIZE) {  // 20MB
    return { valid: false, error: `文件大小超过限制（最大 20MB）` };
  }
  return { valid: true };
}
```

**文件上传实现**: 使用隐藏的 `<input type="file">` 覆盖在整个拖放区域上，`onChange` 直接触发 `onStartAnalysis('file', file)`。

**URL/文本输入**: 通过 `document.getElementById('input-url')` / `document.getElementById('input-text')` 获取值（非受控组件，简化实现）。

### 7.6 History 历史审查报告

**文件**: `src/components/History.tsx` (235行)

**Props**:
```typescript
interface HistoryProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}
```

**内部状态**:
```typescript
const [riskFilter, setRiskFilter] = useState<string>('all');    // 风险筛选
const [timeFilter, setTimeFilter] = useState<string>('all');     // 时间筛选
const [currentPage, setCurrentPage] = useState(1);               // 分页
const ITEMS_PER_PAGE = 6;  // 每页 6 条（比 Details 的 8 条少）
```

**时间筛选逻辑**:
```typescript
const isWithinTimeRange = (dateStr: string): boolean => {
  const projectDate = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - projectDate.getTime()) / (1000 * 60 * 60 * 24));
  switch (timeFilter) {
    case '7days': return diffDays <= 7;
    case '30days': return diffDays <= 30;
    case '90days': return diffDays <= 90;
    default: return true;
  }
};
```

**组合筛选**:
```typescript
const filteredProjects = projects.filter(p => {
  if (riskFilter !== 'all' && p.riskStatus !== riskFilter) return false;
  if (!isWithinTimeRange(p.date)) return false;
  return true;
});
```

**表格列定义**:

| 列名 | 内容 | 特殊样式 |
|------|------|---------|
| 日期 | `project.date` | `whitespace-nowrap`（防换行） |
| 项目名称 | `project.name` + `description` | 名称加粗，描述截断 |
| 健康度 | `project.score` 分 | serif 字体 |
| 风险状态 | 图标 + `project.riskStatus` | 绿/红/琥珀色 |
| 操作 | "查看 →" | hover 效果，整行可点击 |

**交互**: 点击整行 → `onSelectProject(project)` → 加载详情 + 跳转到 Details

### 7.7 Drawer 整改抽屉面板

**文件**: `src/components/Drawer.tsx` (536行) — **最复杂的组件**

**Props**:
```typescript
interface DrawerProps {
  clause: Clause | null;           // 当前查看的条款
  isOpen: boolean;                // 是否打开
  onClose: () => void;            // 关闭回调
  onAdopt: (updated: Clause) => void;  // 采纳回调
  onShowToast?: (msg, type?) => void;
}
```

**内部状态**:
```typescript
const [feedback, setFeedback] = useState<'up' | 'down' | null>;  // 用户反馈（点赞/踩）
const [editedText, setEditedText] = useState('');                 // 编辑后的文本
const [copied, setCopied] = useState(false);                     // 复制状态
const [isGenerating, setIsGenerating] = useState(false);          // AI 生成中
const [localDiffHtml, setLocalDiffHtml] = useState('');           // 本地 diff HTML
const [localLegalBasis, setLocalLegalBasis] = useState('');       // 本地法律依据
const [localLegalDetail, setLocalLegalDetail] = useState('');     // 本地法条详情
const [mode, setMode] = useState<RectifyMode>('rewrite');        // 当前模式: summary | rewrite
const [generatedCache, setGeneratedCache] = useState<Record<string, {
  text: string; legal: string; diff: string; detail?: string;
}>>({});  // 生成结果缓存（避免重复调用 API）
```

**模式切换缓存机制**:

缓存 key 格式: `${mode}_${clauseId}`

```typescript
useEffect(() => {
  if (!clause) return;
  const cacheKey = `${mode}_${clause.id || clause.originalText?.slice(0, 30)}`;
  const cached = generatedCache[cacheKey];
  
  if (cached) {
    // 有缓存 → 直接恢复
    setEditedText(cached.text);
    setLocalDiffHtml(cached.diff);
    setLocalLegalBasis(cached.legal);
    setLocalLegalDetail(cached.detail || '');
  } else {
    // 无缓存 → 检查是否有默认值（rewrite 模式下 clause 自带的 suggestedText）
    if (mode === 'rewrite' && clause.suggestedText && 
        clause.suggestedText !== '【系统建议】请根据合规要求修改。') {
      // 使用默认值
    } else {
      // 触发生成
      generateSuggestion(clause, mode);
    }
  }
  setFeedback(null);
  setCopied(false);
}, [clause, mode]);
```

**AI 生成函数** (`generateSuggestion`):
```typescript
const generateSuggestion = useCallback(async (currentClause, targetMode) => {
  const cacheKey = `${targetMode}_${currentClause.id || ...}`;
  if (generatedCache[cacheKey]) return;  // 防重复
  
  setIsGenerating(true);
  try {
    // 动态导入 api（解决循环依赖问题）
    const { api } = await import('../utils/api');
    const res = await api.rectify(
      currentClause.originalText,
      String(currentClause.category),
      currentClause.legalBasis,
      targetMode
    );
    
    // 生成 diff HTML
    const diffHtml = targetMode === 'rewrite'
      ? generateDiffHtml(currentClause.originalText, res.suggested_text)
      : `<span class="text-slate-700">${escapeHtml(res.suggested_text)}</span>`;
    
    // 更新状态
    setEditedText(res.suggested_text);
    setLocalDiffHtml(diffHtml);
    setLocalLegalBasis(res.legal_basis);
    setLocalLegalDetail(res.legal_detail || '');
    
    // 写入缓存
    setGeneratedCache(prev => ({ ...prev, [cacheKey]: { text, legal, detail, diff } }));
    
    // rewrite 模式同步到 clause 对象
    if (targetMode === 'rewrite') {
      currentClause.suggestedText = res.suggested_text;
      currentClause.legalBasis = res.legal_basis;
      currentClause.diffSuggestedHtml = diffHtml;
    }
  } catch (error) {
    onShowToast?.(error.message || '生成失败', 'error');
  } finally {
    setIsGenerating(false);
  }
}, [generatedCache, onShowToast]);
```

**Diff 生成** (使用 `diff` 库):
```typescript
const generateDiffHtml = (original: string, suggested: string): string => {
  const changes: Change[] = diffWords(original, suggested);
  return changes.map(change => {
    if (change.added) return `<span class="diff-add">${escapeHtml(change.value)}</span>`;
    if (change.removed) return `<span class="diff-remove">${escapeHtml(change.value)}</span>`;
    return escapeHtml(change.value);
  }).join('');
};
```

**重新生成**: 清除当前 cacheKey 的缓存 → 再次调用 `generateSuggestion`

**UI 布局** (右侧滑入, 宽度 900px):

```
┌──────────────────────────────────────────────────┐
│ [风险解读 | 合规重写] 切换              [✕ 关闭] │
├──────────────────────────────────────────────────┤
│                                                  │
│  风险类别                                         │
│  ┌──────────────────────────────────────┐        │
│  │ [I1] 过度收集敏感数据    [89.2%]     │        │
│  │ [I3] 未获得明示同意      [76.1%]     │        │
│  └──────────────────────────────────────┘        │
│  模式描述文字                                     │
│                                                  │
│  ✨ [改写对比 / 通俗解读]    [🔄 重生] [👍][👎]  │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │  == Rewrite 模式 ==                │        │
│  │  ┌─────────────┐ ┌─────────────┐   │        │
│  │  │ 原始条款     │ │ 改写建议     │   │        │
│  │  │ (红色边框)   │ │ (橙色边框)   │   │        │
│  │  │             │ │             │   │        │
│  │  └─────────────┘ └─────────────┘   │        │
│  │  [新增内容] [删除内容]  图例       │        │
│  └──────────────────────────────────────┘        │
│                                                  │
│  ✏️ 人工二次编辑              [📋 复制内容]     │
│  ┌──────────────────────────────────────┐        │
│  │  textarea (可编辑)                   │        │
│  │  XXX 字                              │        │
│  └──────────────────────────────────────┘        │
│                                                  │
│  📖 合规依据                                       │
│  ┌──────────────────────────────────────┐        │
│  │  pre (法律依据 + 法条正文)           │        │
│  └──────────────────────────────────────┘        │
├──────────────────────────────────────────────────┤
│              [取消]        [采纳并应用]            │
└──────────────────────────────────────────────────┘
```

**Summary 模式布局差异**:
- 无双栏对比，改为单栏: 原文引用块 → AI 解读内容
- 底部按钮变为 `[取消] [复制解读]`（无采纳功能）

### 7.8 Toast 轻提示

**文件**: `src/components/Toast.tsx` (29行)

极简组件，固定在底部居中，3秒自动消失。
- 成功: 绿色 CheckCircle 图标
- 错误: 红色 AlertCircle 图标
- 使用 AnimatePresence 实现进出动画

### 7.9 Login 登录页

**文件**: `src/components/Login.tsx` (177行)

**UI 特性**:
- 全屏居中卡片布局 (`max-w-[400px]`)
- 背景装饰: 两个大型模糊渐变圆形 (`blur-[100px]`)
- 返回首页按钮 (左上角)
- 表单字段: 企业账号 (email)、密码 (可切换显示/隐藏)
- **强制阅读隐私协议**: checkbox 勾选时弹出 PolicyModal，必须滚动到底部才能勾选
- Spring 动画入场 (`bounce: 0.3`)

**提交流转**:
1. 检查是否勾选协议 → 否则 toast "请先阅读并勾选隐私协议"
2. 检查邮箱密码非空
3. 调用 `api.login()`
4. 存储 token/user 到 localStorage
5. 触发 `onLogin(token, user)`
6. 底部链接切换到注册

### 7.10 Register 注册页

**文件**: `src/components/Register.tsx` (218行)

与 Login 几乎相同的布局和样式，额外字段:
- **用户名** (必填)
- **确认密码** (必须与密码一致)

**特殊行为**: 注册成功后**自动登录**（调用 `api.register()` → `api.login()`），实现无缝体验。

### 7.11 PolicyModal 政策弹窗

**文件**: `src/components/PolicyModal.tsx` (133行)

**核心功能**: **强制阅读隐私协议**

**工作机制**:
1. 用户点击 checkbox → 打开 Modal（而非直接勾选）
2. Modal 内显示完整的隐私政策文本（来自 `constants.ts` 的 `PRIVACY_POLICY_TEXT`）
3. 顶部显示**阅读进度条**（实时跟踪滚动百分比）
4. 必须滚动到底部（progress >= 99%）才能启用"我已阅读并同意"按钮
5. 底部显示 "请向下滚动阅读全文 (X%)"
6. 滚到底部后显示绿色 "✅ 已阅读完毕"

**技术细节**:
- 使用 `ref` + `onscroll` 事件追踪滚动位置
- 底部渐变遮罩（`bg-gradient-to-t from-white/90`），滚动到底部后 fadeOut
- `custom-scrollbar` 样式（细滚动条）
- Spring 动画进场/退场

---

## 八、营销站组件深度解析

### 8.1 Navbar 导航栏

**文件**: `src/components/Navbar.tsx` (70行)

**UI 特性**:
- **固定悬浮**: `fixed top-6 left-1/2 -translate-x-1/2`（水平居中，距顶 24px）
- **圆角药丸形状**: `rounded-full w-[90%] max-w-5xl`
- **Glass Morphism**: `glass-panel` 样式
- **滚动隐藏**: 使用 `useScroll` + `useMotionValueEvent`，向下滚动超过 150px 时隐藏，向上滚动时显示
- **导航链接**: 产品平台(/)、客户案例(# 即将上线)、价格方案(/pricing)、更新日志(# 即将上线)
- **CTA 按钮**: "立即体验" → `navigate('/login')`
- **内置 Toast**: "即将上线" 提示（3秒消失）

### 8.2 Landing 首页 Hero

**文件**: `src/pages/Landing.tsx` (793行) — **最大的单个文件**

**内联组件** (均在 Landing.tsx 内部定义):
- `MagneticButton` — 磁性跟随鼠标按钮（spring 物理动画）
- `ScrollUnfold` — 滚动展开（rotateX 从 -90° 到 0°）
- `ScrollSlide` — 滑入动画（左右方向）
- `ScrollFlip` — 3D 翻转动画（rotateY）
- `InteractiveFlipCard` — 交互式翻转卡片（正面/背面）
- `ScrollReveal` — 滚动显现（模糊→清晰）
- `DemoClauseCard` — 条款整改演示卡片（Summary/Rewrite 双模式切换）

**页面区块**:

1. **Hero 区域**:
   - Cinematic Noise Grain 噪点纹理覆盖层（SVG feTurbulence）
   - Liquid Background Blobs 液态背景球（3 个 animate-blob 元素）
   - ColorBends 波浪背景（随视差滚动）
   - "PrivacyGuard 1.0 is live" 徽章（脉冲动画）
   - 大标题: "智能高效的**隐私政策**\n**合规审查平台**"（字符逐行揭示动画）
   - 副标题 + 两个 CTA 按钮（MagneticButton）
   - 视差滚动: heroY (0→100), heroOpacity (1→0)

2. **Features 区域** (`#features`):
   
   **Feature 1: 12大违规检测维度**
   - 左侧: Tab 切换栏（4 个维度: 数据收集/共享/留存/权利）
     - `layoutId="activeTabBackground"` 动画背景跟随
     - 每个 tab 显示 icon + 名称 + 检测数量
   - 右侧: Tab 内容面板
     - 显示该维度下的所有违规项
     - 每项: 红色圆点 + 名称 + 描述 + 法律依据
   
   **Feature 2: RAG 法律精准溯源**
   - 左侧: 2 个 InteractiveFlipCard（法规覆盖 + RAG 智能检索）
   - 右侧: 标题 + ScrollFloat 浮动文字 + 描述 + 引用块
   
   **Feature 3: 双模式智能整改**
   - ScrollUnfold 容器
   - 左侧: 标题 + 描述 + 合规评分进度条 (68.5%)
   - 右侧: Stack 卡片堆叠组件，内含 3 张 DemoClauseCard
     - 支持鼠标拖拽甩掉
     - 每张卡可在 Summary/Rewrite 模式间切换

3. **Workflow 区域** (`#workflow`):
   - 3 步骤引导（SVG 连接线动画）
   - Step 01: 导入隐私政策（Folder 图标）
   - Step 02: 条款分类分析与法条匹配
   - Step 03: 双模式整改与导出报告
   - 底部 CTA 按钮

**Mock 数据** (`MOCK_CLAUSES`):
- 3 条演示条款: I1 (过度收集敏感数据), I3 (未获得明示同意), I8 (未明确留存期限)
- 每条包含: original, rewrite, summaryOutline, summaryDetail (Q&A 格式), colors

### 8.3 Pricing 定价页

**文件**: `src/pages/Pricing.tsx` (168行)

**4 档方案**:

| 方案 | 价格 | 定位 | 核心权益 |
|------|------|------|---------|
| **基础探索版** | 免费 | 个人体验 | 3次/天, 2000字, 前5条详情, 1次AI重写 |
| **专业合规版** (推荐) | ¥499/月 | 中小企业 | 50次/天, 20000字, PDF上传, 20次AI重写, 5人协作 |
| **企业 API 版** | ¥1,999/月 | 大厂/上市公司 | 无限制, 100000字, 定时扫描, FastAPI, 专属客服 |
| **政企信创版** | 定制 | 政府/央国企 | 私有化部署, 信创硬件适配, 国密加密, 红蓝对抗 |

**UI 特性**:
- 推荐方案: 顶部 "推荐方案" 徽章 + 上移阴影 + indigo 边框
- Hover 效果: 卡片上浮 (-8px)
- 入场动画: blur(12px) → clear + y(40px) → 0, staggered delay

### 8.4 Footer 页脚

**文件**: `src/components/Footer.tsx` (26行)

简洁的三段式布局:
- 左侧: Logo + "PrivacyGuard" + © 2026
- 右侧: 4 个链接（隐私政策/服务条款/安全保障/系统状态）— 均 `href="#"` 占位

### 8.5 营销动效组件族

这些组件为 Landing 页提供视觉效果，均来自自定义实现：

| 组件 | 文件 | 效果描述 |
|------|------|---------|
| ColorBends | `.tsx` + `.css` | 波浪色彩混合背景（WebGL/Canvas） |
| LineWaves | `.tsx` + `.css` | 线条波浪动画 |
| ScrollFloat | `.tsx` + `.css` | 文字逐字符浮动入场 |
| Folder | `.tsx` + `.css` | 文件夹图标动效 |
| Threads | `.tsx` + `.css` | 线条线程动效 |
| Stack | `.tsx` + `.css` | 卡片堆叠（支持拖拽排序） |

---

## 九、样式系统

### 9.1 Design Tokens (设计令牌)

定义在 `src/index.css` 的 `@theme` 块中：

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-serif: "Newsreader", "Georgia", ui-serif, serif;
  --font-geist: "Inter", sans-serif;
  
  --color-surface: #fdfcf8;       /* 主背景色（暖白） */
  --color-surface-alt: #f5f4ef;   /* 替代背景 */
  --color-ink: #2d2d2d;           /* 主文字色（深灰近黑） */
  --color-ink-muted: #737373;     /* 次要文字色 */
  --color-accent: #d97757;        /* 强调色（赤陶橙） */
}
```

**字体加载** (Google Fonts CN 域):
```css
@import url('https://fonts.googleapis.cn/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap');
```

### 9.2 Glass Morphism 体系

三层玻璃效果，定义在 `@layer utilities`:

```css
.glass-panel {   /* 面板级: 最强模糊 */
  @apply bg-white/40 backdrop-blur-xl border border-white/50 
         shadow-[0_8px_32px_0_rgba(31,38,135,0.07)];
}
.glass-card {    /* 卡片级: 中等模糊 */
  @apply bg-white/60 backdrop-blur-md border border-white/60 shadow-lg;
}
.glass-input {   /* 输入框级: 轻微模糊 */
  @apply bg-white/50 backdrop-blur-sm border border-white/60 focus:bg-white/80;
}
.glass-panel-dark { /* 营销站深色玻璃 */
  @apply bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 
         shadow-[0_8px_32px_rgba(0,0,0,0.2)];
}
```

**使用场景**:
- `glass-panel`: Sidebar, Header, Navbar, Modal 容器
- `glass-card`: Overview 统计卡片, Details 表格容器, 表单项
- `glass-input`: 所有输入框 (Login, Register, Header 搜索)

### 9.3 Diff 对比样式

```css
.diff-remove {  /* 删除的内容 */
  @apply bg-red-100 text-red-900 px-1 rounded-sm border border-red-200 
         line-through decoration-red-500/50;
}
.diff-add {    /* 新增的内容 */
  @apply bg-green-100 text-green-900 px-1 rounded-sm border border-green-200;
}
```

### 9.4 自定义滚动条

用于 PolicyModal 的长文本滚动：

```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background-color: rgba(156,163,175,0.3); border-radius: 20px; 
}
```

### 9.5 营销站动画

```css
@keyframes blob {
  0% { transform: translate(0,0) scale(1); }
  33% { transform: translate(30px,-50px) scale(1.1); }
  66% { transform: translate(-20px,20px) scale(0.9); }
  100% { transform: translate(0,0) scale(1); }
}
.animate-blob { animation: blob 10s infinite alternate cubic-bezier(0.4,0,0.2,1); }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
```

---

## 十、构建与部署

### 10.1 Vite 配置

**文件**: `vite.config.ts`

```typescript
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined  // 不做代码拆分，产出单 bundle
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),  // @ → 项目根目录
      },
    },
    server: {
      port: 5000,
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: env.VITE_API_URL
        ? undefined  // 设置了外部 API 则不代理
        : { '/api': { target: 'http://localhost:7860', changeOrigin: true } },
    },
  };
});
```

**关键配置**:
- 开发服务器端口: **5000**（必须使用此端口）
- HMR: 默认开启，可通过 `DISABLE_HMR=true` 关闭
- API 代理: 未设置 `VITE_API_URL` 时，`/api/*` 代理到 `localhost:7860`（后端开发地址）
- 别名: `@` → 项目根目录（虽然代码中未大量使用）

### 10.2 构建流程

**npm scripts**:
```json
{
  "dev": "vite --port 5000 --host",
  "build": "vite build && cp public/_headers dist/_headers && cp _routes.json dist/_routes.json",
  "build:static": "vite build && cp public/_headers dist/_headers && cp _routes.json dist/_routes.json",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
}
```

**构建产物**:
```
dist/
├── index.html              (425 bytes, gzip: 320B)
├── _headers                (Cloudflare Headers 规则)
├── _routes.json            (Cloudflare 路由规则)
└── assets/
    ├── index-*.js          (~1.57 MB, gzip: 468 KB) ← 单 bundle
    └── index-*.css         (~80 KB, gzip: 13 KB)
```

**构建后处理**:
1. `vite build` → 生成 dist/
2. `cp public/_headers dist/_headers` → 复制 Cloudflare Headers 规则
3. `cp _routes.json dist/_routes.json` → 复制 Cloudflare 路由规则

### 10.3 Cloudflare Pages 部署

**路由规则** (`_routes.json`):
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]  /* 静态资源不重定向 */
}
```
含义: 所有路径都返回 `index.html`（SPA 模式），除了 `/assets/*` 下的静态资源。

**Headers 规则** (`public/_headers``):
```
/*  → X-Content-Type-Options: nosniff
/*.js → Content-Type: application/javascript
/*.mjs → Content-Type: application/javascript
/assets/*.js → Content-Type: application/javascript
```
目的: 确保 JS 文件的 MIME 类型正确，避免 `Unexpected token '<'` 问题。

**部署触发**: git push 到 main 分支 → Cloudflare Pages 自动构建

### 10.4 环境变量

| 变量名 | 用途 | 默认值 | 说明 |
|--------|------|--------|------|
| `VITE_API_URL` | 后端 API 基地址 | `''` (同源) | 设此后不启用代理，直接请求该地址 |
| `DISABLE_HMR` | 禁用热更新 | 未设置 | 设为 `true` 关闭 HMR |
| `DEPLOY_RUN_PORT` | 服务端口 | `5000` | 系统环境变量，不可更改 |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 对外域名 | 系统注入 | 用于构造回调 URL |

---

## 十一、接口协议完整清单

### 11.1 认证模块

| 方法 | 路径 | 认证 | Content-Type | 请求体 | 响应 |
|------|------|------|-------------|--------|------|
| POST | `/api/v1/auth/login` | 否 | JSON | `{email, password}` | `{token, user:{id,email,name?}}` |
| POST | `/api/v1/auth/register` | 否 | JSON | `{email, password, name}` | `void`(204) |

### 11.2 分析模块

| 方法 | 路径 | 认证 | 超时 | 请求体 | 响应 |
|------|------|------|------|--------|------|
| POST | `/api/v1/analyze` | **是** | 180s | `{text, source_type}` | `{id,name,score,risk_level,violations[]}` |
| POST | `/api/v1/rectify` | **是** | 180s | `{original_snippet,violation_type,legal_basis?,mode?}` | `{suggested_text,legal_basis,legal_detail,mode}` |

### 11.3 文件/URL 模块

| 方法 | 路径 | 认证 | Content-Type | 请求体 | 响应 |
|------|------|------|-------------|--------|------|
| POST | `/api/v1/upload` | **是** | FormData | `FormData{file}` | `{text}` |
| POST | `/api/v1/fetch-url` | **是** | JSON | `{url}` | `{text}` |

### 11.4 项目管理模块

| 方法 | 路径 | 认证 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/projects` | **是** | — | `[{id,name,score,risk_level,created_at}]` |
| GET | `/api/v1/projects/{id}` | **是** | — | `{id,name,score,risk_level,violations[]}` |
| PUT | `/api/v1/projects/{id}` | **是** | JSON | `{violations:[{indicator,violation_id,snippet,...}]}` | `{message,id}` |

### 11.5 导出模块

| 方法 | 路径 | 认证 | 响应类型 | 说明 |
|------|------|------|---------|------|
| GET | `/api/v1/export/{id}` | **是** | `text/plain` | 文件流（blob 下载） |

---

## 十二、完整工作流时序图

### 12.1 用户登录流程

```
用户              Login组件           api.ts              后端              localStorage
 │                 │                   │                   │                 │
 │  输入email/密码  │                   │                   │                 │
 │  勾选协议→弹窗   │                   │                   │                 │
 │  滚动到底部→同意  │                   │                   │                 │
 │  点击登录 ──────►│                   │                   │                 │
 │                 │ validate()         │                   │                 │
 │                 │ api.login() ────────►│                   │                 │
 │                 │                   │ POST /auth/login  ──►│                 │
 │                 │                   │ ◄── {token,user} ───│                 │
 │                 │ ◄── data ──────────│                   │                 │
 │                 │ setItem('token')  │                   │   ──────────────►│
 │                 │ setItem('user')   │                   │   ──────────────►│
 │                 │ onLogin() ────────┼───► App.handleLogin │                 │
 │                 │                   │                   │                 │
 │                 │                   │                   │         navigate('/')
 │                 │                   │                   │   setIsLoggedIn(true)
 │                 │                   │                   │   loadProjects()
```

### 12.2 新建审查任务流程

```
用户              NewTask            App.tsx              api.ts              后端
 │                 │                   │                   │              │
 │  [选择输入方式]  │                   │                   │              │
 │                 │                   │                   │              │
 │  ── A: 文件上传 ─┤                   │                   │              │
 │  │  onSelect    │ onStartAnalysis   │                   │              │
 │  │  ('file',file)│ ('file', file) ──►│                   │              │
 │  │              │                   │ uploadFile() ──────►│              │
 │  │              │                   │ ◄── {text} ────────│              │
 │  │              │                   │                   │              │
 │  ── B: URL输入 ─┤                   │                   │              │
 │  │  onClick     │ onStartAnalysis   │                   │              │
 │  │  ('url',url) │ ('url', url) ────►│                   │              │
 │  │              │                   │ fetchUrl() ────────►│              │
 │  │              │                   │ ◄── {text} ────────│              │
 │  │              │                   │                   │              │
 │  ── C: 文本粘贴 ─┤                   │                   │              │
 │  │  onClick     │ onStartAnalysis   │                   │              │
 │  │  ('text',text)│ ('text', text) ──►│                   │              │
 │  │              │                   │ (无需预处理)        │              │
 │  │              │                   │                   │              │
 │  │              │                   │ analyze(text) ──────►│              │
 │  │              │                   │ ◄── {result} ──────│              │
 │  │              │                   │                   │              │
 │  │              │ ◄── 新Project ────│                   │              │
 │  │              │ setProjects([new])│                   │              │
 │  │              │ setCurrentView('details')                  │              │
 │  │              │ showToast('完成')                       │              │
```

### 12.3 条款审查与整改流程

```
用户              Details            Drawer              api.ts              后端(LLM)
 │                 │                  │                   │                │
 │  在列表点击"审查"│                  │                   │                │
 │  ──────────────►│ onOpenDrawer(c)  │                   │                │
 │                 │ ────────────────►│ isOpen=true       │                │
 │                 │                  │                   │                │
 │  [查看整改面板]  │                  │                   │                │
 │                 │                  │ useEffect →        │                │
 │                 │                  │ generateSuggestion()│                │
 │                 │                  │ rectify() ─────────►│                │
 │                 │                  │ ◄── {suggested,     │                │
 │                 │                  │     legal_basis,   │                │
 │                 │                  │     legal_detail}  │                │
 │                 │                  │ generateDiffHtml()  │                │
 │                 │                  │ setEditedText()    │                │
 │                 │                  │                   │                │
 │  [编辑建议文本]  │                  │ onChange           │                │
 │  [点击采纳]     │                  │ handleAdoptClick()│                │
 │                 │                  │ onAdopt(updated) ──┼──► App          │
 │                 │                  │                   │ updateProject()─►│
 │                 │                  │                   │ ◄── {message}    │
 │                 │                  │ onClose()         │                │
 │                 │ ◄── isOpen=false  │                   │                │
 │                 │                  │ showToast('已采纳') │                │
```

### 12.4 历史报告查看流程

```
用户              History             App.tsx              api.ts
 │                 │                   │                   │
 │  切换到"历史"tab │                   │                   │
 │                 │                   │ (projects 已加载)  │
 │                 │ ◄── projects[]    │                   │
 │                 │                   │                   │
 │  [筛选/翻页]    │                   │                   │
 │  点击某一行 ────►│ onSelectProject(p)│                   │
 │                 │ ─────────────────►│ loadProjectDetails()│
 │                 │                   │ getProject(id) ────►│
 │                 │                   │ ◄── {violations}   │
 │                 │                   │ mapRawToClauses()  │
 │                 │                   │ setCurrentProject() │
 │                 │                   │ setCurrentView('details')
 │                 │                   │                   │
 │                 │ ◄── Details 渲染   │                   │
```

---

## 十三、已知问题与修复记录

| # | 问题 | 根因 | 修复方案 | 状态 |
|---|------|------|---------|------|
| 1 | 登录后仪表盘空白 | `currentProject` 为 null，clauses 未加载 | `getProjects()` 成功后立即 `getProject(id)` 加载首个项目详情 + `Overview key={id}` 强制 remount | ✅ 已修复 |
| 2 | 条款编号每次不同 | 使用 `Math.random()` 生成 ID | 改为 FNV-1a 哈希算法，基于 `snippet` 内容生成固定 5 位数字 | ✅ 已修复 |
| 3 | 历史日期换行 | 日期列未设置 nowrap | 添加 `whitespace-nowrap` | ✅ 已修复 |
| 4 | Cloudflare 构建失败 | `Overview.tsx` JSX 未闭合 div | 补全闭合标签 | ✅ 已修复 |
| 5 | JS 文件返回 HTML | Dev server 进程异常 / 构建产物问题 | 重新 `pnpm build` + push 触发 Cloudflare 重建 | ✅ 已修复 |
| 6 | 累计发现问题显示 0 | `totalClauses = projects.reduce(p => p.clauses.length)` 但列表中 clauses 全为 `[]` | 改为 `currentProject?.clauses?.length \|\| 0` | ✅ 已修复 |
| 7 | `clauseCount` 不准确 | 仅在 `handleStartAnalysis` 中设置，其他场景为 0 | 待优化：可在 `loadProjectDetails` 后同步更新 | ⚠️ 已知 |

---

## 十四、附录

### A. 完整文件清单及行数

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/main.tsx` | 13 | 应用入口 |
| `src/App.tsx` | 508 | 根组件（路由+状态+业务逻辑） |
| `src/types.ts` | 205 | 类型定义+映射工具 |
| `src/constants.ts` | 221 | 隐私政策范文 |
| `src/config/violation-config.ts` | 338 | 12类违规配置 |
| `src/utils/api.ts` | 210 | API 层封装 |
| `src/index.css` | 89 | 全局样式 |
| `src/components/Sidebar.tsx` | 88 | 侧边导航 |
| `src/components/Header.tsx` | 57 | 顶栏 |
| `src/components/Overview.tsx` | 365 | 仪表盘 |
| `src/components/Details.tsx` | 337 | 违规明细 |
| `src/components/NewTask.tsx` | 157 | 新建任务 |
| `src/components/History.tsx` | 235 | 历史报告 |
| `src/components/Drawer.tsx` | 536 | 整改抽屉 |
| `src/components/Toast.tsx` | 29 | 轻提示 |
| `src/components/Login.tsx` | 177 | 登录页 |
| `src/components/Register.tsx` | 218 | 注册页 |
| `src/components/PolicyModal.tsx` | 133 | 政策弹窗 |
| `src/components/Navbar.tsx` | 70 | 营销导航 |
| `src/components/Footer.tsx` | 26 | 页脚 |
| `src/pages/Landing.tsx` | 793 | 营销首页 |
| `src/pages/Pricing.tsx` | 168 | 定价页 |
| **总计** | **~4,826 行** | |

### B. 依赖关系图（ conceptual）

```
App.tsx
├── types.ts (类型 + mapRawToClauses)
├── utils/api.ts (所有 API 调用)
├── config/violation-config.ts (风险等级/颜色/名称)
├── constants.ts (隐私政策文本)
├── components/
│   ├── Overview.tsx → violation-config.ts, recharts
│   ├── Details.tsx → violation-config.ts (VIOLATION_DETAILS)
│   ├── Drawer.tsx → api.ts (dynamic import), diff (diffWords)
│   ├── Login.tsx → constants.ts (PRIVACY_POLICY_TEXT), PolicyModal.tsx
│   ├── Register.tsx → 同 Login
│   ├── NewTask.tsx → (无额外依赖)
│   ├── History.tsx → (无额外依赖)
│   ├── Sidebar.tsx → types.ts (ViewType, User)
│   ├── Header.tsx → (无额外依赖)
│   └── Toast.tsx → types.ts (ToastState)
└── pages/
    ├── Landing.tsx → ScrollFloat, Folder, Threads, ColorBends, Stack
    ├── Pricing.tsx → (无额外依赖)
    └── Dashboard.tsx → (当前未使用)
```

### C. Cloudflare 配置文件

**`_routes.json`**:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]
}
```

**`public/_headers`**:
```
/*  → X-Content-Type-Options: nosniff
/*.js → Content-Type: application/javascript
/*.mjs → Content-Type: application/javascript
/assets/*.js → Content-Type: application/javascript
```

### D. `.coze` 配置（预置，勿修改）

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

---

> **文档结束** — 本文档覆盖了项目全部 4826 行源码的功能性、架构性和接口细节。如需了解特定模块的更多实现细节，请参考对应的源码文件注释。
