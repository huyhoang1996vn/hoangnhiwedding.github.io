from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://wedding:wedding@localhost:5432/wedding"
    cors_origins: str = "http://127.0.0.1:5500,http://localhost:5500"
    google_sheet_id: str = ""
    google_sheet_tab: str = "RSVP"
    google_credentials_file: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
