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


class AuthDeps:
    async def __call__(self, x_telegram_init_data: str = Header("")) -> dict:
        if not x_telegram_init_data:
            raise HTTPException(401, "Unauthorized")
        user_data = await verify_init_data(x_telegram_init_data)
        if not user_data:
            raise HTTPException(401, "Invalid init data")
        return user_data


auth = AuthDeps()


async def verify_init_data(init_data: str) -> Optional[dict]:
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


async def get_or_create_user(tg_id: int, full_name: str = ""):
    user = await fetchrow("SELECT * FROM users WHERE tg_id = $1", tg_id)
    if user:
        return user
    await execute(
        "INSERT INTO users (tg_id, full_name, phone, inn) VALUES ($1, $2, '', '')",
        tg_id, full_name,
    )
    return await fetchrow("SELECT * FROM users WHERE tg_id = $1", tg_id)


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
async def auth_user(user_data: dict = Depends(auth)):
    return await get_or_create_user(
        user_data.get("id"), user_data.get("first_name", "")
    )


@router.get("/user")
async def get_profile(user_data: dict = Depends(auth)):
    return await get_or_create_user(
        user_data.get("id"), user_data.get("first_name", "")
    )


@router.put("/user")
async def update_profile(
    body: UpdateProfileRequest,
    user_data: dict = Depends(auth),
):
    tg_id = user_data.get("id")
    sets = []
    args = []
    if body.full_name is not None:
        sets.append(f"full_name = ${len(args) + 1}")
        args.append(body.full_name)
    if body.phone is not None:
        sets.append(f"phone = ${len(args) + 1}")
        args.append(body.phone)
    if body.inn is not None:
        sets.append(f"inn = ${len(args) + 1}")
        args.append(body.inn)
    if sets:
        args.append(tg_id)
        await execute(
            f"UPDATE users SET {', '.join(sets)} WHERE tg_id = ${len(args)}",
            *args,
        )
    return await fetchrow("SELECT * FROM users WHERE tg_id = $1", tg_id)


@router.post("/payment/generate")
async def generate_payment(
    body: PaymentRequest,
    user_data: dict = Depends(auth),
):
    tg_id = user_data.get("id")
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

    await execute(
        "INSERT INTO payments (user_tg_id, amount, method) VALUES ($1, $2, $3)",
        tg_id, body.amount, body.method,
    )

    return {"url": url, "amount": body.amount, "method": body.method}


@router.get("/report")
async def get_report(user_data: dict = Depends(auth)):
    tg_id = user_data.get("id")
    month_start = datetime.now(timezone.utc).replace(day=1).isoformat()

    payments = await fetch(
        "SELECT * FROM payments WHERE user_tg_id = $1 AND created_at >= $2",
        tg_id, month_start,
    )
    expenses = await fetch(
        "SELECT * FROM expenses WHERE user_tg_id = $1 AND created_at >= $2",
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
async def list_expenses(user_data: dict = Depends(auth)):
    tg_id = user_data.get("id")
    return await fetch(
        "SELECT * FROM expenses WHERE user_tg_id = $1 ORDER BY created_at DESC",
        tg_id,
    )


@router.post("/expenses")
async def add_expense(
    body: AddExpenseRequest,
    user_data: dict = Depends(auth),
):
    tg_id = user_data.get("id")
    row = await fetchrow(
        "INSERT INTO expenses (user_tg_id, amount, category) VALUES ($1, $2, $3) RETURNING *",
        tg_id, body.amount, body.category,
    )
    return row
