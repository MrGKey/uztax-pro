from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    bot_token: str
    database_url: str
    payme_merchant_id: str = ""
    payme_secret_key: str = ""
    click_merchant_id: str = ""
    click_secret_key: str = ""
    openai_api_key: str = ""

    app_url: str = "http://localhost:5173"
    admin_ids: list[int] = []


config = Config()
