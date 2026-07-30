import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const dict: Record<string, Record<string, string>> = {
  uz: {
    app_name: "SoliqPay", greets: "Assalomu alaykum",
    home_no_payments: "Hali to'lovlar yo'q",
    home_today_revenue: "Bugungi daromad",
    home_monthly: "Oylik",
    home_chart: "Daromad dinamikasi",
    home_recent: "Oxirgi to'lovlar",
    home_all: "Barchasi",
    nav_home: "Bosh sahifa", nav_pay: "To'lov", nav_tax: "Soliq", nav_exp: "Xarajat", nav_prof: "Profil",
    offline_txt: "Internet yo'q — ma'lumotlar telefon saqlanadi",
    soliq_txt: "Soliq",
    error_loading: "Ma'lumotlarni yuklab bo'lmadi",
    error_retry: "bosing qayta yuklash",
    no_pay: "Hali to'lovlar yo'q",
    today_rev: "Bugungi daromad", oylik: "Oylik", soliq: "Soliq", dinamika: "Daromad dinamikasi",
    oxirgi: "Oxirgi to'lovlar", barchasi: "Barchasi", bugun: "Bugun {n} ta to'lov",
    title_pay: "To'lov havolasi", created: "Havola yaratildi", jami: "Jami to'lovlar",
    method: "To'lov tizimi", summani: "Summani kiriting", tarix: "To'lovlar tarixi",
    nusxa: "Nusxalandi", ulashish: "Ulashish", yangi: "Yangi havola", yaratish: "Havolani yaratish",
    bekor: "Bekor qilish", minimal: "Minimal summa 100 so'm", bajarildi: "Bajarildi",
    kutilmoqda: "Kutilmoqda", chek: "Чек", yana: "Yana ko'rsatish", tax_title: "Soliq hisoboti",
    daromad: "Daromad", soliq1: "1% soliq", xarajatlar: "Xarajatlar", sof: "Sof daromad",
    soni: "To'lovlar soni", pdf: "PDF", exp_title: "Xarajatlar", jami_x: "Jami xarajatlar",
    exp_empty: "Xarajatlar yo'q", birinchi: "Birinchi xarajat", saqlash: "Saqlash",
    izoh: "Izoh", kat: "Kategoriya", kat_bo: "Kategoriyalar bo'yicha",
    ochirildi: "Xarajat o'chirildi", qoshildi: "Xarajat qo'shildi", ovoz: "Ovozli kiritish",
    prof: "Profil", ip: "Yakka tartibdagi tadbirkor", tel: "Telefon", stir: "STIR (INN)",
    balans: "Balans", tarif: "Tarif", bepul: "Bepul", premium: "Premium",
    komissiya: "Komissiya (to'lovlar bo'yicha)", kom_desc: "Har bir to'lov havolasidan 0.5%",
    partner: "Partnerlik dasturi", ref: "Do'stlaringizni taklif eting",
    soliq_dek: "SOLIQ deklaratsiyasi", faq: "Ko'p so'raladigan savollar",
    feedback: "Feedback / Yordam", fb_sent: "Raxmat! Xabaringiz yuborildi.",
    sozlamalar: "Sozlamalar", shartnoma: "Foydalanish shartlari", eksport: "Eksport ma'lumotlarni",
    ochirish: "O'chirish ma'lumotlarni", chiqish: "Chiqish", rejim: "Soliq rejimi",
    valyuta: "Valyuta", tema: "Tema (dark / light)", til: "Til / Язык",
    bildirish: "Bildirishnomalar", bildirish_desc: "Напоминания о налоге и уведомления о платежах",
    kalendar: "Soliq kalendari", muddat: "To'lov muddati: 25-kungacha",
    reg_title: "Ro'yxatdan o'tish", reg_desc: "IP ma'lumotlarini kiriting",
    reg_btn: "Ro'yxatdan o'tish", offline: "Internet yo'q — ma'lumotlar telefon saqlanadi",
    yangilanmoqda: "Yangilanmoqda...",
    serv: "Xizmatlar — 1%", trade: "Savdo — 4%", manuf: "Ishlab chiqarish — 4%", itp: "IT-park — 0%",
  },
  ru: {
    app_name: "SoliqPay", greets: "Здравствуйте",
    home_no_payments: "Платежей пока нет",
    home_today_revenue: "Доход за сегодня",
    home_monthly: "За месяц",
    home_chart: "Динамика доходов",
    home_recent: "Последние платежи",
    home_all: "Все",
    nav_home: "Главная", nav_pay: "Платёж", nav_tax: "Налог", nav_exp: "Расходы", nav_prof: "Профиль",
    offline_txt: "Нет интернета — данные сохраняются",
    soliq_txt: "Налог",
    error_loading: "Не удалось загрузить данные",
    error_retry: "нажмите чтобы повторить",
    no_pay: "Платежей пока нет",
    today_rev: "Доход за сегодня", oylik: "За месяц", soliq: "Налог", dinamika: "Динамика доходов",
    oxirgi: "Последние платежи", barchasi: "Все", bugun: "Сегодня {n} пл.",
    title_pay: "Ссылка на оплату", created: "Ссылка создана", jami: "Всего платежей",
    method: "Платёжная система", summani: "Введите сумму", tarix: "История платежей",
    nusxa: "Скопировано", ulashish: "Поделиться", yangi: "Новая ссылка", yaratish: "Создать ссылку",
    bekor: "Отмена", minimal: "Минимум 100 so'm", bajarildi: "Выполнено",
    kutilmoqda: "Ожидается", chek: "Чек", yana: "Показать ещё", tax_title: "Налоговый отчёт",
    daromad: "Доход", soliq1: "Налог 1%", xarajatlar: "Расходы", sof: "Чистый доход",
    soni: "Кол-во платежей", pdf: "PDF", exp_title: "Расходы", jami_x: "Всего расходов",
    exp_empty: "Расходов нет", birinchi: "Первый расход", saqlash: "Сохранить",
    izoh: "Примечание", kat: "Категория", kat_bo: "По категориям",
    ochirildi: "Расход удалён", qoshildi: "Расход добавлен", ovoz: "Голосовой ввод",
    prof: "Профиль", ip: "Индивидуальный предприниматель", tel: "Телефон", stir: "ИНН",
    balans: "Баланс", tarif: "Тариф", bepul: "Бесплатно", premium: "Премиум",
    komissiya: "Комиссия (с платежей)", kom_desc: "0.5% с каждой ссылки",
    partner: "Партнёрская программа", ref: "Пригласить друзей",
    soliq_dek: "Декларация SOLIQ", faq: "Часто задаваемые вопросы",
    feedback: "Обратная связь", fb_sent: "Спасибо! Сообщение отправлено.",
    sozlamalar: "Настройки", shartnoma: "Пользовательское соглашение", eksport: "Экспорт данных",
    ochirish: "Удалить данные", chiqish: "Выйти", rejim: "Налоговый режим",
    valyuta: "Валюта", tema: "Тема (dark / light)", til: "Язык",
    bildirish: "Уведомления", bildirish_desc: "Напоминания о налоге и платежах",
    kalendar: "Налоговый календарь", muddat: "Срок: до 25-го числа",
    reg_title: "Регистрация", reg_desc: "Введите данные ИП",
    reg_btn: "Зарегистрироваться", offline: "Нет интернета — данные сохраняются",
    yangilanmoqda: "Обновление...",
    serv: "Услуги — 1%", trade: "Торговля — 4%", manuf: "Производство — 4%", itp: "IT-парк — 0%",
  },
};

type Lang = "uz" | "ru";
const Ctx = createContext<{ lang: Lang; t: (k: string, p?: Record<string,string|number>) => string } | null>(null);

export function T({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>("uz");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soliqpay_lang");
      if (saved === "uz" || saved === "ru") { set(saved); return; }
      const tgLang = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      if (tgLang === "uz" || tgLang === "ru") { set(tgLang); return; }
      if (tgLang?.startsWith("uz")) { set("uz"); return; }
      if (tgLang?.startsWith("ru")) { set("ru"); return; }
    } catch {}
  }, []);
  const t = (k: string, p?: Record<string,string|number>) => {
    let v = dict[lang]?.[k] ?? dict.uz[k] ?? k;
    if (p) for (const [k2, v2] of Object.entries(p)) v = v.replace(`{${k2}}`, String(v2));
    return v;
  };
  return <Ctx.Provider value={{ lang, t }}>{children}</Ctx.Provider>;
}
export function useT() { return useContext(Ctx) ?? { lang: "uz" as Lang, t: (k: string) => k }; }
