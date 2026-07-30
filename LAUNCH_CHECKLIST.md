# SoliqPay — User Lifecycle & Launch Checklist

## User Flow

```
                   ┌───────────────────────┐
                   │  @SoliqPay_bot        │
                   │  /start → открыть TMA  │
                   └──────────┬────────────┘
                              │
                   ┌──────────▼────────────┐
                   │  Onboarding           │
                   │  3 slides: налог,     │
                   │  платежи, расходы      │
                   │  → "Начать"            │
                   └──────────┬────────────┘
                              │
                   ┌──────────▼────────────┐
                   │  Profile              │
                   │  Form: ФИО, телефон,  │
                   │  ИНН, режим налога,   │
                   │  валюта + чекбокс     │
                   │  согласия на данные    │
                   └──────────┬────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Home             │
                    │  0 so'm пока нет  │
                    │  платежей          │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ To'lov   │        │ Xarajat  │        │ Hisobot  │
   │          │        │          │        │          │
   │ Выбрать  │        │ + расход │        │ 1% налог │
   │ Payme    │        │ голосом  │        │ PDF      │
   │ Сумму    │        │ или       │        │ Календарь│
   │ Ссылка   │        │ вручную  │        │          │
   └──────────┘        └──────────┘        └──────────┘
```

## User Lifecycle Stages

| Stage | Action | System |
|-------|--------|--------|
| **1. Discovery** | Находит бота через Telegram / referral | @SoliqPay_bot |
| **2. Activation** | Проходит онбординг, регистрируется | Profile form |
| **3. First Payment** | Создаёт первую платёжную ссылку | PaymentLink |
| **4. First Expense** | Добавляет первый расход | Expenses |
| **5. Tax Report** | Смотрит налог, скачивает PDF | TaxReport |
| **6. Premium** | Упирается в лимит 3 платежа → платит | Premium page |
| **7. Retention** | Напоминания 22/25 числа | Telegram Bot |
| **8. Referral** | Приводит друзей через партнёрскую ссылку | Partner program |

## Pre-launch Checklist

```diff
+ [x] Frontend builds without errors
+ [x] Backend responds {"status":"ok"}
+ [x] Bot @SoliqPay_bot active with 7 commands
+ [x] Onboarding → Profile redirect works
+ [x] Registration with consent checkbox
+ [x] Tax regime selection (1%/4%/0%)
+ [x] Payme, Click, Uzum, Humo, Uzcard
+ [x] Voice input for expenses
+ [x] Auto-categorization (uz/ru)
+ [x] Tax calendar with penalties
+ [x] PDF report generation
+ [x] Dark/light theme toggle
+ [x] Language selector (uz/ru)
+ [x] Push notifications (22nd/25th)
+ [x] Free limit: 3 payments/mo
+ [x] Premium: 25 Stars/mo
+ [x] Annual: 250 Stars/yr
+ [x] Commission: 1.5%
+ [x] Partner program: 20%
+ [x] Accountant API: $50/mo
+ [x] White-Label API
+ [x] SOLIQ submission endpoint
+ [x] Data export (GDPR)
+ [x] Data deletion (Закон РУз №547)
+ [x] Rate limiting (30/min)
+ [x] CSP, HSTS, CORS security
+ [x] Audit logging
+ [x] Pitch Deck (PDF)
+ [x] Company Overview (PDF)
+ [x] Profit Report
+ [x] Deploy Hook configured
```

## Revenue Model

```
Free (70-75%)     → 3 payments/mo → upgrade trigger
Premium (20-25%)  → $5/mo or $50/yr → 97% margin
Business (2-3%)   → $20/mo → multi-IP + SOLIQ API
Commission (all)  → 1.5% → from every payment
Accountant API    → $50/mo → B2B recurring
```

## Year 1 Projection

```
Goal: $384,000 ARR
Users: 1,000 → 30,000
Break-even: Day 1 ($2,268/mo from 1K users)
```

**Ready for launch. 🚀**
