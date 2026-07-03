"""Reusable FastAPI dependencies (DB session, current user)."""
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

# tokenUrl points at the login endpoint; used for OpenAPI docs / Swagger auth button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the current authenticated user from a Bearer JWT.

    Raises 401 if the token is missing, malformed, expired, or refers to a
    user that no longer exists.
    """
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise credentials_exception

    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        logger.warning("JWT subject is not a valid user id: %r", user_id_raw)
        raise credentials_exception from None

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception

    return user
