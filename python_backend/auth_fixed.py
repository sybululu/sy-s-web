import os
import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

from models import User, get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# ==========================================
# 安全配置 - 从环境变量读取
# ==========================================

def get_secret_key() -> str:
    """获取JWT密钥，优先从环境变量读取"""
    secret = os.getenv("JWT_SECRET")
    if secret:
        return secret
    # 生成随机密钥（仅用于开发环境）
    print("警告: 未设置JWT_SECRET环境变量，使用随机生成的密钥")
    print("重要: 每次重启服务密钥会改变，所有现有token将失效")
    return secrets.token_urlsafe(32)

SECRET_KEY = get_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

from pydantic import BaseModel, validator

class LoginRequest(BaseModel):
    email: str
    password: str
    
    @validator('email')
    def validate_email(cls, v):
        # 基本邮箱格式验证
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('无效的邮箱格式')
        return v.lower().strip()

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('无效的邮箱格式')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('名称长度至少2位')
        return v.strip()

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    token = create_access_token({"sub": str(user.id)})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }

@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="邮箱已注册")
    
    user = User(
        email=req.email,
        password_hash=get_password_hash(req.password),
        name=req.name
    )
    db.add(user)
    db.commit()
    
    return {"message": "注册成功", "user_id": user.id}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }

# ==========================================
# Token刷新端点（可选）
# ==========================================
class RefreshRequest(BaseModel):
    token: str

@router.post("/refresh")
async def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token已过期")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    new_token = create_access_token({"sub": str(user.id)})
    return {"token": new_token}
