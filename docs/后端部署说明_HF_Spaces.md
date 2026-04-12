# 后端部署说明 - HuggingFace Spaces

## ❗ 需要手动部署后端

### 修改文件
- `python_backend/app_fixed.py` → 替换 `python_backend/app.py`
- `python_backend/auth_fixed.py` → 替换 `python_backend/auth.py`

---

## 安全修复内容

### 1. JWT密钥环境变量化
**原问题**: `SECRET_KEY = "your-secret-key-change-in-production"` 硬编码
**修复**: 从环境变量 `JWT_SECRET` 读取，未设置时自动生成随机密钥

### 2. SSRF防护
**原问题**: URL抓取无验证，可能被用于访问内网资源
**修复**: 添加URL白名单验证，阻止内网IP访问

### 3. 文件上传安全
**原问题**: 无文件类型/大小验证
**修复**: 
- 只允许 `.txt`, `.md`, `.json`, `.csv` 文件
- 最大文件大小 20MB

### 4. XSS防护
**原问题**: 用户输入可能包含恶意脚本
**修复**: 
- 添加输入验证，拒绝包含 `<script`, `javascript:` 等的内容
- 添加安全响应头

### 5. CORS严格配置
**原问题**: CORS允许所有来源
**修复**: 只允许 `https://sy-s-web.pages.dev` 和本地开发地址

### 6. 密码强度验证
**原问题**: 无密码强度检查
**修复**: 密码至少8位

---

## 部署步骤

### 方式一：通过GitHub同步（推荐）

1. **复制修复后的文件到仓库**
   ```bash
   # 在本地仓库执行
   cp python_backend/app_fixed.py python_backend/app.py
   cp python_backend/auth_fixed.py python_backend/auth.py
   
   # 提交并推送
   git add python_backend/
   git commit -m "fix(P1): 安全修复 - JWT/SSRF/上传/输入验证"
   git push
   ```

2. **在HuggingFace Spaces设置环境变量**
   - 访问 https://huggingface.co/spaces/sybululu/sybululu-privacy-policy-checker
   - 进入 Settings → Repository secrets
   - 添加以下环境变量:
     ```
     JWT_SECRET=your-secure-random-string-here
     TOKEN_EXPIRE_HOURS=24
     DEBUG=false
     ```

3. **设置密钥生成方法**
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   ```

### 方式二：直接在HF Space编辑

1. 访问 https://huggingface.co/spaces/sybululu/sybululu-privacy-policy-checker
2. 进入 Files 标签
3. 编辑 `app.py` 和 `auth.py`
4. 更新文件内容后点击 Commit

---

## 必需的环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `JWT_SECRET` | JWT签名密钥（建议32位以上随机字符串） | **是** |
| `TOKEN_EXPIRE_HOURS` | Token有效期（小时） | 否，默认24 |
| `DEBUG` | 调试模式（生产环境设为false） | 否，默认false |

---

## 验证部署

部署完成后，访问以下端点验证：

```bash
# 健康检查
curl https://sybululu-privacy-policy-checker.hf.space/health

# 预期响应
{"status":"healthy","timestamp":"2026-04-12T..."}
```

---

## 如遇问题

### 1. 模型加载失败
确保Space的Hardware配置足够（建议T4或更大）：
- 进入 Settings → Hardware
- 选择合适的GPU配置

### 2. 环境变量不生效
HF Spaces需要重新Build才能加载新环境变量：
- 修改后点击 "Factory Reboot" 按钮

### 3. CORS错误
确保前端API地址与CORS白名单一致：
- 前端: `https://sy-s-web.pages.dev`
- 后端CORS白名单已配置

---

## 联系支持

如需帮助，请提供：
1. HF Space 错误日志
2. 具体的问题描述
3. 复现步骤
