# keel_api/Dockerfile
# Builds the Keel API image (FastAPI + Uvicorn). Postgres uses a separate image in docker-compose.yml.
#
# Playwright Chromium is optional (large layer). Default build is httpx-only for listing fetch.
# To include Chromium: docker compose build --build-arg INSTALL_PLAYWRIGHT_CHROMIUM=1 api
# Or set INSTALL_PLAYWRIGHT_CHROMIUM=1 in .env (see docker-compose build.args).

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

# 0 = skip Chromium (smaller image, faster build). 1 = install for JS-rendered listings.
ARG INSTALL_PLAYWRIGHT_CHROMIUM=0

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Separate layer so pip cache stays valid when toggling Playwright; keeps default builds small.
RUN if [ "$INSTALL_PLAYWRIGHT_CHROMIUM" = "1" ]; then \
      python -m playwright install --with-deps chromium; \
    fi

COPY src ./src
COPY docs ./docs
COPY assets ./assets
COPY scripts ./scripts

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "/app/src"]
