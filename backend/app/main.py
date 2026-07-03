"""FastAPI application entrypoint."""
import logging

from fastapi import FastAPI, HTTPException, status
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request

from app.api.router import api_router
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

if settings.SECRET_KEY == "change-me-to-a-long-random-secret":
    logger.warning(
        "SECRET_KEY is set to the insecure default — set a unique SECRET_KEY "
        "via environment variable or .env before deploying."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Log unexpected errors and return a generic 500 response."""
    logger.exception("Unhandled error while processing %s %s", request.method, request.url)
    return await http_exception_handler(
        request,
        HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"),
    )


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Liveness/readiness probe."""
    return {"status": "ok"}
