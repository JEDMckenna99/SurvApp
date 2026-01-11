from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Surv"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    
    # Database - Will use Heroku DATABASE_URL in production
    DATABASE_URL: str = "sqlite:///./surv_dev.db"
    
    # Security - Override with environment variables in production
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_USE_ENV_VAR"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Twilio SMS Settings - Set via Heroku config vars
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    # Stripe Payment Settings - Set via Heroku config vars
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLIC_KEY: str = ""
    
    # SendGrid Email Settings - Set via Heroku config vars
    SENDGRID_API_KEY: str = ""
    
    # Lemma IAM Settings - Set via Heroku config vars
    LEMMA_API_KEY: str = ""
    LEMMA_SITE_ID: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

