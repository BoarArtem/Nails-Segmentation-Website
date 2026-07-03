"""Nail segmentation endpoints."""
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.ml.segmentation import ImageDecodeError, run_segmentation
from app.models.user import User
from app.schemas.segmentation import NailDetection, SegmentationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nails", tags=["nails"])


def _read_upload_within_limit(file: UploadFile) -> bytes:
    """Read `file` into memory, rejecting it with 413 if it exceeds the configured
    max upload size. Reads in chunks so we never buffer more than the limit."""
    max_size = settings.MAX_UPLOAD_SIZE_BYTES
    chunks: list[bytes] = []
    total_size = 0
    chunk_size = 1024 * 1024  # 1 MB

    while True:
        chunk = file.file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > max_size:
            logger.info("Rejected upload exceeding max size: filename=%s", file.filename)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the maximum allowed size of {max_size} bytes",
            )
        chunks.append(chunk)

    return b"".join(chunks)


@router.post("/segment", response_model=SegmentationResponse)
def segment_nails(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
) -> SegmentationResponse:
    """Run nail detection/segmentation on an uploaded image.

    Requires authentication. Returns bounding boxes, segmentation mask
    contours, and an annotated preview image for each detected nail.
    """
    if file.content_type is None or not file.content_type.startswith("image/"):
        logger.info(
            "Rejected non-image upload: user_id=%s content_type=%s",
            current_user.id,
            file.content_type,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image",
        )

    image_bytes = _read_upload_within_limit(file)

    try:
        result = run_segmentation(image_bytes)
    except ImageDecodeError:
        logger.info("Rejected undecodable image upload: user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a readable image",
        ) from None
    except Exception:
        logger.exception("Nail segmentation inference failed for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        ) from None

    logger.info(
        "Segmentation completed: user_id=%s nail_count=%s",
        current_user.id,
        result.nail_count,
    )

    return SegmentationResponse(
        nail_count=result.nail_count,
        detections=[
            NailDetection(
                id=detection.id,
                confidence=detection.confidence,
                bbox=detection.bbox,
                polygon=detection.polygon,
            )
            for detection in result.detections
        ],
        annotated_image=result.annotated_image_b64,
    )
