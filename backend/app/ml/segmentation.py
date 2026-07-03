"""YOLOv8 nail-segmentation inference.

Loads the trained model once as a module-level singleton (loading weights is
expensive and must not happen per-request), and exposes `run_segmentation`
which performs all ultralytics-specific work so route handlers stay thin.
"""
import base64
import io
import logging
from dataclasses import dataclass
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageDecodeError(ValueError):
    """Raised when the uploaded file cannot be decoded as an image."""


@dataclass
class NailDetectionResult:
    """A single detected/segmented nail instance."""

    id: int
    confidence: float
    bbox: list[float]
    polygon: list[list[float]]


@dataclass
class SegmentationResult:
    """Full result of running segmentation on one image."""

    nail_count: int
    detections: list[NailDetectionResult]
    annotated_image_b64: str


@lru_cache(maxsize=1)
def load_model() -> YOLO:
    """Load and cache the YOLOv8 segmentation model singleton."""
    model_path = settings.MODEL_PATH_RESOLVED
    logger.info("Loading YOLO segmentation model from %s", model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model weights not found at {model_path}")
    model = YOLO(str(model_path))
    logger.info("YOLO model loaded (task=%s, classes=%s)", model.task, model.names)
    return model


def _validate_and_decode_image(image_bytes: bytes) -> Image.Image:
    """Validate that `image_bytes` is a readable image and return it as a PIL Image.

    Raises ImageDecodeError if the bytes are not a valid/decodable image.
    """
    try:
        # verify() checks integrity but leaves the file object unusable afterwards,
        # so we re-open a fresh buffer to actually decode the pixel data.
        Image.open(io.BytesIO(image_bytes)).verify()
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageDecodeError("Uploaded file is not a readable image") from exc

    return image.convert("RGB")


def _encode_png_data_url(bgr_image: np.ndarray) -> str:
    """Encode a BGR numpy image (as returned by ultralytics `Results.plot()`) as a
    base64 PNG data URL.

    cv2.imencode expects BGR channel order, which is exactly what
    `Results.plot()` returns, so no channel swap is needed before encoding.
    """
    success, buffer = cv2.imencode(".png", bgr_image)
    if not success:
        raise RuntimeError("Failed to PNG-encode annotated image")
    b64 = base64.b64encode(buffer.tobytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def run_segmentation(image_bytes: bytes) -> SegmentationResult:
    """Run nail segmentation on raw image bytes.

    Raises ImageDecodeError if the bytes are not a readable image. Any other
    failure during inference propagates as-is for the caller to log/handle.
    """
    image = _validate_and_decode_image(image_bytes)
    image_array = np.array(image)

    model = load_model()
    results = model.predict(
        source=image_array,
        conf=settings.MODEL_CONFIDENCE_THRESHOLD,
        verbose=False,
    )
    result = results[0]

    detections: list[NailDetectionResult] = []
    if result.boxes is not None and len(result.boxes) > 0:
        confidences = result.boxes.conf.tolist()
        bboxes = result.boxes.xyxy.tolist()
        polygons_xy = result.masks.xy if result.masks is not None else [[] for _ in confidences]

        for idx, (confidence, bbox, polygon) in enumerate(zip(confidences, bboxes, polygons_xy)):
            detections.append(
                NailDetectionResult(
                    id=idx,
                    confidence=float(confidence),
                    bbox=[float(coordinate) for coordinate in bbox],
                    polygon=[[float(x), float(y)] for x, y in polygon],
                )
            )

    annotated_bgr = result.plot(boxes=False, labels=False)
    annotated_image_b64 = _encode_png_data_url(annotated_bgr)

    return SegmentationResult(
        nail_count=len(detections),
        detections=detections,
        annotated_image_b64=annotated_image_b64,
    )
