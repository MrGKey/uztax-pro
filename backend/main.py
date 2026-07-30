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


app = FastAPI(title="SoliqPay API", lifespan=app_lifespan)
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
    response.headers["Content-Security-Policy"] = f"default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors https://telegram.org https://*.telegram.org; script-src 'self' https://telegram.org"
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
    return JSONResponse({"status": "ok", "service": "SoliqPay"})


# --- Telegram Bot ---

def run_bot_sync():
    async def _run():
        bot = Bot(
            token=config.bot_token,
            default=DefaultBotProperties(parse_mode="HTML"),
        )
        dp = Dispatcher()

        def fmt(text): return text.strip()

        async def send(chat_id, text, buttons=None, big=False):
            kb = InlineKeyboardMarkup(inline_keyboard=buttons) if buttons else None
            msg = fmt(text)
            if not big:
                msg = f"<b>▎SoliqPay</b>\n{msg}"
            await bot.send_message(chat_id, msg, reply_markup=kb)

        @dp.message(Command("start"))
        async def cmd_start(message: Message):
            mini = f"{config.app_url}?start={message.from_user.id}"
            ref = f"https://t.me/SoliqPay_bot?start=ref_{message.from_user.id}"
            await send(message.from_user.id, f"""
👋 <b>Assalomu alaykum!</b>

<i>Yakka tartibdagi tadbirkorlar uchun raqamli ofis</i>

<b>📌 Имкониятлар:</b>
├ 💰 1% солиқни авто-ҳисоблаш
├ 💳 Payme · Click · Uzum · Humo · Uzcard
├ 📊 PDF ҳисоботлар
├ 🎤 Овозли харажат киритиш
└ 🔄 Telegram Stars орқали тўлов

<b>Дўстларингизни таклиф қилинг ва бонус олинг! 🎁</b>
""", buttons=[[InlineKeyboardButton(text="🚀 Иловани очиш", web_app=WebAppInfo(url=mini))],
             [InlineKeyboardButton(text="👥 Дўстга юбориш", url=f"https://t.me/share/url?url={ref}&text=1%25+солиқни+авто-ҳисоблаш")],
             [InlineKeyboardButton(text="📢 Янгиликлар", url="https://t.me/SoliqPay_News")]])

        @dp.message(Command("report"))
        async def cmd_report(message: Message):
            await send(message.from_user.id, f"""
📊 <b>Солиқ ҳисоботи</b>

Ойлик ва йиллик ҳисоботлар:
├ Даромад ва харажатлар
├ 1% солиқ ҳисоби  
├ PDF кўринишида юклаб олиш
""", buttons=[[InlineKeyboardButton(text="📊 Ҳисоботни очиш", web_app=WebAppInfo(url=f"{config.app_url}/#/tax"))]])

        @dp.message(Command("help"))
        async def cmd_help(message: Message):
            await send(message.from_user.id, f"""
❓ <b>Ёрдам ва командалар</b>

<b>📋 Командалар:</b>
├ /start — иловани очиш
├ /report — солиқ ҳисоботи
├ /premium — Premium имкониятлар
├ /partner — партнёрлик дастури
├ /news — сўнгги янгиликлар
├ /help — ёрдам

<b>💡 Inline режим:</b>
Ҳар қандай чатда:
<code>@SoliqPay_bot 50000 payme</code>

<b>Қўллаб-қувватланадиган тизимлар:</b>
Payme · Click · Uzum · Humo · Uzcard

<b>🆘 Муаммо бўлса:</b>
Илова ичида → Профил → Feedback
""")

        @dp.message(Command("notify"))
        async def cmd_notify(message: Message):
            await send(message.from_user.id, f"""
🔔 <b>Билдиришномалар</b>

Мен сизга ҳар ой эслатиб тураман:

📅 <b>22-кун:</b> «25-гача 3 кун қолди»
📅 <b>25-кун:</b> «Бугун солиқ тўлов куни!»
📅 <b>1-март:</b> «Йиллик декларация топиширинг»

Билдиришномалар автоматик ёқилган ✅
""")

        @dp.message(Command("news"))
        async def cmd_news(message: Message):
            await send(message.from_user.id, f"""
📢 <b>Сўнгги янгиликлар</b>

• <b>SoliqPay Premium:</b> 25 Stars/ой · 250 Stars/йил
• <b>Humo ва Uzcard:</b> Қўшиб бўлди ✅
• <b>Овозли киритиш:</b> Харажатларни овоз билан қўшинг
• <b>PDF ҳисобот:</b> Нашриётлар учун

<b>Янгиликларга обуна бўлинг:</b>
""", buttons=[[InlineKeyboardButton(text="📢 SoliqPay News", url="https://t.me/SoliqPay_News")]])

        import asyncio as _asyncio

        async def broadcast(users, text_func):
            sem = _asyncio.Semaphore(20)
            async def send_one(u):
                async with sem:
                    try:
                        await bot.send_message(u["tg_id"], text_func(u))
                    except: pass
            await _asyncio.gather(*[send_one(u) for u in users])

        async def reminder_job():
            tz = timezone(timedelta(hours=5))
            while True:
                try:
                    await _asyncio.sleep(3600)
                    now = datetime.now(tz)
                    if now.day == 22 and now.hour == 10:
                        users = fetch("SELECT tg_id, full_name FROM users")
                        await broadcast(users, lambda u:
                            f"<b>▎SoliqPay</b>\n\n"
                            f"🔔 <b>Эслатма!</b>\n\n"
                            f"<b>{u['full_name']}</b>, {25 - now.day} кун қолди.\n"
                            f"1% солиқни тўлаш муддати: <b>25-{now.month}</b>\n\n"
                            f"📌 <i>Тўловни илова орқали амалга оширинг</i>")
                    if now.day == 25 and now.hour == 9:
                        users = fetch("SELECT tg_id FROM users")
                        await broadcast(users, lambda u:
                            f"<b>▎SoliqPay</b>\n\n"
                            f"⚠️ <b>Бугун солиқ тўлов куни!</b>\n\n"
                            f"Илтимос, 1% солиқни тўланг.\n"
                            f"Кечикиш учун пени: <b>0.5%/кун</b>\n\n"
                            f"🚀 <i>Иловани очинг → Профил → Солиқ</i>")
                except Exception as e:
                    logger.error(f"Reminder error: {e}")

        _asyncio.create_task(reminder_job())

        @dp.message(Command("premium"))
        async def cmd_premium(message: Message):
            await send(message.from_user.id, f"""
⭐ <b>SoliqPay Premium</b>

<b>Имкониятлар:</b>
├ ✅ Чексиз тўлов ҳаволаси
├ ✅ PDF ҳисоботлар
├ ✅ 0.5% комиссия
├ ✅ Приоритет қўллаб-қувватлаш

<b>💰 Нархи:</b>
└ Telegram Stars: 5 Stars/ой
""", buttons=[[InlineKeyboardButton(text="⭐ Premium олиш", web_app=WebAppInfo(url=f"{config.app_url}/#/profile"))]])

        @dp.message(Command("partner"))
        async def cmd_partner(message: Message):
            await send(message.from_user.id, f"""
🤝 <b>Партнёрлик дастури</b>

<b>Шартлар:</b>
├ Ҳар бир таклиф қилинган ИП учун 20%
├ Чексиз даромад
├ Автоматик ҳисоб

<b>Қанча кўп таклиф → шунча кўп даромад</b>
""", buttons=[[InlineKeyboardButton(text="🤝 Партнёр бўлиш", web_app=WebAppInfo(url=f"{config.app_url}/#/profile"))]])

        @dp.message(lambda msg: msg.text and msg.text.startswith("/start partner_"))
        async def start_with_partner(message: Message):
            code = message.text.split("_", 1)[1] if "_" in message.text else ""
            await send(message.from_user.id, f"""
🤝 <b>Сизни партнёр таклиф қилди!</b>

SoliqPay — ИП учун 1% солиқни авто-ҳисоблаш
ва тўлов ҳаволаси. Рўйхатдан ўтинг!
""", buttons=[[InlineKeyboardButton(text="🚀 Иловани очиш", web_app=WebAppInfo(url=f"{config.app_url}?partner={code}"))]])

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
                results = [InlineQueryResultArticle(id="1",
                    title="💳 Тўлов ҳаволасини яратиш",
                    description="Мисол: 50000 payme",
                    input_message_content=InputTextMessageContent(
                        message_text=f"<b>▎SoliqPay</b>\n\n💳 Тўлов ҳаволаси\n\n<code>@SoliqPay_bot 50000 payme</code>\n\nМинимал сумма: 100 so'm"))]
            else:
                from services.payme import generate_payme_link
                order_id = f"inline_{inline_query.from_user.id}_{int(datetime.now().timestamp())}"
                if method == "payme": url = generate_payme_link(amount, order_id)
                else: url = f"https://pay/{method}?amount={amount}&order_id={order_id}"
                fee = int(amount * 0.015)
                results = [InlineQueryResultArticle(id="1",
                    title=f"{amount:,} so'm",
                    description=f"{method.upper()} · Комиссия 1.5%: {fee:,} so'm",
                    input_message_content=InputTextMessageContent(
                        message_text=f"<b>▎SoliqPay</b>\n\n💳 <b>Тўлов ҳаволаси</b>\n\nСумма: <b>{amount:,}</b> so'm\nТизим: {method}\n\n{url}\n\nКомиссия: {fee:,} so'm (1.5%)"))]
            await inline_query.answer(results, cache_time=5)

        @dp.message(Command("share"))
        async def cmd_share(message: Message):
            ref = f"https://t.me/SoliqPay_bot?start=ref_{message.from_user.id}"
            await send(message.from_user.id, f"""
👥 <b>Дўстларингизни таклиф қилинг</b>

Ҳар бир таклиф қилинган дўстингиз учун:
├ 🎁 <b>1 ой Premium</b> (агар дўстингиз рўйхатдан ўтса)
├ 🤝 Шунингдек, у ҳам олади

<b>Сизнинг таклиф ҳаволагиз:</b>
<code>{ref}</code>

Тугмани босиб дўстингизга юборинг!
""", buttons=[[InlineKeyboardButton(text="👥 Дўстга юбориш", url=f"https://t.me/share/url?url={ref}")]])

        @dp.message(Command("broadcast"))
        async def cmd_broadcast(message: Message):
            admin_id = config.admin_chat_id
            if not admin_id or str(message.from_user.id) != admin_id:
                await send(message.from_user.id, "❌ Бу команда фақат админ учун")
                return
            text = message.text.replace("/broadcast", "").strip()
            if not text:
                await send(message.from_user.id, "Ишлатиш: /broadcast Хабар матни")
                return
            users = fetch("SELECT tg_id FROM users")
            sent = 0
            for u in users:
                try:
                    await bot.send_message(u["tg_id"], f"📢 <b>SoliqPay</b>\n\n{text}")
                    sent += 1
                    await _asyncio.sleep(0.05)
                except: pass
            await send(message.from_user.id, f"✅ Хабар {sent} та фойдаланувчига юборилди")

        await bot.set_my_commands([
            BotCommand(command="start", description="🚀 Открыть приложение"),
            BotCommand(command="premium", description="⭐ Premium"),
            BotCommand(command="share", description="👥 Друзьям"),
            BotCommand(command="partner", description="🤝 Партнёрлар"),
            BotCommand(command="report", description="📊 Отчёт"),
            BotCommand(command="news", description="📢 Янгиликлар"),
            BotCommand(command="notify", description="🔔 Эслатмалар"),
            BotCommand(command="help", description="❓ Ёрдам"),
        ])
        logger.info("Bot started (polling)")
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
