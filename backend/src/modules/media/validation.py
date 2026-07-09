# keel_api/src/modules/media/validation.py

"""Upload validation and media kind classification."""

from __future__ import annotations

from pathlib import Path

from core.errors import AppError
from modules.media import config


def extension_for_upload(mime: str, filename: str) -> str:
    """Resolve a file extension from MIME type or filename."""
    if mime in config.MIME_TO_EXTENSION:
        return config.MIME_TO_EXTENSION[mime]

    suffix = Path(filename).suffix.lower()
    if suffix:
        return suffix

    if mime.startswith(config.IMAGE_MIME_PREFIX):
        return ".img"
    if mime.startswith(config.VIDEO_MIME_PREFIX):
        return ".video"
    if mime.startswith(config.AUDIO_MIME_PREFIX):
        return ".audio"
    return ".bin"


def classify_media(mime: str, filename: str) -> str:
    """Classify an upload as image, video, audio, document, model, or other."""
    if mime.startswith(config.IMAGE_MIME_PREFIX):
        return "image"
    if mime.startswith(config.VIDEO_MIME_PREFIX):
        return "video"
    if mime.startswith(config.AUDIO_MIME_PREFIX):
        return "audio"

    suffix = Path(filename).suffix.lower()
    if suffix in config.MODEL_3D_EXTENSIONS or mime in config.MODEL_3D_MIME_TYPES:
        return "model_3d"
    if suffix in config.DOCUMENT_FILE_EXTENSIONS or mime == "application/pdf":
        return "document"
    if mime.startswith(config.TEXT_MIME_PREFIX) or mime in config.EXTRA_TEXT_MIME_TYPES:
        return "document"
    if suffix in config.TEXT_FILE_EXTENSIONS:
        return "document"
    return "other"


def is_allowed_media_upload(mime: str, filename: str) -> bool:
    """Return True when MIME type and filename are allowed."""
    if (
        mime.startswith(config.IMAGE_MIME_PREFIX)
        or mime.startswith(config.VIDEO_MIME_PREFIX)
        or mime.startswith(config.AUDIO_MIME_PREFIX)
    ):
        return True
    if mime.startswith(config.TEXT_MIME_PREFIX) or mime in config.EXTRA_TEXT_MIME_TYPES:
        return True

    suffix = Path(filename).suffix.lower()
    if suffix in config.ALLOWED_MEDIA_EXTENSIONS:
        return True
    if suffix in config.MODEL_3D_EXTENSIONS or mime in config.MODEL_3D_MIME_TYPES:
        return True

    return mime == "application/octet-stream" and suffix in config.ALLOWED_MEDIA_EXTENSIONS


def validate_media_upload(mime: str, filename: str, data: bytes) -> str:
    """Validate upload bytes and return the media kind."""
    if not data:
        raise AppError("File is empty.", status_code=400)
    if len(data) > config.MAX_MEDIA_BYTES:
        raise AppError("File exceeds maximum upload size.", status_code=400)
    if not is_allowed_media_upload(mime, filename):
        raise AppError("File type is not allowed.", status_code=400)
    return classify_media(mime, filename)


def validate_image_upload(mime: str, filename: str, data: bytes) -> str:
    """Validate a smaller image-only upload."""
    if not data:
        raise AppError("File is empty.", status_code=400)
    if len(data) > config.MAX_IMAGE_BYTES:
        raise AppError("File exceeds maximum upload size.", status_code=400)
    if mime not in config.ALLOWED_IMAGE_MIME_TYPES:
        raise AppError("Image type is not allowed.", status_code=400)
    return "image"
