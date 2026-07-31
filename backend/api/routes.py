import hashlib
import hmac
import json
import logging
import httpx
from datetime import datetime, timezone, date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Depends, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from services.database import fetch, fetchrow, execute
from services.payme import generate_payme_link
from config import config

logger = logging.getLogger(__name__)
router = APIRouter()


def verify_init_data(init_data: str) -> Optional[dict]:
    try:
        params = dict(p.split("=", 1) for p in init_data.split("&"))
        hash_val = params.pop("hash", "")
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(params.items())
        )
        secret_key = hmac.new(
            b"WebAppData", config.bot_token.encode(), hashlib.sha256
        ).digest()
        computed = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()
        if computed != hash_val:
            logger.warning("Invalid hash for init_data")
            return None
        return json.loads(params.get("user", "{}"))
    except Exception as e:
        logger.error(f"verify_init_data error: {e}")
        return None


def get_current_user(x_telegram_init_data: str = Header("")) -> dict:
    if not x_telegram_init_data:
        raise HTTPException(401, "Unauthorized")
    user_data = verify_init_data(x_telegram_init_data)
    if not user_data:
        raise HTTPException(401, "Invalid init data")

    tg_id = user_data.get("id")
    user = fetchrow("SELECT * FROM users WHERE tg_id = %s", tg_id)
    if not user:
        execute(
            "INSERT INTO users (tg_id, full_name, phone, inn) VALUES (%s, %s, '', '')",
            tg_id, user_data.get("first_name", ""),
        )
        user = fetchrow("SELECT * FROM users WHERE tg_id = %s", tg_id)
    return user


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^\+998\d{9}$")
    inn: Optional[str] = Field(None, pattern=r"^\d{9}$")
    tax_regime: Optional[str] = Field(None, pattern=r"^(service|trade|manufacturing|it)$")
    currency: Optional[str] = Field(None, pattern=r"^(UZS|USD|EUR)$")


class PaymentRequest(BaseModel):
    amount: int = Field(ge=100, le=100_000_000, description="Summa (so'm)")
    method: str = Field(pattern=r"^(payme|click|uzum|humo|uzcard)$")


class AddExpenseRequest(BaseModel):
    amount: int = Field(ge=100, le=100_000_000)
    category: str = Field(default="other", pattern=r"^(goods|rent|salary|tax|other)$")


@router.get("/auth")
def auth_user(user: dict = Depends(get_current_user)):
    return user


@router.get("/user")
def get_profile(user: dict = Depends(get_current_user)):
    return user


@router.put("/user")
def update_profile(
    body: UpdateProfileRequest,
    user: dict = Depends(get_current_user),
):
    tg_id = user["tg_id"]
    sets = []
    vals = []
    if body.full_name is not None:
        sets.append("full_name = %s")
        vals.append(body.full_name)
    if body.phone is not None:
        sets.append("phone = %s")
        vals.append(body.phone)
    if body.inn is not None:
        sets.append("inn = %s")
        vals.append(body.inn)
    if body.tax_regime is not None:
        sets.append("tax_regime = %s")
        vals.append(body.tax_regime)
    if body.currency is not None:
        sets.append("currency = %s")
        vals.append(body.currency)
    if sets:
        execute(
            f"UPDATE users SET {', '.join(sets)} WHERE tg_id = %s",
            *vals, tg_id,
        )
    return fetchrow("SELECT * FROM users WHERE tg_id = %s", tg_id)


FREE_MONTHLY_LIMIT = 3
PREMIUM_STARS = 25


@router.post("/payment/generate")
@limiter.limit("10/minute")
def generate_payment(request: Request,
    body: PaymentRequest,
    user: dict = Depends(get_current_user),
):
    tg_id = user["tg_id"]
    is_premium = user.get("stars_balance", 0) >= PREMIUM_STARS

    # Free tier limit check
    if not is_premium:
        monthly_count = fetchrow(
            "SELECT COUNT(*) as c FROM payments WHERE user_tg_id = %s AND created_at >= date_trunc('month', now())",
            tg_id,
        )
        if monthly_count and monthly_count["c"] >= FREE_MONTHLY_LIMIT:
            raise HTTPException(402, f"Free limit: {FREE_MONTHLY_LIMIT} payments/month. Upgrade to Premium (25 Stars)")

    order_id = f"{tg_id}_{int(datetime.now().timestamp())}"

    if body.method == "payme":
        url = generate_payme_link(body.amount, order_id)
    elif body.method == "click":
        url = (
            f"https://click.uz/order?merchant={config.click_merchant_id}"
            f"&amount={body.amount}&order_id={order_id}"
        )
    elif body.method == "uzum":
        url = f"https://uzum.uz/pay?amount={body.amount}&order_id={order_id}"
    elif body.method == "humo":
        url = f"https://humo.uz/merchant/pay?amount={body.amount}&order_id={order_id}&merchant={config.humo_merchant_id}"
    elif body.method == "uzcard":
        url = f"https://uzcard.uz/pay?amount={body.amount}&order_id={order_id}&merchant={config.uzcard_merchant_id}"
    else:
        raise HTTPException(400, "Unknown payment method")

    execute(
        "INSERT INTO payments (user_tg_id, amount, method) VALUES (%s, %s, %s)",
        tg_id, body.amount, body.method,
    )

    logger.info(f"Payment link generated: user={tg_id} method={body.method} amount={body.amount}")
    return {"url": url, "amount": body.amount, "method": body.method}


@router.get("/report")
def get_report(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    month_start = datetime.now(timezone.utc).replace(day=1).isoformat()

    payments = fetch(
        "SELECT * FROM payments WHERE user_tg_id = %s AND created_at >= %s",
        tg_id, month_start,
    )
    expenses = fetch(
        "SELECT * FROM expenses WHERE user_tg_id = %s AND created_at >= %s",
        tg_id, month_start,
    )

    revenue = sum(p["amount"] for p in payments)
    exp_sum = sum(e["amount"] for e in expenses)
    tax_1pct = revenue * 0.01

    return {
        "revenue": revenue,
        "tax_1pct": int(tax_1pct),
        "expenses": exp_sum,
        "net": int(revenue - tax_1pct - exp_sum),
        "payment_count": len(payments),
    }


@router.get("/expenses")
def list_expenses(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    return fetch(
        "SELECT * FROM expenses WHERE user_tg_id = %s ORDER BY created_at DESC",
        tg_id,
    )


@router.post("/expenses")
@limiter.limit("20/minute")
def add_expense(request: Request,
    body: AddExpenseRequest,
    user: dict = Depends(get_current_user),
):
    tg_id = user["tg_id"]
    row = fetchrow(
        "INSERT INTO expenses (user_tg_id, amount, category) VALUES (%s, %s, %s) RETURNING *",
        tg_id, body.amount, body.category,
    )
    return row


@router.get("/payments")
def list_payments(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    return fetch(
        "SELECT * FROM payments WHERE user_tg_id = %s ORDER BY created_at DESC LIMIT 20",
        tg_id,
    )


@router.get("/report/html")
def get_report_html(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    month_start = datetime.now(timezone.utc).replace(day=1).isoformat()
    payments = fetch(
        "SELECT * FROM payments WHERE user_tg_id = %s AND created_at >= %s",
        tg_id, month_start,
    )
    expenses = fetch(
        "SELECT * FROM expenses WHERE user_tg_id = %s AND created_at >= %s",
        tg_id, month_start,
    )
    revenue = sum(p["amount"] for p in payments)
    exp_sum = sum(e["amount"] for e in expenses)
    tax_1pct = int(revenue * 0.01)
    net = revenue - tax_1pct - exp_sum
    name = user.get("full_name", "IP")

    html = f"""<!DOCTYPE html>
<html lang="uz">
<head><meta charset="UTF-8"><title>Hisobot - SoliqPay</title>
<style>
body{{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#222}}
h1{{font-size:20px;margin-bottom:4px}}
.date{{color:#666;font-size:13px;margin-bottom:20px}}
table{{width:100%;border-collapse:collapse}}
td{{padding:10px 0;border-bottom:1px solid #eee;font-size:14px}}
td:last-child{{text-align:right;font-weight:600}}
.total td{{border-top:2px solid #000;border-bottom:none;font-weight:700;font-size:16px}}
.footer{{margin-top:24px;font-size:11px;color:#999;text-align:center}}
</style></head>
<body>
<h1>SoliqPay — Hisobot</h1>
<div class="date">{datetime.now().strftime('%B %Y')}</div>
<table>
<tr><td>Daromad</td><td>{revenue:,} so'm</td></tr>
<tr><td>1% soliq</td><td>{tax_1pct:,} so'm</td></tr>
<tr><td>Xarajatlar</td><td>{exp_sum:,} so'm</td></tr>
<tr class="total"><td>Sof daromad</td><td>{net:,} so'm</td></tr>
</table>
<div class="footer">SoliqPay — 1% soliq avtomatik | {datetime.now().strftime('%d.%m.%Y')}</div>
</body></html>"""
    return HTMLResponse(content=html, media_type="text/html")


@router.get("/admin/stats")
def admin_stats():
    users = fetch("SELECT COUNT(*) as count FROM users")
    payments = fetch("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments")
    expenses = fetch("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM expenses")
    return {
        "users": users[0]["count"] if users else 0,
        "payments_count": payments[0]["count"] if payments else 0,
        "payments_total": int(payments[0]["total"]) if payments else 0,
        "expenses_count": expenses[0]["count"] if expenses else 0,
        "expenses_total": int(expenses[0]["total"]) if expenses else 0,
    }


@router.get("/backup")
def backup_db(user: dict = Depends(get_current_user)):
    import subprocess, tempfile
    from fastapi.responses import FileResponse
    url = config.database_url
    tg_id = user["tg_id"]
    logger.info(f"Backup requested by user={tg_id}")
    tmp = tempfile.NamedTemporaryFile(suffix=".sql", delete=False)
    try:
        subprocess.run(["pg_dump", url, "-f", tmp.name], capture_output=True, timeout=30)
        return FileResponse(tmp.name, media_type="application/sql", filename=f"soliqpay_backup_{datetime.now().strftime('%Y%m%d')}.sql")
    except Exception:
        logger.error("Backup failed", exc_info=True)
        raise HTTPException(500, "Backup failed")


@router.get("/soliq/status")
def soliq_status(user: dict = Depends(get_current_user)):
    return {
        "connected": False,
        "message": "SOLIQ integratsiyasi tez orada. Agar xohlasangiz, feedback qoldiring."
    }


# ─── Strategy 1: Telegram Stars ──────────────────────────────
@router.get("/stars/balance")
def stars_balance(user: dict = Depends(get_current_user)):
    u = fetchrow("SELECT stars_balance FROM users WHERE tg_id = %s", user["tg_id"])
    return {"stars": u["stars_balance"] if u else 0}


@router.post("/stars/purchase")
def stars_purchase(user: dict = Depends(get_current_user)):
    """Creates a Telegram Stars invoice link for Premium subscription."""
    tg_id = user["tg_id"]
    order_id = f"stars_{tg_id}_{int(datetime.now().timestamp())}"
    title = "SoliqPay Premium — 1 oy"
    description = "Cheksiz to'lovlar, PDF hisobot, 1.5% komissiya"
    payload = f"premium_{tg_id}_{order_id}"
    currency = "XTR"
    amount = PREMIUM_STARS
    try:
        import requests
        r = requests.post(f"https://api.telegram.org/bot{config.bot_token}/createInvoiceLink", json={
            "title": title, "description": description, "payload": payload,
            "currency": currency, "amount": amount,
        })
        return r.json() if r.ok else {"ok": False, "error": r.text}
    except Exception as e:
        raise HTTPException(500, f"Stars error: {e}")


@router.post("/stars/purchase-annual")
def stars_purchase_annual(user: dict = Depends(get_current_user)):
    """Annual Premium at discount."""
    tg_id = user["tg_id"]
    order_id = f"stars_yr_{tg_id}_{int(datetime.now().timestamp())}"
    payload = f"premium_annual_{tg_id}_{order_id}"
    amount = PREMIUM_STARS * 10  # 250 Stars = $50 (2 months free)
    try:
        import requests
        r = requests.post(f"https://api.telegram.org/bot{config.bot_token}/createInvoiceLink", json={
            "title": "SoliqPay Premium — 1 yil",
            "description": "12 oy uchun 10 oy narxi. 2 oy sovg'a!",
            "payload": payload, "currency": "XTR", "amount": amount,
        })
        return r.json() if r.ok else {"ok": False, "error": r.text}
    except Exception as e:
        raise HTTPException(500, f"Stars error: {e}")


@router.post("/stars/confirm")
def stars_confirm(user: dict = Depends(get_current_user)):
    """Confirm Stars payment from Telegram webhook."""
    execute("UPDATE users SET stars_balance = COALESCE(stars_balance, 0) + %s WHERE tg_id = %s", PREMIUM_STARS, user["tg_id"])
    return {"ok": True, "stars_added": PREMIUM_STARS}


@router.post("/stars/confirm-annual")
def stars_confirm_annual(user: dict = Depends(get_current_user)):
    execute("UPDATE users SET stars_balance = COALESCE(stars_balance, 0) + %s WHERE tg_id = %s", PREMIUM_STARS * 12, user["tg_id"])
    return {"ok": True, "stars_added": PREMIUM_STARS * 12}


# ─── Accountant API ─────────────────────────────────────────
@router.post("/accountant/register")
def register_accountant(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    api_key = f"api_{tg_id}_{int(datetime.now().timestamp())}"
    execute(
        "INSERT INTO partners (tg_id, full_name, phone, api_key) VALUES (%s, %s, %s, %s) ON CONFLICT (tg_id) DO UPDATE SET api_key = %s",
        tg_id, user.get("full_name", ""), user.get("phone", ""), api_key, api_key,
    )
    return {"ok": True, "api_key": api_key, "plan": "business", "price": "$20/month"}


@router.get("/accountant/clients")
def accountant_clients(user: dict = Depends(get_current_user)):
    p = fetchrow("SELECT id FROM partners WHERE tg_id = %s", user["tg_id"])
    if not p:
        raise HTTPException(400, "Register as accountant first")
    clients = fetch("SELECT tg_id, full_name, phone, inn, created_at FROM users WHERE partner_id = %s", p["id"])
    return clients


# ─── Strategy 2: Commission 0.5% ─────────────────────────────
COMMISSION_RATE = 0.015  # 1.5%


@router.get("/payment/commission")
def get_commission():
    return {"rate": COMMISSION_RATE, "label": "0.5%"}


# ─── Strategy 3: Partner Network ──────────────────────────────
@router.post("/partner/register")
def partner_register(body: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    code = f"P{tg_id}{int(datetime.now().timestamp()) % 10000}"
    execute(
        "INSERT INTO partners (tg_id, full_name, phone, api_key) VALUES (%s, %s, %s, %s) ON CONFLICT (tg_id) DO NOTHING",
        tg_id, body.full_name or user.get("full_name", ""), body.phone or "", f"pk_{code}",
    )
    return {"ok": True, "referral_link": f"https://t.me/SoliqPay_bot?start=partner_{code}"}


@router.get("/partner/stats")
def partner_stats(user: dict = Depends(get_current_user)):
    p = fetchrow("SELECT * FROM partners WHERE tg_id = %s", user["tg_id"])
    if not p:
        return {"referred": 0, "earned": 0}
    return {"referred": p["total_referred"], "earned": int(p["total_earned"])}


@router.get("/partner/referrals")
def partner_referrals(user: dict = Depends(get_current_user)):
    p = fetchrow("SELECT id FROM partners WHERE tg_id = %s", user["tg_id"])
    if not p:
        return []
    return fetch("SELECT tg_id, full_name, phone, created_at FROM users WHERE partner_id = %s ORDER BY created_at DESC", p["id"])


# ─── Strategy 4: White-Label API ─────────────────────────────
@router.get("/partner/api/stats")
def whitelabel_stats(x_api_key: str = Header("")):
    if not x_api_key or x_api_key != config.partner_api_key:
        raise HTTPException(401, "Invalid API key")
    return {
        "total_users": fetchrow("SELECT COUNT(*) as c FROM users")["c"],
        "total_payments": fetchrow("SELECT COUNT(*) as c FROM payments")["c"],
        "total_revenue": int(fetchrow("SELECT COALESCE(SUM(amount), 0) as s FROM payments")["s"]),
        "version": "0.2.0",
    }


# ─── Tax System — Uzbekistan IP ──────────────────────────────
TAX_REGIMES = {
    "service": {"rate": 1, "label": "Xizmatlar — 1%", "desc": "Marketing, dizayn, konsalting"},
    "trade": {"rate": 4, "label": "Savdo — 4%", "desc": "Chakana va ulgurji savdo"},
    "manufacturing": {"rate": 4, "label": "Ishlab chiqarish — 4%", "desc": "Mahsulot ishlab chiqarish"},
    "it": {"rate": 0, "label": "IT-park — 0%", "desc": "Rezidentlari IT parki"},
}

PENALTY_RATE = 0.005   # 0.5% за каждый день просрочки

BHM_MONTHLY = 340_000
SOCIAL_CONTRIB_YEARLY = BHM_MONTHLY * 12


@router.get("/tax/regimes")
def get_tax_regimes():
    return TAX_REGIMES


@router.get("/tax/calculate")
def calculate_tax(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    regime = user.get("tax_regime", "service")
    rate = TAX_REGIMES.get(regime, {}).get("rate", 1)

    month_start = datetime.now(timezone.utc).replace(day=1).isoformat()
    payments = fetch("SELECT amount FROM payments WHERE user_tg_id = %s AND created_at >= %s", tg_id, month_start)
    revenue = sum(p["amount"] for p in payments)
    tax_amount = int(revenue * rate / 100)

    today = date.today()
    deadline = date(today.year, today.month, 25)
    days_overdue = (today - deadline).days if today > deadline else 0
    penalty = int(tax_amount * PENALTY_RATE * days_overdue) if days_overdue > 0 else 0

    social_due = None
    if today.month == 12 and today.day >= 1:
        social_due = SOCIAL_CONTRIB_YEARLY
        if not user.get("social_contrib_paid"):
            social_due = SOCIAL_CONTRIB_YEARLY

    return {
        "regime": regime,
        "rate": rate,
        "revenue": revenue,
        "tax": tax_amount,
        "penalty": penalty,
        "total": tax_amount + penalty,
        "days_overdue": days_overdue,
        "deadline": deadline.isoformat(),
        "social_due": social_due,
        "bhm_monthly": BHM_MONTHLY,
    }


@router.get("/tax/calendar")
def tax_calendar(user: dict = Depends(get_current_user)):
    today = date.today()
    regime = user.get("tax_regime", "service")
    events = []

    # Ежемесячный налог (до 25-го)
    for m in range(today.month, today.month + 3):
        m = ((m - 1) % 12) + 1
        y = today.year + (1 if m < today.month else 0)
        d = date(y, m, 25)
        days_left = (d - today).days
        events.append({
            "title": "1% soliq to'lovi" if regime == "service" else f"{TAX_REGIMES.get(regime,{}).get('rate',1)}% soliq",
            "date": d.isoformat(),
            "days_left": days_left,
            "type": "monthly",
            "penalty_rate": "0.5%/kun" if days_left < 0 else None,
        })

    # Годовая декларация - 1 марта
    decl = date(today.year + (1 if today.month > 2 else 0), 3, 1)
    events.append({
        "title": "Yillik deklaratsiya topshirish",
        "date": decl.isoformat(),
        "days_left": (decl - today).days,
        "type": "yearly",
    })

    # Соц. отчисления - до 15 декабря
    soc = date(today.year if today.month <= 12 else today.year + 1, 12, 15)
    if today <= soc:
        events.append({
            "title": "Ijtimoiy to'lovlar (BHM × 12)",
            "date": soc.isoformat(),
            "days_left": (soc - today).days,
            "type": "yearly",
            "amount": SOCIAL_CONTRIB_YEARLY,
        })

    return events


@router.get("/tax/currency-rates")
async def get_currency_rates():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/")
            if r.status_code == 200:
                rates_data = r.json()
                rates = {"UZS": 1, "USD": 0, "EUR": 0}
                for item in rates_data:
                    if item.get("Ccy") in ("USD", "EUR"):
                        rates[item["Ccy"]] = float(item.get("Rate", 0))
                from datetime import date as dt_date
                return {"date": dt_date.today().isoformat(), "rates": rates}
    except Exception:
        pass
    return {"date": datetime.now().strftime("%Y-%m-%d"), "rates": {"UZS": 1, "USD": 12700, "EUR": 13800}}


# ─── Strategy 5: SOLIQ ───────────────────────────────────────
@router.post("/soliq/submit")
def soliq_submit(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    regime = user.get("tax_regime", "service")
    rate = TAX_REGIMES.get(regime, {}).get("rate", 1)

    report = fetchrow("""
        SELECT COALESCE(SUM(amount), 0) as revenue FROM payments
        WHERE user_tg_id = %s AND created_at >= date_trunc('month', now())
    """, tg_id)
    revenue = report["revenue"] if report else 0
    tax_amount = int(revenue * rate / 100)

    if revenue == 0:
        raise HTTPException(400, "Hisobot uchun ma'lumotlar yo'q")

    today = date.today()
    deadline = date(today.year, today.month, 25)
    days_overdue = (today - deadline).days if today > deadline else 0
    penalty = int(tax_amount * PENALTY_RATE * days_overdue) if days_overdue > 0 else 0

    execute("UPDATE users SET last_tax_paid_at = now() WHERE tg_id = %s", tg_id)

    logger.info(f"SOLIQ: user={tg_id} regime={regime} revenue={revenue} tax={tax_amount} penalty={penalty}")
    return {
        "ok": True,
        "submitted": True,
        "revenue": revenue,
        "tax": tax_amount,
        "penalty": penalty,
        "total": tax_amount + penalty,
        "deadline": deadline.isoformat(),
        "regime": regime,
        "rate": rate,
        "message": f"Deklaratsiya qabul qilindi. To'lanadigan: {tax_amount:,} so'm"
    }


# ─── GDPR / Data Rights (Закон РУз «О персональных данных») ──
@router.get("/user/data-export")
def data_export(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    payments = fetch("SELECT * FROM payments WHERE user_tg_id = %s ORDER BY created_at DESC", tg_id)
    expenses = fetch("SELECT * FROM expenses WHERE user_tg_id = %s ORDER BY created_at DESC", tg_id)
    data = {"user": user, "payments": payments, "expenses": expenses, "exported_at": datetime.now().isoformat()}
    from fastapi.responses import JSONResponse
    return JSONResponse(content=data, headers={"Content-Disposition": f'attachment; filename="soliqpay-data-{tg_id}.json"'})

@router.delete("/user/data-delete")
def data_delete(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    execute("DELETE FROM payments WHERE user_tg_id = %s", tg_id)
    execute("DELETE FROM expenses WHERE user_tg_id = %s", tg_id)
    execute("DELETE FROM users WHERE tg_id = %s", tg_id)
    logger.info(f"User data deleted: {tg_id}")
    return {"ok": True, "message": "Barcha ma'lumotlar o'chirildi"}


# ─── Push notifications ───────────────────────────────────────
@router.post("/notify/payment")
def notify_payment(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    try:
        import requests
        requests.post(f"https://api.telegram.org/bot{config.bot_token}/sendMessage", json={
            "chat_id": tg_id,
            "text": f"✅ <b>To'lov qabul qilindi!</b>\n\n"
                    f"Kimdir sizning to'lov havolangiz orqali to'lov qildi.\n"
                    f"Batafsil: {config.app_url}",
            "parse_mode": "HTML",
        }, timeout=5)
    except Exception:
        pass
    return {"ok": True}


# ─── 1C Export ────────────────────────────────────────────────
@router.get("/report/csv")
def export_csv(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    payments = fetch("SELECT * FROM payments WHERE user_tg_id = %s ORDER BY created_at DESC", tg_id)
    expenses = fetch("SELECT * FROM expenses WHERE user_tg_id = %s ORDER BY created_at DESC", tg_id)
    import csv, io
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Тип", "Сумма", "Метод/Категория", "Дата"])
    for p in payments:
        w.writerow(["Платёж", p["amount"], p["method"], p["created_at"]])
    for e in expenses:
        w.writerow(["Расход", e["amount"], e["category"], e["created_at"]])
    from fastapi.responses import StreamingResponse
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=soliqpay-1c-{datetime.now().strftime('%Y%m')}.csv"})


# ─── History ───────────────────────────────────────────────────
@router.get("/history")
def get_history(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    payments = fetch("SELECT id, amount, method, 'payment' as type, created_at FROM payments WHERE user_tg_id = %s ORDER BY created_at DESC LIMIT 10", tg_id)
    expenses = fetch("SELECT id, amount, category, 'expense' as type, created_at FROM expenses WHERE user_tg_id = %s ORDER BY created_at DESC LIMIT 10", tg_id)
    all_items = sorted(payments + expenses, key=lambda x: x["created_at"], reverse=True)[:10]
    return all_items


# ─── Top Clients ──────────────────────────────────────────────
@router.get("/analytics/top-clients")
def top_clients(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    data = fetch(
        "SELECT method, COUNT(*) as count, SUM(amount) as total FROM payments WHERE user_tg_id = %s GROUP BY method ORDER BY total DESC",
        tg_id,
    )
    return [{"name": d["method"], "count": d["count"], "total": int(d["total"])} for d in data]


# ─── Partner Dashboard ────────────────────────────────────────
@router.get("/partner/dashboard")
def partner_dashboard(user: dict = Depends(get_current_user)):
    p = fetchrow("SELECT * FROM partners WHERE tg_id = %s", user["tg_id"])
    if not p:
        return {"error": "Register as partner first"}
    refs = fetch("SELECT tg_id, full_name, phone, created_at FROM users WHERE partner_id = %s ORDER BY created_at DESC", p["id"])
    total_revenue = sum(
        fetchrow("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE user_tg_id = %s", r["tg_id"])["s"]
        for r in refs
    )
    return {
        "referred_count": len(refs),
        "total_revenue": int(total_revenue),
        "commission": int(total_revenue * 0.20),
        "referrals": [
            {"name": r["full_name"], "phone": r["phone"], "registered": r["created_at"]}
            for r in refs
        ],
    }


# ─── Analytics ────────────────────────────────────────────────
@router.post("/analytics/track")
def track_event(user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    logger.info(f"Analytics: user={tg_id} active")
    return {"ok": True}


class FeedbackRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


@router.post("/feedback")
def send_feedback(
    body: FeedbackRequest,
    user: dict = Depends(get_current_user),
):
    tg_id = user["tg_id"]
    logger.info(f"Feedback from user={tg_id}: {body.message}")
    return {"ok": True}


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, user: dict = Depends(get_current_user)):
    tg_id = user["tg_id"]
    execute("DELETE FROM expenses WHERE id = %s AND user_tg_id = %s", expense_id, tg_id)
    logger.info(f"Expense deleted: user={tg_id} expense_id={expense_id}")
    return {"ok": True}
