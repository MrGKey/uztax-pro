import asyncio
import logging
import os
import threading
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.types import (
    Message, InlineKeyboardMarkup, InlineKeyboardButton,
    WebAppInfo, BotCommand, InlineQuery, InlineQueryResultArticle,
    InputTextMessageContent,
)
from aiogram.filters import Command

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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

# Security Middleware Stack
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = f"default-src 'self'; frame-ancestors https://telegram.org; script-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.middleware("http")
async def audit_logging(request: Request, call_next):
    logger.info(f"👉 {request.method} {request.url.path}")
    response = await call_next(request)
    if request.method in ("POST", "PUT", "DELETE"):
        logger.info(f"✅ {request.method} {request.url.path} → {response.status_code}")
    return response

app.add_middleware(TrustedHostMiddleware, allowed_hosts=[
    "uztax-pro.onrender.com",
    "uztax-frontend.onrender.com",
    "localhost",
    "127.0.0.1",
    "*.onrender.com",
])
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
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

        async def send_branded(chat_id, text, buttons=None):
            header = "━━━━━━━━━━━━━━━\n<b>UzTax Pro</b>  |  1% soliq avtomatik\n━━━━━━━━━━━━━━━\n\n"
            kb = InlineKeyboardMarkup(inline_keyboard=buttons) if buttons else None
            await bot.send_message(chat_id, header + text, reply_markup=kb)

        @dp.message(Command("start"))
        async def cmd_start(message: Message):
            mini = f"{config.app_url}?start={message.from_user.id}"
            await send_branded(
                message.from_user.id,
                f"👋 <b>Assalomu alaykum!</b>\n\n"
                f"🤖 Yakka tartibdagi tadbirkorlar uchun eng qulay ilova:\n\n"
                f"✅ <b>1% soliq</b> — avtomatik hisoblash\n"
                f"💳 <b>To'lov havolalari</b> — Payme, Click, Uzum, Humo, Uzcard\n"
                f"📊 <b>Hisobot</b> — PDF ko'rinishida yuklab olish\n"
                f"💰 <b>Xarajatlar</b> — ovozli kiritish va avto-kategoriyalash\n\n"
                f"🔽 Бошлаш учун пастдаги тугмани босинг",
                buttons=[[InlineKeyboardButton(text="🚀 Иловани очиш", web_app=WebAppInfo(url=mini))]]
            )

        @dp.message(Command("report"))
        async def cmd_report(message: Message):
            await send_branded(
                message.from_user.id,
                "📊 <b>Hisobot</b>\n\n"
                "Ойлик ва йиллик ҳисоботларни илова ичида кўринг:\n\n"
                "• Даромад ва харажатлар\n"
                "• 1% солиқ ҳисоби\n"
                "• PDF кўринишида юклаб олиш",
                buttons=[[InlineKeyboardButton(text="📊 Ҳисоботни очиш", web_app=WebAppInfo(url=f"{config.app_url}/#/tax"))]]
            )

        @dp.message(Command("help"))
        async def cmd_help(message: Message):
            await send_branded(
                message.from_user.id,
                f"❓ <b>Тез-тез сўраладиган саволлар</b>\n\n"
                f"📌 <b>/start</b> — Иловани очиш\n"
                f"📌 <b>/report</b> — Солиқ ҳисоботи\n"
                f"📌 <b>/premium</b> — Premium имкониятлар\n"
                f"📌 <b>/partner</b> — Партнёрлик дастури\n"
                f"\n"
                f"💡 <b>Inline режим:</b>\n"
                f"Ҳар қандай чатда: @uzbtax_bot 50000 payme\n"
                f"Тўлов ҳаволасини яратади\n\n"
                f"Қўллаб-қувватланадиган тўлов тизимлари:\n"
                f"▫️ Payme  ▫️ Click  ▫️ Uzum  ▫️ Humo  ▫️ Uzcard"
            )

        @dp.message(Command("notify"))
        async def cmd_notify(message: Message):
            await send_branded(
                message.from_user.id,
                "🔔 <b>Билдиришномалар</b>\n\n"
                "Мен сизга ҳар ой эслатиб тураман:\n\n"
                "📅 22-кун: \"25-гача 3 кун қолди\"\n"
                "📅 25-кун: \"Бугун солиқ тўлаш куни!\"\n\n"
                "Билдиришномалар автоматик ёқилган ✅"
            )

        import asyncio as _asyncio

        async def broadcast_messages(users, text_func):
            sem = _asyncio.Semaphore(20)
            async def send(u):
                async with sem:
                    try:
                        await bot.send_message(u["tg_id"], text_func(u))
                    except:
                        pass
            await _asyncio.gather(*[send(u) for u in users])

        async def reminder_job():
            tz = timezone(timedelta(hours=5))
            header = "━━━━━━━━━━━━━━━\n<b>UzTax Pro</b>  |  Eslatma\n━━━━━━━━━━━━━━━\n\n"
            while True:
                try:
                    await _asyncio.sleep(3600)
                    now = datetime.now(tz)
                    if now.day == 22 and now.hour == 10:
                        users = fetch("SELECT tg_id, full_name FROM users")
                        await broadcast_messages(users, lambda u:
                            f"{header}"
                            f"🔔 <b>Эслатма!</b>\n\n"
                            f"Салом, {u['full_name']}! {25 - now.day} кун қолди.\n"
                            f"1% солиқни тўлашни унутманг.\n\n"
                            f"📅 Муддат: 25-{now.month}-{now.year}"
                        )
                    if now.day == 25 and now.hour == 9:
                        users = fetch("SELECT tg_id FROM users")
                        await broadcast_messages(users, lambda u:
                            f"{header}"
                            f"⚠️ <b>Бугун — солиқ тўлов куни!</b>\n\n"
                            f"Илтимос, 1% солиқни тўланг.\n"
                            f"Кечикиш учун пени: 0.5%/кун"
                        )
                except Exception as e:
                    logger.error(f"Reminder job error: {e}")

        webhook_ok = False
        try:
            webhook_url = f"{config.app_url.rstrip('/')}/webhook"
            await bot.set_webhook(webhook_url, allowed_updates=["message", "inline_query", "callback_query"])
            logger.info(f"Webhook set to {webhook_url}")
            webhook_ok = True
        except Exception as e:
            logger.warning(f"Webhook failed, falling back to polling: {e}")

        _asyncio.create_task(reminder_job())

        @dp.message(Command("premium"))
        async def cmd_premium(message: Message):
            await send_branded(
                message.from_user.id,
                "⭐ <b>UzTax Premium</b>\n\n"
                "▫️ Чексиз тўлов ҳаволаси\n"
                "▫️ PDF ҳисоботлар\n"
                "▫️ 0.5% комиссия\n"
                "▫️ Telegram Stars: 5 Stars/ой\n\n"
                "Иловадаги Профил → Premium бўлимида",
                buttons=[[InlineKeyboardButton(text="⭐ Premium олиш", web_app=WebAppInfo(url=f"{config.app_url}/#/profile"))]]
            )

        @dp.message(Command("partner"))
        async def cmd_partner(message: Message):
            await send_branded(
                message.from_user.id,
                "🤝 <b>Партнёрлик дастури</b>\n\n"
                "Ҳар бир таклиф қилинган ИП учун 20% комиссия.\n\n"
                "Қанча кўп таклиф қилсангиз, шунча кўп ишлайсиз!\n\n"
                "Иловадаги Профил → Партнёр бўлимида",
                buttons=[[InlineKeyboardButton(text="🤝 Партнёр бўлиш", web_app=WebAppInfo(url=f"{config.app_url}/#/profile"))]]
            )

        @dp.message(lambda msg: msg.text and msg.text.startswith("/start partner_"))
        async def start_with_partner(message: Message):
            code = message.text.split("_", 1)[1] if "_" in message.text else ""
            await send_branded(
                message.from_user.id,
                f"🤝 <b>Сизни партнёр таклиф қилди!</b>\n\n"
                f"UzTax Pro — ИП учун 1% солиқни авто-ҳисоблаш ва тўлов ҳаволаси.\n\n"
                f"Иловани очинг ва рўйхатдан ўтинг!",
                buttons=[[InlineKeyboardButton(text="🚀 Иловани очиш", web_app=WebAppInfo(url=f"{config.app_url}?partner={code}"))]]
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
                        title="💳 Тўлов ҳаволасини яратиш",
                        description="Мисол: 50000 payme (минимал 100 so'm)",
                        input_message_content=InputTextMessageContent(
                            message_text="━━━━━━━━━━━━━━━\n<b>UzTax Pro</b>\n━━━━━━━━━━━━━━━\n\n<b>Тўлов ҳаволаси</b>\n\nИшлатиш: @uzbtax_bot 50000 payme\nМинимал сумма: 100 so'm"
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
                label = f"{amount:,} so'm"
                results = [
                    InlineQueryResultArticle(
                        id="1",
                        title=label,
                        description=f"{method.upper()} · Комиссия: {fee:,} so'm",
                        input_message_content=InputTextMessageContent(
                            message_text=f"━━━━━━━━━━━━━━━\n<b>UzTax Pro</b>\n━━━━━━━━━━━━━━━\n\n💳 <b>Тўлов ҳаволаси</b>\n\nСумма: <b>{amount:,}</b> so'm\nТизим: {method}\n\n{url}\n\nКомиссия: {fee:,} so'm (0.5%)"
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
        logger.info("Bot started" + (" (webhook)" if webhook_ok else " (polling)"))
        if not webhook_ok:
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
