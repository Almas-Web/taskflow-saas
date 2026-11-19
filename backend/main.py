import hashlib
import os
import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal, List, Optional

import jwt
from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Task, User

# Read secret key from env or fallback for local development
JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "change-this-secret-in-production-env"))
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

TaskStatus = Literal["todo", "in_progress", "review", "done"]
TaskPriority = Literal["Low", "Medium", "High"]


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    ).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, digest = stored_hash.split("$", 1)
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    ).hex()
    return secrets.compare_digest(check, digest)


def create_access_token(user: User, purpose: str = "access", expire_minutes: int = JWT_EXPIRE_HOURS * 60) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "purpose": purpose,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        purpose: Optional[str] = payload.get("purpose", "access")
        if not user_id or purpose != "access":
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=6, max_length=128)


class AuthResponse(BaseModel):
    id: str
    name: str
    email: str
    token: str
    token_type: str = "bearer"


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    tag: str = Field(default="Feature", max_length=50)
    priority: TaskPriority = "Medium"
    status: TaskStatus = "todo"


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    tag: str | None = Field(default=None, max_length=50)
    priority: TaskPriority | None = None
    status: TaskStatus | None = None


class TaskOut(BaseModel):
    id: str
    title: str
    tag: str
    priority: TaskPriority
    status: TaskStatus
    user_id: Optional[str] = None

    class Config:
        from_attributes = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="TaskFlow API", version="0.6.0", lifespan=lifespan)

# Allow multiple origins separated by comma from CORS_ORIGINS environment variable
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TaskFlow FastAPI + Neon PostgreSQL"}


@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = User(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user)
    return AuthResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        token=token,
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user)
    return AuthResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        token=token,
    )


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


@app.post("/api/auth/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    reset_token = create_access_token(user, purpose="password_reset", expire_minutes=15)
    return {
        "message": "Password reset token generated (valid for 15 minutes)",
        "reset_token": reset_token,
    }


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        decoded = jwt.decode(payload.token.strip(), JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: Optional[str] = decoded.get("sub")
        purpose: Optional[str] = decoded.get("purpose")
        if not user_id or purpose != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid password reset token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or malformed reset token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password."}


@app.get("/api/tasks", response_model=List[TaskOut])
def get_tasks(
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    return query.all()


@app.post("/api/tasks", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_id = f"TSK-{uuid.uuid4().hex[:6].upper()}"
    new_task = Task(
        id=new_id,
        title=payload.title.strip(),
        tag=payload.tag.strip() or "General",
        priority=payload.priority,
        status=payload.status,
        user_id=current_user.id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to modify another user's task")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if value is not None:
            setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete another user's task")

    db.delete(task)
    db.commit()
    return {"deleted": True, "id": task_id}