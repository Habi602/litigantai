from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "super-secret-key-change-in-production"
    DATABASE_URL: str = "sqlite:///./storage.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"
    ANTHROPIC_API_KEY: str = ""
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = {"env_file": ".env"}


settings = Settings()
