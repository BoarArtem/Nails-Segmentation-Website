"""Authentication endpoints: register, login, me."""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    """Create a new user account."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        logger.info("Registration rejected: email already registered (%s)", payload.email)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Guards against a race condition between the existence check and insert.
        db.rollback()
        logger.warning("Registration race condition on unique email: %s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from None

    db.refresh(user)
    logger.info("New user registered: id=%s email=%s", user.id, user.email)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Authenticate a user and issue a JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    password_ok = verify_password(payload.password, user.hashed_password if user else None)

    if user is None or not password_ok:
        logger.info("Login failed for email=%s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id))
    logger.info("User logged in: id=%s", user.id)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user."""
    return current_user
