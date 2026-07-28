import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel

from services.database import fetch, fetchrow, execute
from services.payme import generate_payme_link
from config import config

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
            return None
        return json.loads(params.get("user", "{}"))
    except Exception:
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
    full_name: Optional[str] = None
    phone: Optional[str] = None
    inn: Optional[str] = None


class PaymentRequest(BaseModel):
    amount: int
    method: str


class AddExpenseRequest(BaseModel):
    amount: int
    category: str = "other"


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
    else:
        raise HTTPException(400, "Unknown payment method")

    execute(
        "INSERT INTO payments (user_tg_id, amount, method) VALUES (%s, %s, %s)",
        tg_id, body.amount, body.method,
    )

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
