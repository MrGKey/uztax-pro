import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    bot_token: str = field(default_factory=lambda: os.environ["BOT_TOKEN"])
    database_url: str = field(default_factory=lambda: os.environ["DATABASE_URL"])
    payme_merchant_id: str = field(default_factory=lambda: os.environ.get("PAYME_MERCHANT_ID", ""))
    payme_secret_key: str = field(default_factory=lambda: os.environ.get("PAYME_SECRET_KEY", ""))
    click_merchant_id: str = field(default_factory=lambda: os.environ.get("CLICK_MERCHANT_ID", ""))
    click_secret_key: str = field(default_factory=lambda: os.environ.get("CLICK_SECRET_KEY", ""))
    humo_merchant_id: str = field(default_factory=lambda: os.environ.get("HUMO_MERCHANT_ID", ""))
    uzcard_merchant_id: str = field(default_factory=lambda: os.environ.get("UZCARD_MERCHANT_ID", ""))
    openai_api_key: str = field(default_factory=lambda: os.environ.get("OPENAI_API_KEY", ""))
    app_url: str = field(default_factory=lambda: os.environ.get("APP_URL", "http://localhost:5173"))
    admin_chat_id: str = field(default_factory=lambda: os.environ.get("ADMIN_CHAT_ID", ""))
    partner_api_key: str = field(default_factory=lambda: os.environ.get("PARTNER_API_KEY", ""))


config = Config()
