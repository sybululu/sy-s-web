import os
import json
import re
import secrets
from datetime import datetime
from typing import List, Optional, Dict

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, MT5ForConditionalGeneration
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

from models import User, Project, get_db, init_db
from auth import router as auth_router, get_current_user

# ==========================================
# 环境变量配置
# ==========================================
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_EXTENSIONS = {'.txt', '.md', '.json', '.csv'}

# ==========================================
# 模型加载 (HuggingFace Transformers)
# ==========================================
print("正在加载模型...")

# 1. 加载 RoBERTa 风险分类模型
tokenizer_roberta = AutoTokenizer.from_pretrained("hfl/chinese-roberta-wwm-ext")
model_roberta = AutoModelForSequenceClassification.from_pretrained("./models/roberta-compliance", num_labels=12)
model_roberta.eval()

# 2. 加载 mT5 整改生成模型
tokenizer_mt5 = AutoTokenizer.from_pretrained("google/mt5-base")
model_mt5 = MT5ForConditionalGeneration.from_pretrained("./models/mt5-compliance")
model_mt5.eval()

# 3. 加载 Sentence-BERT 向量化模型
model_sbert = SentenceTransformer('shibing624/text2vec-base-chinese')

print("模型加载完成！")

app = FastAPI(title="隐私政策合规审查 API")

# ==========================================
# 安全中间件配置
# ==========================================

# CORS 配置 - 严格控制
ALLOWED_ORIGINS = [
    "https://sy-s-web.pages.dev",
    "http://localhost:3000",
    "http://localhost:5173",
]

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# 初始化数据库
init_db()

# 注册认证路由
app.include_router(auth_router)

# ==========================================
# 合规指标体系与权重定义
# ==========================================
INDICATORS = {
    "过度收集敏感数据": {"weight": 0.15, "legal_basis": "《个人信息保护法》第六条'最小必要'原则及第二十九条"},
    "未说明收集目的": {"weight": 0.12, "legal_basis": "《个人信息保护法》第十七条"},
    "未获得明示同意": {"weight": 0.15, "legal_basis": "《个人信息保护法》第十四条"},
    "收集范围超出服务需求": {"weight": 0.10, "legal_basis": "《个人信息保护法》第六条"},
    "未明确第三方共享范围": {"weight": 0.08, "legal_basis": "《个人信息保护法》第二十三条"},
    "未获得单独共享授权": {"weight": 0.12, "legal_basis": "《个人信息保护法》第二十三条"},
    "未明确共享数据用途": {"weight": 0.08, "legal_basis": "《个人信息保护法》第二十三条及GDPR第四十六条"},
    "未明确留存期限": {"weight": 0.05, "legal_basis": "《个人信息保护法》第十九条"},
    "未说明数据销毁机制": {"weight": 0.05, "legal_basis": "《个人信息保护法》第四十七条"},
    "未明确用户权利范围": {"weight": 0.05, "legal_basis": "《个人信息保护法》第四十四至四十八条"},
    "未提供便捷权利行使途径": {"weight": 0.03, "legal_basis": "《个人信息保护法》第五十条"},
    "未明确权利响应时限": {"weight": 0.02, "legal_basis": "《个人信息安全规范》GB/T 35273-2020"}
}

INDICATOR_KEYS = list(INDICATORS.keys())

# ==========================================
# Pydantic 数据模型定义 (Schema)
# ==========================================
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50000)
    source_type: Optional[str] = "text"
    
    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('文本不能为空')
        # 基本XSS防护：移除危险脚本模式
        dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onclick=']
        for pattern in dangerous_patterns:
            if pattern in v.lower():
                raise ValueError('输入包含非法字符')
        return v

class AnalyzeResponse(BaseModel):
    id: str
    name: str
    score: float
    risk_level: str
    violations: List[dict]

class RectifyRequest(BaseModel):
    original_snippet: str
    violation_type: str

class UrlRequest(BaseModel):
    url: str

# ==========================================
# 安全辅助函数
# ==========================================
def validate_url(url: str) -> bool:
    """SSRF防护：验证URL安全性"""
    from urllib.parse import urlparse
    
    try:
        parsed = urlparse(url)
        
        # 只允许http和https
        if parsed.scheme not in ['http', 'https']:
            return False
        
        # 检查是否为空host
        if not parsed.netloc:
            return False
        
        # 阻止常见的内网域名
        blocked_hosts = [
            'localhost', '127.0.0.1', '0.0.0.0',
            'internal', 'intranet', 'private'
        ]
        host_lower = parsed.netloc.lower().split(':')[0]
        if any(blocked in host_lower for blocked in blocked_hosts):
            return False
        
        return True
    except:
        return False

def validate_file_upload(file: UploadFile) -> None:
    """文件上传安全验证"""
    # 检查文件扩展名
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件类型: {ext}")
    
    # 检查文件大小
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, f"文件大小超过限制(最大20MB)")

def split_into_sentences(text: str) -> List[str]:
    sentences = re.split(r'[。；\n]+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 5]

def roberta_predict(sentence: str) -> Dict[str, float]:
    inputs = tokenizer_roberta(sentence, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model_roberta(**inputs)
        probs = torch.sigmoid(outputs.logits).squeeze().tolist()
    
    if not isinstance(probs, list):
        probs = [probs]
        
    return {INDICATOR_KEYS[i]: probs[i] for i in range(min(len(probs), len(INDICATOR_KEYS)))}

# ==========================================
# 全局异常处理
# ==========================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "服务器内部错误",
            "detail": str(exc) if DEBUG_MODE else None,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ==========================================
# API 端点
# ==========================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sentences = split_into_sentences(request.text)
    violation_flags = {key: 0 for key in INDICATOR_KEYS}
    violations_list = []

    for sentence in sentences:
        probs = roberta_predict(sentence)
        for indicator, prob in probs.items():
            if prob > 0.5:
                violation_flags[indicator] = 1
                if not any(v["indicator"] == indicator for v in violations_list):
                    violations_list.append({
                        "indicator": indicator,
                        "snippet": sentence,
                        "legal_basis": INDICATORS[indicator]["legal_basis"]
                    })

    penalty = sum(INDICATORS[ind]["weight"] * vi for ind, vi in violation_flags.items())
    total_score = round(max(0.0, 100.0 - (penalty * 100.0)), 1)

    if total_score >= 70:
        risk_level = "低风险"
    elif 40 <= total_score < 70:
        risk_level = "中等风险"
    else:
        risk_level = "高风险"

    project_id = f"p{int(datetime.utcnow().timestamp())}"
    project = Project(
        id=project_id,
        user_id=current_user.id,
        name=f"审查-{datetime.utcnow().strftime('%Y%m%d')}",
        source_type=request.source_type,
        score=total_score,
        risk_level=risk_level,
        result_json=json.dumps(violations_list),
        raw_text=request.text[:5000]
    )
    db.add(project)
    db.commit()
    
    return {
        "id": project.id,
        "name": project.name,
        "score": project.score,
        "risk_level": project.risk_level,
        "violations": violations_list
    }

@app.post("/api/v1/rectify")
async def rectify_snippet(
    request: RectifyRequest,
    current_user: User = Depends(get_current_user)
):
    retrieved_context = INDICATORS.get(request.violation_type, {}).get("legal_basis", "《个人信息保护法》")
    
    prompt = f"请根据以下合规规范，修改违规条款：\n规范：{retrieved_context}\n原条款：{request.original_snippet}\n修改后："
    inputs = tokenizer_mt5(prompt, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model_mt5.generate(**inputs, max_length=128)
    suggested_text = tokenizer_mt5.decode(outputs[0], skip_special_tokens=True)
    
    return {
        "suggested_text": suggested_text,
        "legal_basis": retrieved_context
    }

@app.post("/api/v1/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    validate_file_upload(file)
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    return {"text": text}

@app.post("/api/v1/fetch-url")
async def fetch_url(
    request: UrlRequest,
    current_user: User = Depends(get_current_user)
):
    # SSRF防护验证
    if not validate_url(request.url):
        raise HTTPException(status_code=400, detail="URL验证失败，仅支持http/https协议")
    
    import requests
    from bs4 import BeautifulSoup
    try:
        response = requests.get(request.url, timeout=10, headers={
            'User-Agent': 'Privacy Policy Checker Bot/1.0'
        })
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        text = soup.get_text(separator='\n', strip=True)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无法读取URL内容: {str(e)}")

@app.get("/api/v1/projects")
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "score": p.score,
            "risk_level": p.risk_level,
            "created_at": p.created_at.isoformat()
        }
        for p in projects
    ]

@app.get("/api/v1/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    return {
        "id": project.id,
        "name": project.name,
        "score": project.score,
        "risk_level": project.risk_level,
        "violations": json.loads(project.result_json) if project.result_json else [],
        "created_at": project.created_at.isoformat()
    }

@app.get("/api/v1/export/{project_id}")
async def export_report(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    violations = json.loads(project.result_json) if project.result_json else []
    
    report = f"""隐私政策合规审查报告
==================

项目名称：{project.name}
审查时间：{project.created_at.strftime('%Y-%m-%d %H:%M')}
合规得分：{project.score}
风险等级：{project.risk_level}

违规条款统计
-----------
共发现 {len(violations)} 项潜在风险

详细分析
-------
"""
    for i, v in enumerate(violations, 1):
        report += f"\n{i}. {v.get('indicator', '未知类别')}\n"
        report += f"   原文：{v.get('snippet', '未知')}\n"
        report += f"   依据：{v.get('legal_basis', '未知')}\n"
    
    return Response(
        content=report,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=report_{project_id}.txt"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
