# SY-S-WEB 项目规范

## 项目概述
- **名称**: 隐私政策合规审查系统 (sy-s-web)
- **描述**: 基于 12 类违规检测的隐私政策合规审查系统，包含 RAG 法律知识库检索、AI 模型分析与整改建议生成功能
- **技术栈**:
  - 前端: React 19 + TypeScript + Vite + Tailwind CSS
  - 后端: FastAPI + Python + SQLAlchemy + JWT
  - AI 模型: HuggingFace Transformers
  - 向量库: FAISS

## 目录结构
```
sy-s-web/                    # 前端项目
├── src/
│   ├── App.tsx             # 主应用组件
│   ├── components/         # UI 组件
│   ├── utils/             # 工具函数
│   └── types.ts           # TypeScript 类型定义
├── public/                # 静态资源
└── dist/                  # 构建输出

sy-s-web-backend/           # 后端项目
├── app.py                 # FastAPI 主应用
├── models.py              # 数据模型
├── auth.py                # 认证模块
└── src/
    ├── loader.py          # 知识库加载器
    ├── store.py           # 向量存储
    ├── config.py          # 配置
    ├── mapper.py          # 违规类型映射
    └── search/            # 检索模块
```

## 核心功能

### 1. 违规检测 (12 类)
权重和 = 1.00，评分公式: `S = 100 - Σ(wi × 100)`（每种违规类型只扣一次，不管出现多少次）

**风险等级划分：**
- **单个句子风险等级**：根据违规类型的权重划分
  - 高危 (high)：权重 ≥ 0.12（I1, I2, I3, I6）
  - 中度 (medium)：权重 0.08-0.11（I4, I5, I7）
  - 低危 (low)：权重 < 0.08（I8, I9, I10, I11, I12）
- **整个审查风险等级**：根据总合规评分划分
  - 低风险：总分 ≥ 70
  - 中等风险：40 ≤ 总分 < 70
  - 高风险：总分 < 40

| ID | 名称 | 权重 | 句子风险等级 |
|----|------|------|-------------|
| I1 | 过度收集敏感数据 | 0.15 | 高危 |
| I2 | 未说明收集目的 | 0.12 | 高危 |
| I3 | 未获得明示同意 | 0.15 | 高危 |
| I4 | 收集范围超出服务需求 | 0.10 | 中度 |
| I5 | 未明确第三方共享范围 | 0.08 | 中度 |
| I6 | 未获得单独共享授权 | 0.12 | 高危 |
| I7 | 未明确共享数据用途 | 0.08 | 中度 |
| I8 | 未明确留存期限 | 0.05 | 低危 |
| I9 | 未说明数据销毁机制 | 0.05 | 低危 |
| I10 | 未明确用户权利范围 | 0.05 | 低危 |
| I11 | 未提供便捷权利行使途径 | 0.03 | 低危 |
| I12 | 未明确权利响应时限 | 0.02 | 低危 |

### 2. RAG 法律知识库
- 法律依据来源: PIPL、DSL、CSL、GB/T 35273-2020
- 向量检索优先排序，映射条款作为补充

### 3. AI 模型
- **分类器**: sybululu/bert-moe (HuggingFace)
- **生成器**: google/mt5-small + rewrite_mT5_small.ckpt

## 构建与测试命令

### 前端
```bash
cd sy-s-web
pnpm install    # 安装依赖
pnpm dev        # 开发模式
pnpm build      # 构建生产版本
```

### 后端
```bash
cd sy-s-web-backend
pip install -r requirements.txt  # 安装依赖
python app.py                    # 启动服务 (端口 5000)
```

## API 接口

### 分析接口
- `POST /api/v1/analyze` - 分析隐私政策文本

### 整改建议接口
- `POST /api/v1/rectify` - 生成违规条款整改建议

## 环境变量

### 前端 (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 后端
```
HF_TOKEN=           # HuggingFace Token (可选)
PORT=5000           # 服务端口
```

## 开发规范

### Python
- 遵循 PEP 8 编码规范
- 使用类型注解

### TypeScript
- 使用 React 19 + TypeScript
- 组件使用 shadcn/ui 风格

## 已知问题与解决方案

1. **置信度计算**: 使用 `max(logits) - mean(logits)` 替代 softmax 概率
2. **RAG 检索**: 优先使用向量相似度排序，映射条款作为补充
3. **mT5 生成**: 使用 `summarization:` 格式简化 Prompt，减少幻觉

## 部署

- 前端: Cloudflare Pages
- 后端: HuggingFace Spaces
