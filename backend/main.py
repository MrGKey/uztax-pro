import asyncio
import logging
import os
import threading
from datetime import datetime
from contextlib import asynccontextmanager

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.types import (
    Message, InlineKeyboardMarkup, InlineKeyboardButton,
    WebAppInfo, BotCommand, InlineQuery, InlineQueryResultArticle,
    InputTextMessageContent,
)
from aiogram.filters import Command

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn

from config import config
from services.database import connect as db_connect, disconnect as db_disconnect
from api.routes import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI ---

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

@asynccontextmanager
async def app_lifespan(app: FastAPI):
    db_connect()
    logger.info("Database connected")
    yield
    db_disconnect()
    logger.info("Database disconnected")


app = FastAPI(title="UzTax Pro API", lifespan=app_lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


@app.get("/")
def health():
    return JSONResponse({"status": "ok"})


# --- Telegram Bot ---

def run_bot_sync():
    async def _run():
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

        @dp.message(Command("help"))
        async def cmd_help(message: Message):
            await message.answer(
                "🤖 <b>UzTax Pro — Помощь</b>\n\n"
                "• /start — Открыть приложение\n"
                "• /report — Отчёт за месяц\n"
                "• /help — Это сообщение\n\n"
                "<b>Inline режим:</b>\n"
                "В любом чате: @uztax_bot 50000 payme\n"
                "Создаст ссылку на оплату.\n\n"
                "Поддерживаемые методы: payme, click, uzum, humo, uzcard"
            )

        @dp.message(Command("notify"))
        async def cmd_notify(message: Message):
            await message.answer(
                "🔔 <b>Уведомления о налоге</b>\n\n"
                "Я буду напоминать вам до 25-го числа каждого месяца "
                "об оплате 1% налога.\n\n"
                "Уведомления включены автоматически."
            )

        @dp.inline_query()
        async def inline_pay(inline_query: InlineQuery):
            text = inline_query.query.strip()
            parts = text.split()
            amount = 0
            method = "payme"
            if parts:
                try:
                    amount = int(parts[0].replace(" ", ""))
                except ValueError:
                    pass
                if len(parts) > 1 and parts[1] in ("payme", "click", "uzum", "humo", "uzcard"):
                    method = parts[1]
            if amount < 100:
                results = [
                    InlineQueryResultArticle(
                        id="1",
                        title="Создать ссылку на оплату",
                        description="Например: 50000 payme",
                        input_message_content=InputTextMessageContent(
                            message_text="Использование: @uztax_bot 50000 payme\nМинимальная сумма: 100 so'm"
                        ),
                    )
                ]
            else:
                from services.payme import generate_payme_link
                order_id = f"inline_{inline_query.from_user.id}_{int(datetime.now().timestamp())}"
                if method == "payme":
                    url = generate_payme_link(amount, order_id)
                else:
                    url = f"https://pay/{method}?amount={amount}&order_id={order_id}"
                label = f"{amount:,} so'm — {method}"
                results = [
                    InlineQueryResultArticle(
                        id="1",
                        title=label,
                        description="Нажмите, чтобы отправить ссылку",
                        input_message_content=InputTextMessageContent(
                            message_text=f"💳 <b>Ссылка на оплату:</b>\n{label}\n\n{url}"
                        ),
                    )
                ]
            await inline_query.answer(results, cache_time=5)

        await bot.set_my_commands([
            BotCommand(command="start", description="Открыть приложение"),
            BotCommand(command="report", description="Отчёт за сегодня"),
            BotCommand(command="help", description="Помощь"),
            BotCommand(command="notify", description="Уведомления о налоге"),
        ])
        logger.info("Bot started")
        await dp.start_polling(bot)

    asyncio.run(_run())


# --- Main ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    t = threading.Thread(target=run_bot_sync, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=port)
