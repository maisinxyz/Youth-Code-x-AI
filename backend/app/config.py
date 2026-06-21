from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = "dev"
    log_level: str = "info"

    # CORS — Allow all for local network access
    allowed_origins: str = "*"

    # Backboard (Phase 5 §21)
    backboard_api_key: str = ""
    backboard_base_url: str = "https://app.backboard.io/api"
    default_assistant_id: str = ""

    # Supabase (Phase 5 §22) — SUPABASE_PLACEHOLDER
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ElevenLabs (Phase 3 §16)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
