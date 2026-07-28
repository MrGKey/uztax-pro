import asyncio
import logging
import os
from contextlib import asynccontextmanager

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, BotCommand
from aiogram.filters import Command
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import config
from services.database import connect as db_connect, disconnect as db_disconnect
from api.routes import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI ---

@asynccontextmanager
async def app_lifespan(app: FastAPI):
    db_connect()
    logger.info("Database connected")
    yield
    db_disconnect()
    logger.info("Database disconnected")


app = FastAPI(title="UzTax Pro API", lifespan=app_lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


# --- Telegram Bot ---

async def run_bot():
    bot = Bot(
        token=config.bot_token,
        default=DefaultBotProperties(parse_mode="HTML"),
    )
    dp = Dispatcher()

    @dp.message(Command("start"))
    async def cmd_start(message: Message):
        mini_app_url = f"{config.app_url}?start={message.from_user.id}"
        await message.answer(
            "👋 <b>UzTax Pro</b>\n\n"
            "Учёт доходов, налог 1% и платёжные ссылки в одном приложении.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="🚀 Открыть приложение",
                            web_app=WebAppInfo(url=mini_app_url),
                        )
                    ]
                ]
            ),
        )

    @dp.message(Command("report"))
    async def cmd_report(message: Message):
        await message.answer("📊 Отчёт доступен в приложении: /start")

    await bot.set_my_commands([
        BotCommand(command="start", description="Открыть приложение"),
        BotCommand(command="report", description="Отчёт за сегодня"),
    ])
    logger.info("Bot started")
    await dp.start_polling(bot)


def start():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.create_task(run_bot())
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    start()
