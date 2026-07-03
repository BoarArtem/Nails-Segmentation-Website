"""Pydantic schemas for POST /api/nails/segment."""
from pydantic import BaseModel, Field


class NailDetection(BaseModel):
    """A single detected/segmented nail instance."""

    id: int = Field(description="Index of this detection within the image (0-based).")
    confidence: float = Field(description="Model confidence score for this detection, 0-1.")
    bbox: list[float] = Field(
        description="Bounding box in pixel coordinates [x1, y1, x2, y2] on the original image.",
        min_length=4,
        max_length=4,
    )
    polygon: list[list[float]] = Field(
        description="Segmentation mask contour as a list of [x, y] pixel points.",
    )


class SegmentationResponse(BaseModel):
    """Response body for POST /api/nails/segment."""

    nail_count: int = Field(description="Number of nails detected in the image.")
    detections: list[NailDetection]
    annotated_image: str = Field(
        description="Base64-encoded PNG data URL of the image with masks/boxes/labels drawn.",
    )
