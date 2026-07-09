# stack_sandbox/backend/src/modules/auth/schemas.py
"""Pydantic models for auth responses."""

from pydantic import BaseModel, EmailStr, Field, model_validator


class CurrentUserResponse(BaseModel):
    id: int
    provider: str
    email: EmailStr
    display_name: str
    picture_url: str | None = None
    contact_id: int | None = None


class UpdateCurrentUserRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=200)
    picture_url: str | None = Field(default=None, max_length=2048)

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "UpdateCurrentUserRequest":
        if self.display_name is None and "picture_url" not in self.model_fields_set:
            raise ValueError("At least one of display_name or picture_url must be provided.")
        return self


class DevUserOption(BaseModel):
    id: int
    email: EmailStr
    display_name: str


class DevLoginRequest(BaseModel):
    user_id: int = Field(gt=0)


class MobileExchangeRequest(BaseModel):
    code: str = Field(min_length=16, max_length=128)


class MobileExchangeResponse(BaseModel):
    session_token: str
    user: CurrentUserResponse
