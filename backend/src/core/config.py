# keel_api/src/core/config.py
"""Environment-backed settings (loaded from `.env` via pydantic-settings)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://keel:keel@localhost:5433/keel"
    api_host: str = "0.0.0.0"
    api_port: int = 8002
    log_level: str = "INFO"
    app_env: str = "development"

    frontend_url: str = "http://localhost:5173"
    showcase_user_id: int = 1
    # Comma-separated extra CORS origins (e.g. production web URL when testing cross-origin).
    cors_extra_origins: str = ""

    session_cookie_name: str = "keel_session"
    session_secret: str = ""
    session_ttl_seconds: int = 604800
    max_active_sessions: int = 5
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    # Empty = host-only cookie (keelapi.themidhunraj.com / keelapi.themidhunraj.com only). Set to
    # `.themidhunraj.com` only when multiple production API hostnames must share one cookie.
    session_cookie_domain: str = ""

    chat_llm_provider: str = "openai"
    chat_max_tool_iterations: int = 5

    openai_api_key: str = ""
    anthropic_api_key: str = ""
    moonshot_api_key: str = ""
    moonshot_base_url: str = ""

    tavily_api_key: str = ""

    obsidian_vault_path: str = ""

    s3_endpoint_url: str = ""
    s3_bucket: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_region: str = "garage"
    s3_force_path_style: bool = True

    haul_playwright_enabled: bool = False
    catalog_assets_path: str = ""
    catalog_uploads_path: str = ""

    connector_token_ttl_seconds: int = 3600

    jobs_enabled: bool = True
    redis_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"
    celery_task_default_queue: str = "default"
    celery_worker_concurrency: int = 2

    backup_dir: str = "/app/backups/local"

    recently_deleted_retention_days: int = 30


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings loaded from the environment."""
    return Settings()
