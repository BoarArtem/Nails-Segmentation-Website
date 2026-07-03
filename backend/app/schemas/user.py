"""Pydantic schemas for user registration, login, and responses."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Payload for POST /api/auth/register."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Payload for POST /api/auth/login."""

    email: EmailStr
    password: str = Field(max_length=128)


class UserRead(BaseModel):
    """Public representation of a user, returned by register/me endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class Token(BaseModel):
    """Response returned by POST /api/auth/login."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload."""

    sub: str | None = None
