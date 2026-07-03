FROM python:3.12-slim

WORKDIR /app

# libgl1/libglib2.0-0 are required by opencv-python at import time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only torch/torchvision first so ultralytics' dependency
# resolution reuses them instead of pulling the much larger CUDA wheels.
RUN pip install --no-cache-dir torch==2.12.1 torchvision==0.27.1 \
    --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
