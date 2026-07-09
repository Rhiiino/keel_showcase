# keel_api/src/core/storage/__init__.py

"""Object storage backends."""

from functools import lru_cache

from core.config import get_settings
from core.storage.s3_backend import S3StorageBackend


@lru_cache
def get_storage_backend() -> S3StorageBackend:
    """Return the configured storage backend singleton."""
    return S3StorageBackend(get_settings())
