# 修改方案 - 2026-04-12 安全与部署修复

## 项目信息
- **前端仓库**: sybululu/sy-s_web
- **前端部署**: Cloudflare Pages
- **后端部署**: HuggingFace Spaces (需手动)
- **审查时间**: 2026-04-12

---

## 阶段一: P0 阻断级问题修复

### Task 1: 修复前端空白 - Cloudflare Pages MIME类型问题

**问题**: 部署后页面空白，静态资源加载失败

**修复方案**:
- [ ] 创建 `public/_headers` 文件，配置正确的MIME类型
- [ ] 创建 `public/.well-known/security.txt` (可选)
- [ ] 修改 `vite.config.ts` 确保正确的构建输出

**执行**:
```bash
# 1. 创建 public/_headers
cat > public/_headers << 'EOF'
/assets/*
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: application/javascript

/*.css
  Content-Type: text/css

/*.woff2
  Content-Type: font/woff2

/*.png
  Content-Type: image/png

/*.svg
  Content-Type: image/svg+xml
EOF

# 2. 更新 vite.config.ts
cat > vite.config.ts << 'EOF'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
EOF
```

---

### Task 2: 后端404问题 - HuggingFace Spaces路由修复

**问题**: API路由404，需要手动部署到HF Space

**修复方案**:
- [ ] 修复后端路由配置
- [ ] 生成部署说明文档

**注意**: 后端修改需要用户手动部署到HF Space

**用户手动操作步骤**:
```
1. 克隆/更新后端代码
2. 在HF Space设置环境变量:
   - JWT_SECRET: 随机密钥
   - GEMINI_API_KEY: (可选)
3. 上传模型文件到Space
4. 重启Space
```

---

## 阶段二: P1 重大级安全问题修复

### Task 3: JWT密钥环境变量化

**问题**: `auth.py` 第12行硬编码密钥 `SECRET_KEY = "your-secret-key-change-in-production"`

**修复方案**:
- [ ] 修改 `auth.py` 从环境变量读取密钥
- [ ] 添加密钥生成逻辑（首次启动时自动生成）

**执行**:
```python
# auth.py 修改
import os
import secrets

# 从环境变量读取或生成随机密钥
SECRET_KEY = os.getenv("JWT_SECRET") or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))
```

---

### Task 4: CSRF防护

**问题**: API端点缺少CSRF防护

**修复方案**:
- [ ] 添加SameSite Cookie配置
- [ ] 添加Origin验证中间件

**执行**:
```python
# app.py 添加
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["sy-s-web.pages.dev", "localhost"]
)

# 修改CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sy-s-web.pages.dev"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

### Task 5: SSRF防护 - URL抓取验证

**问题**: `/api/v1/fetch-url` 端点缺少URL验证

**修复方案**:
- [ ] 添加URL白名单验证
- [ ] 阻止内网IP访问
- [ ] 限制可抓取的域名

**执行**:
```python
# URL验证函数
from urllib.parse import urlparse
import socket

ALLOWED_URL_PATTERNS = [
    r'^https?://[\w\-\.]+\.(com|cn|org|net|io|co|me|cc|gov|edu)',
    r'^https?://[\w\-\.]+[\w\-]*\.[a-z]{2,}$',
]

BLOCKED_IP_RANGES = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '0.0.0.0/8',
]

def validate_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ['http', 'https']:
            return False
        if parsed.netloc:
            hostname = parsed.netloc.split(':')[0]
            # 解析域名获取IP
            try:
                ip = socket.gethostbyname(hostname)
                # 检查是否为内网IP
                # 简化检查
                if ip.startswith(('10.', '172.', '192.', '127.', '0.')):
                    return False
            except:
                return False
        return True
    except:
        return False
```

---

### Task 6: 文件上传安全

**问题**: 文件上传缺少验证

**修复方案**:
- [ ] 添加文件类型白名单
- [ ] 添加文件大小限制
- [ ] 添加文件名清理

**执行**:
```python
ALLOWED_EXTENSIONS = {'.txt', '.md', '.json', '.csv'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

def validate_file(file: UploadFile) -> bool:
    # 检查扩展名
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件类型: {ext}")
    
    # 检查文件大小
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, f"文件大小超过限制: {size/1024/1024:.1f}MB")
    
    return True
```

---

### Task 7: Token存储安全 - 前端改进

**问题**: Token存储在localStorage不安全

**修复方案**:
- [ ] 使用httpOnly cookie存储token
- [ ] 添加Secure标志
- [ ] 添加CSRF token

**执行** (后端):
```python
# 添加 cookie 设置端点
@router.post("/set-token-cookie")
async def set_token_cookie(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    token = create_access_token({"sub": str(current_user.id)})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_HOURS * 3600
    )
    return {"message": "Cookie已设置"}
```

---

### Task 8: XSS防护

**问题**: 前端可能存在XSS风险

**修复方案**:
- [ ] 对用户输入进行HTML转义
- [ ] 使用React的默认转义

**说明**: React默认转义用户输入，但需要确保不使用 `dangerouslySetInnerHTML`

---

## 阶段三: P2 代码质量修复

### Task 9: 添加完整的错误处理

**修复方案**:
- [ ] 添加统一的错误响应格式
- [ ] 添加请求验证

**执行**:
```python
# 统一错误响应
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "服务器内部错误",
            "detail": str(exc) if os.getenv("DEBUG") else None
        }
    )
```

---

## 实施检查清单

### 前端修复 (自动部署到Cloudflare Pages)
- [ ] Task 1: public/_headers 创建
- [ ] Task 1: vite.config.ts 更新
- [ ] Git push 触发自动部署

### 后端修复 (需用户手动部署到HF Space)
- [ ] Task 2: 后端部署说明生成
- [ ] Task 3: JWT密钥环境变量化
- [ ] Task 4: CSRF防护
- [ ] Task 5: SSRF防护
- [ ] Task 6: 文件上传安全
- [ ] Task 7: Token存储安全
- [ ] Task 9: 错误处理

---

## 部署后验证

### 前端验证
1. 访问 https://sy-s-web.pages.dev/
2. 检查控制台无错误
3. 静态资源正确加载

### 后端验证
1. 访问 https://sybululu-privacy-policy-checker.hf.space/health
2. 检查返回 `{"status": "healthy"}`
3. 测试API端点响应

---

## 下一步行动

1. **立即**: 执行前端P0修复并推送
2. **立即**: 生成后端部署说明并通知用户
3. **后续**: 等待前端部署验证
4. **后续**: 用户手动部署后端后进行完整测试
