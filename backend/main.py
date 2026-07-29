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
from services.database import connect as db_connect, disconnect as db_disconnect, fetch
from fastapi import Request as FastAPIRequest
from api.routes import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI ---

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

bot_instance = None

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
FRONTEND_URL = config.app_url.rstrip("/")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


@app.get("/")
def health():
    return JSONResponse({"status": "ok", "service": "UzTax Pro"})


@app.post("/webhook")
async def telegram_webhook(request: FastAPIRequest):
    global bot_instance
    if bot_instance is None:
        return JSONResponse({"ok": False, "error": "Bot not ready"}, status_code=503)
    update = await request.json()
    dp = bot_instance.get("dp")
    bot = bot_instance.get("bot")
    if dp and bot:
        from aiogram.types import Update
        await dp.feed_webhook_update(bot, Update(**update))
    return JSONResponse({"ok": True})


# --- Telegram Bot ---

def run_bot_sync():
    async def _run():
        global bot_instance
        bot = Bot(
            token=config.bot_token,
            default=DefaultBotProperties(parse_mode="HTML"),
        )
        dp = Dispatcher()
        bot_instance = {"bot": bot, "dp": dp}

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

        import asyncio as _asyncio

        async def reminder_job():
            while True:
                try:
                    await _asyncio.sleep(3600)
                    now = datetime.now()
                    if now.day == 22 and now.hour == 10:
                        users = fetch("SELECT tg_id, full_name FROM users")
                        for u in users:
                            try:
                                await bot.send_message(
                                    u["tg_id"],
                                    f"🔔 <b>Eslatma!</b>\n\n"
                                    f"{u['full_name']}, 25-kungacha {3 - (now.day - 22)} kun qoldi.\n"
                                    f"1% soliqni to'lashni unutmang.\n\n"
                                    f"Открыть приложение: {config.app_url}"
                                )
                            except:
                                pass
                    if now.day == 25 and now.hour == 9:
                        users = fetch("SELECT tg_id FROM users")
                        for u in users:
                            try:
                                await bot.send_message(
                                    u["tg_id"],
                                    f"⚠️ <b>Bugun — soliq to'lovi kuni!</b>\n\n"
                                    f"Iltimos, 1% soliqni to'lang. Kechikish uchun peni 0.5%/kun."
                                )
                            except:
                                pass
                except:
                    pass

        try:
            webhook_url = f"{config.app_url.rstrip('/')}/webhook"
            await bot.set_webhook(webhook_url, allowed_updates=["message", "inline_query", "callback_query"])
            logger.info(f"Webhook set to {webhook_url}")
        except Exception as e:
            logger.warning(f"Webhook failed, falling back to polling: {e}")

        _asyncio.create_task(reminder_job())

        @dp.message(Command("premium"))
        async def cmd_premium(message: Message):
            await message.answer(
                "⭐ <b>UzTax Pro Premium</b>\n\n"
                "• Cheksiz to'lov havolalari\n"
                "• PDF hisobotlar\n"
                "• 0.5% komissiya (5,000 so'm = 25 so'm)\n"
                "• Telegram Stars bilan to'lang: 5 Stars/oy\n\n"
                "Premium sotib olish: открыть приложение → Профиль → Premium"
            )

        @dp.message(Command("partner"))
        async def cmd_partner(message: Message):
            await message.answer(
                "🤝 <b>Partnerlik dasturi</b>\n\n"
                "Taklif qilingan har bir ИП uchun 20% komissiya.\n\n"
                "Batafsil: открыть приложение → Профиль → Partner"
            )

        @dp.message(lambda msg: msg.text and msg.text.startswith("/start partner_"))
        async def start_with_partner(message: Message):
            code = message.text.split("_", 1)[1] if "_" in message.text else ""
            await message.answer(
                f"🤝 Sizni partner taklif qildi!\n\n"
                "Подключите UzTax Pro и начните экономить на налогах.",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="Открыть UzTax Pro", web_app=WebAppInfo(url=f"{config.app_url}?partner={code}"))]
                ])
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
                fee = int(amount * 0.005)
                label = f"{amount:,} so'm — {method}"
                results = [
                    InlineQueryResultArticle(
                        id="1",
                        title=label,
                        description=f"Komissiya: {fee:,} so'm (0.5%)",
                        input_message_content=InputTextMessageContent(
                            message_text=f"💳 <b>Ссылка на оплату:</b>\n{label}\n\n{url}\n\n<i>Komissiya: {fee:,} so'm</i>"
                        ),
                    )
                ]
            await inline_query.answer(results, cache_time=5)

        await bot.set_my_commands([
            BotCommand(command="start", description="Открыть приложение"),
            BotCommand(command="premium", description="Premium podpiska"),
            BotCommand(command="partner", description="Partnerlik dasturi"),
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

    def bot_runner():
        while True:
            try:
                run_bot_sync()
            except Exception as e:
                logger.error(f"Bot crashed: {e}, restarting in 5s...", exc_info=True)
                import time
                time.sleep(5)

    t = threading.Thread(target=bot_runner, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=port)
