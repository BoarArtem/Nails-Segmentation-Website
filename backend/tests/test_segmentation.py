"""Tests for POST /api/nails/segment."""
import io

from fastapi.testclient import TestClient
from PIL import Image

SEGMENT_URL = "/api/nails/segment"
REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"


def _synthetic_png_bytes() -> bytes:
    """A tiny, valid, plain-colored PNG for exercising the decode/inference path."""
    image = Image.new("RGB", (64, 64), color=(200, 150, 150))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _auth_headers(client: TestClient, email: str) -> dict[str, str]:
    client.post(REGISTER_URL, json={"email": email, "password": "supersecret"})
    login_response = client.post(LOGIN_URL, json={"email": email, "password": "supersecret"})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_segment_without_token_returns_401(client: TestClient) -> None:
    files = {"file": ("nail.png", _synthetic_png_bytes(), "image/png")}

    response = client.post(SEGMENT_URL, files=files)

    assert response.status_code == 401


def test_segment_non_image_upload_returns_400(client: TestClient) -> None:
    headers = _auth_headers(client, "frank@example.com")
    files = {"file": ("notes.txt", b"this is not an image", "text/plain")}

    response = client.post(SEGMENT_URL, files=files, headers=headers)

    assert response.status_code == 400


def test_segment_corrupt_image_bytes_returns_400(client: TestClient) -> None:
    headers = _auth_headers(client, "grace@example.com")
    # Content-type claims image/png but the bytes are garbage/unparseable.
    files = {"file": ("broken.png", b"not-actually-png-data", "image/png")}

    response = client.post(SEGMENT_URL, files=files, headers=headers)

    assert response.status_code == 400


def test_segment_valid_synthetic_image_returns_well_formed_response(client: TestClient) -> None:
    headers = _auth_headers(client, "heidi@example.com")
    files = {"file": ("nail.png", _synthetic_png_bytes(), "image/png")}

    response = client.post(SEGMENT_URL, files=files, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["nail_count"], int)
    assert isinstance(body["detections"], list)
    assert body["nail_count"] == len(body["detections"])
    assert body["annotated_image"].startswith("data:image/png;base64,")

    for detection in body["detections"]:
        assert isinstance(detection["id"], int)
        assert isinstance(detection["confidence"], float)
        assert len(detection["bbox"]) == 4
        assert isinstance(detection["polygon"], list)
