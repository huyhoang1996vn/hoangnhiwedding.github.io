from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class RsvpCreate(BaseModel):
    full_name: str = Field(alias="fullName", min_length=1, max_length=120)
    attendees: int = Field(ge=1, le=20)
    stay: str = Field(min_length=2, max_length=3)
    message: str | None = Field(default=None, max_length=1000)
    website: str | None = None

    model_config = {"populate_by_name": True}

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("stay", mode="before")
    @classmethod
    def normalize_stay(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip().lower()
        if value not in ("yes", "no"):
            raise ValueError('stay must be "yes" or "no"')
        return value

    @field_validator("message", mode="before")
    @classmethod
    def empty_message_is_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value


class RsvpOut(BaseModel):
    id: int | None = None


class RsvpGuest(BaseModel):
    id: int
    full_name: str = Field(serialization_alias="fullName")
    attendees: int
    stay: str | None = None
    message: str | None
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}
