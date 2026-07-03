"""Tests for /api/auth/register, /api/auth/login, /api/auth/me."""
from fastapi.testclient import TestClient

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"


def test_register_success(client: TestClient) -> None:
    response = client.post(REGISTER_URL, json={"email": "alice@example.com", "password": "supersecret"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert isinstance(body["id"], int)
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_duplicate_email_returns_409(client: TestClient) -> None:
    payload = {"email": "bob@example.com", "password": "supersecret"}

    first = client.post(REGISTER_URL, json=payload)
    assert first.status_code == 201

    second = client.post(REGISTER_URL, json=payload)
    assert second.status_code == 409
    assert "already registered" in second.json()["detail"].lower()


def test_login_success(client: TestClient) -> None:
    client.post(REGISTER_URL, json={"email": "carol@example.com", "password": "supersecret"})

    response = client.post(LOGIN_URL, json={"email": "carol@example.com", "password": "supersecret"})

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]


def test_login_wrong_password_returns_401(client: TestClient) -> None:
    client.post(REGISTER_URL, json={"email": "dave@example.com", "password": "supersecret"})

    response = client.post(LOGIN_URL, json={"email": "dave@example.com", "password": "wrong-password"})

    assert response.status_code == 401


def test_login_unknown_email_returns_401(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json={"email": "ghost@example.com", "password": "whatever"})

    assert response.status_code == 401


def test_me_with_valid_token(client: TestClient) -> None:
    client.post(REGISTER_URL, json={"email": "erin@example.com", "password": "supersecret"})
    login_response = client.post(LOGIN_URL, json={"email": "erin@example.com", "password": "supersecret"})
    token = login_response.json()["access_token"]

    response = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "erin@example.com"
    assert isinstance(body["id"], int)


def test_me_without_token_returns_401(client: TestClient) -> None:
    response = client.get(ME_URL)

    assert response.status_code == 401


def test_me_with_invalid_token_returns_401(client: TestClient) -> None:
    response = client.get(ME_URL, headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401


def test_me_with_malformed_auth_header_returns_401(client: TestClient) -> None:
    response = client.get(ME_URL, headers={"Authorization": "not-bearer-scheme"})

    assert response.status_code == 401
