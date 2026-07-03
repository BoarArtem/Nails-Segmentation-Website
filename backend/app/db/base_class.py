"""Declarative base for SQLAlchemy models.

Kept separate from `app.db.base` to avoid circular imports: models import
`Base` from this module, while `app.db.base` imports the models themselves
(for Alembic autogenerate discovery).
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
