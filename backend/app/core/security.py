"""Password hashing and JWT encode/decode helpers."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# A precomputed hash with no matching password, used to keep login timing
# constant whether or not the requested email exists.
_DUMMY_HASH = pwd_context.hash("no-such-user-dummy-password")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Check a plaintext password against its bcrypt hash.

    Pass `None` for `hashed_password` when the user doesn't exist — this still
    runs a bcrypt comparison against a dummy hash so failed logins take the
    same time whether the email is registered or not.
    """
    if hashed_password is None:
        pwd_context.verify(plain_password, _DUMMY_HASH)
        return False
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token for the given subject (typically user id)."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT access token. Returns the payload, or None if invalid/expired."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        logger.info("JWT decode failed: %s", exc)
        return None
