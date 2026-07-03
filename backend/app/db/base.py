"""Aggregates the declarative Base with all ORM models.

Import this module (rather than `app.db.base_class`) wherever you need
`Base.metadata` populated with every model - e.g. Alembic's `env.py`.
"""
from app.db.base_class import Base
from app.models.user import User  # noqa: F401
