# keel_api/src/core/storage/s3_backend.py

"""S3-compatible storage backend (Garage, AWS, etc.) via aioboto3."""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import aioboto3
from botocore.exceptions import ClientError

from core.config import Settings
from core.errors import AppError
from core.storage.base import ObjectHead, StoredObject
from core.storage.keys import validate_storage_key


class S3StorageBackend:
    """Async S3 client wrapper."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._session = aioboto3.Session()

    def _client_kwargs(self) -> dict[str, Any]:
        settings = self._settings
        if not settings.s3_endpoint_url.strip():
            raise AppError(
                "Object storage is not configured (set S3_ENDPOINT_URL).",
                status_code=503,
            )
        if not settings.s3_bucket.strip():
            raise AppError(
                "Object storage bucket is not configured (set S3_BUCKET).",
                status_code=503,
            )
        if not settings.s3_access_key.strip() or not settings.s3_secret_key.strip():
            raise AppError(
                "Object storage credentials are not configured (set S3_ACCESS_KEY / S3_SECRET_KEY).",
                status_code=503,
            )

        return {
            "service_name": "s3",
            "endpoint_url": settings.s3_endpoint_url.rstrip("/"),
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "region_name": settings.s3_region or "garage",
        }

    def _config(self) -> Any:
        from botocore.config import Config

        return Config(s3={"addressing_style": "path" if self._settings.s3_force_path_style else "auto"})

    async def put_object(
        self,
        key: str,
        body: bytes,
        *,
        content_type: str,
    ) -> None:
        """Upload bytes to the configured bucket."""
        storage_key = validate_storage_key(key)
        async with self._session.client(**self._client_kwargs(), config=self._config()) as client:
            await client.put_object(
                Bucket=self._settings.s3_bucket,
                Key=storage_key,
                Body=body,
                ContentType=content_type,
            )

    async def get_object(
        self,
        key: str,
        *,
        range_header: str | None = None,
    ) -> StoredObject:
        """Download an object from the configured bucket."""
        storage_key = validate_storage_key(key)
        params: dict[str, Any] = {
            "Bucket": self._settings.s3_bucket,
            "Key": storage_key,
        }
        if range_header:
            params["Range"] = range_header

        async with self._session.client(**self._client_kwargs(), config=self._config()) as client:
            try:
                response = await client.get_object(**params)
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in {"NoSuchKey", "404", "NotFound"}:
                    raise AppError("Media file not found.", status_code=404) from exc
                raise AppError("Failed to read media file.", status_code=502) from exc

            content_type = response.get("ContentType") or "application/octet-stream"
            stream = response["Body"]
            body_bytes = await stream.read()
            if hasattr(stream, "close"):
                close_result = stream.close()
                if close_result is not None:
                    await close_result

            async def _iter_chunks() -> AsyncIterator[bytes]:
                if body_bytes:
                    yield body_bytes

            return StoredObject(
                content_type=content_type,
                content_length=len(body_bytes),
                body=_iter_chunks(),
                content_range=response.get("ContentRange"),
            )

    async def head_object(self, key: str) -> ObjectHead:
        """Return object metadata."""
        storage_key = validate_storage_key(key)
        async with self._session.client(**self._client_kwargs(), config=self._config()) as client:
            try:
                response = await client.head_object(
                    Bucket=self._settings.s3_bucket,
                    Key=storage_key,
                )
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in {"NoSuchKey", "404", "NotFound"}:
                    raise AppError("Media file not found.", status_code=404) from exc
                raise AppError("Failed to read media metadata.", status_code=502) from exc

            return ObjectHead(
                content_type=response.get("ContentType") or "application/octet-stream",
                content_length=int(response.get("ContentLength") or 0),
            )

    async def delete_object(self, key: str) -> None:
        """Delete an object from the configured bucket."""
        storage_key = validate_storage_key(key)
        async with self._session.client(**self._client_kwargs(), config=self._config()) as client:
            await client.delete_object(
                Bucket=self._settings.s3_bucket,
                Key=storage_key,
            )

    async def sync_bucket_to_dir(self, dest: Path) -> dict[str, int]:
        """Download every object in the bucket into ``dest``, preserving key paths."""
        dest.mkdir(parents=True, exist_ok=True)
        object_count = 0
        total_bytes = 0

        async with self._session.client(**self._client_kwargs(), config=self._config()) as client:
            paginator = client.get_paginator("list_objects_v2")
            async for page in paginator.paginate(Bucket=self._settings.s3_bucket):
                for item in page.get("Contents") or []:
                    key = item["Key"]
                    if key.endswith("/"):
                        continue

                    response = await client.get_object(
                        Bucket=self._settings.s3_bucket,
                        Key=key,
                    )
                    body = await response["Body"].read()
                    stream = response["Body"]
                    if hasattr(stream, "close"):
                        close_result = stream.close()
                        if close_result is not None:
                            await close_result

                    local_path = dest / key
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    local_path.write_bytes(body)

                    object_count += 1
                    total_bytes += len(body)

        return {"object_count": object_count, "total_bytes": total_bytes}
