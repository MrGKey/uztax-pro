const API_BASE = import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com";

function offlineUser(): User {
  return {
    tg_id: 0,
    full_name: "Тестовый ИП",
    phone: "+998901234567",
    inn: "123456789",
    balance: 0,
  };
}

async function offlineRequest<T>(fallback: T): Promise<T> {
  return fallback;
}

async function initData(): Promise<string> {
  try {
    const WebApp = (window as any).Telegram?.WebApp;
    return WebApp?.initData || "";
  } catch {
    return "";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const data = await initData();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": data,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface User {
  tg_id: number;
  full_name: string;
  phone: string;
  inn: string;
  balance: number;
}

export interface Payment { id: number; amount: number; method: string; status: string; created_at: string; description?: string; }
export interface PaymentLink {
  url: string;
  amount: number;
  method: string;
}

export interface Report {
  revenue: number;
  tax_1pct: number;
  expenses: number;
  net: number;
  payment_count: number;
}

export interface Expense {
  id: number;
  amount: number;
  category: string;
  created_at: string;
}

const MOCK_USER = { tg_id: 0, full_name: "Damien Light", phone: "+998901234567", inn: "123456789", balance: 2068000 };
const MOCK_PAYMENTS: Payment[] = [
  { id: 1, amount: 432290, method: "payme", status: "completed", created_at: new Date(Date.now() - 1800000).toISOString(), description: "Zara" },
  { id: 2, amount: 128000, method: "click", status: "completed", created_at: new Date(Date.now() - 3600000).toISOString(), description: "Ben Wayne" },
  { id: 3, amount: 18000, method: "uzum", status: "completed", created_at: new Date(Date.now() - 86400000).toISOString(), description: "Subscription" },
];
const MOCK_EXPENSES: Expense[] = [
  { id: 1, amount: 350000, category: "other", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, amount: 238000, category: "goods", created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 3, amount: 58000, category: "rent", created_at: new Date(Date.now() - 259200000).toISOString() },
];

export const api = {
  auth: () => request<User>("/api/auth").catch(() => MOCK_USER),
  profile: () => request<User>("/api/user").catch(() => MOCK_USER),
  updateProfile: (data: Partial<User>) =>
    request<User>("/api/user", { method: "PUT", body: JSON.stringify(data) }).catch(() => ({ tg_id: 0, full_name: data.full_name || "", phone: data.phone || "", inn: data.inn || "", balance: 0 })),
  generatePaymentLink: (amount: number, method: string) =>
    request<PaymentLink>("/api/payment/generate", { method: "POST", body: JSON.stringify({ amount, method }) }).catch(() => ({ url: "https://payme.uz/12345", amount, method })),
  report: () => request<Report>("/api/report").catch(() => ({ revenue: 2068000, tax_1pct: 20680, expenses: 664000, net: 1387320, payment_count: 12 })),
  expenses: () => request<Expense[]>("/api/expenses").catch(() => MOCK_EXPENSES),
  addExpense: (amount: number, category: string) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify({ amount, category }) }).catch(() => ({ id: Date.now(), amount, category, created_at: new Date().toISOString() })),
  deleteExpense: (id: number) => request(`/api/expenses/${id}`, { method: "DELETE" }).catch(() => ({ ok: true })),
  payments: () => request<Payment[]>("/api/payments").catch(() => MOCK_PAYMENTS),
};
