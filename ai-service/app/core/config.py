from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    INTERNAL_API_KEY: str = "dev-internal-key"
    BACKEND_URL: str = "http://localhost:5000/api"
    PORT: int = 8000

    # AI thresholds
    ML_CONFIDENCE_THRESHOLD: float = 0.70
    GEMINI_BATCH_SIZE: int = 20

    # Subscription detection
    SUBSCRIPTION_MIN_MONTHS: int = 3
    SUBSCRIPTION_COV_THRESHOLD: float = 0.10

    # Fraud detection
    FRAUD_LARGE_TX_MULTIPLIER: float = 3.0
    FRAUD_ZSCORE_THRESHOLD: float = 2.5
    FRAUD_ISOLATION_CONTAMINATION: float = 0.05
    FRAUD_DUPLICATE_HOURS: int = 24

    # Savings thresholds (INR)
    SAVINGS_FOOD_DELIVERY_THRESHOLD: float = 5000.0
    SAVINGS_ENTERTAINMENT_THRESHOLD: float = 3000.0
    SAVINGS_HIGH_EMI_RATIO: float = 0.40

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
