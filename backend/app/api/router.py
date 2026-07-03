"""Aggregates all API v1 route modules."""
from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.segmentation import router as segmentation_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(segmentation_router)
