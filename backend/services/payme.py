from config import config


def generate_payme_link(amount: int, order_id: str) -> str:
    amt = amount * 100
    return (
        f"https://payme.uz/pay/{config.payme_merchant_id}"
        f"?amount={amt}&order_id={order_id}"
    )
