import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

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
    if sets:
        execute(
            f"UPDATE users SET {', '.join(sets)} WHERE tg_id = %s",
            *vals, tg_id,
        )
    return fetchrow("SELECT * FROM users WHERE tg_id = %s", tg_id)


@router.post("/payment/generate")
def generate_payment(
    body: PaymentRequest,
    user: dict = Depends(get_current_user),
):
    tg_id = user["tg_id"]
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
def add_expense(
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
<head><meta charset="UTF-8"><title>Hisobot - UzTax Pro</title>
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
<h1>UzTax Pro — Hisobot</h1>
<div class="date">{datetime.now().strftime('%B %Y')}</div>
<table>
<tr><td>Daromad</td><td>{revenue:,} so'm</td></tr>
<tr><td>1% soliq</td><td>{tax_1pct:,} so'm</td></tr>
<tr><td>Xarajatlar</td><td>{exp_sum:,} so'm</td></tr>
<tr class="total"><td>Sof daromad</td><td>{net:,} so'm</td></tr>
</table>
<div class="footer">UzTax Pro — 1% soliq avtomatik | {datetime.now().strftime('%d.%m.%Y')}</div>
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
def backup_db():
    import subprocess, tempfile, os
    from fastapi.responses import FileResponse
    url = config.database_url
    tmp = tempfile.NamedTemporaryFile(suffix=".sql", delete=False)
    try:
        subprocess.run(["pg_dump", url, "-f", tmp.name], capture_output=True, timeout=30)
        return FileResponse(tmp.name, media_type="application/sql", filename=f"uztax_backup_{datetime.now().strftime('%Y%m%d')}.sql")
    except:
        return {"error": "Backup failed"}


@router.get("/soliq/status")
def soliq_status(user: dict = Depends(get_current_user)):
    return {
        "connected": False,
        "message": "SOLIQ integratsiyasi tez orada. Agar xohlasangiz, feedback qoldiring."
    }


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
