const API_BASE = import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;

async function initData(): Promise<string> {
  try { return (window as any).Telegram?.WebApp?.initData || ""; }
  catch { return ""; }
}

async function request<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const data = await initData();
  for (let i = 0; i <= retries; i++) {
    try {
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
    } catch (err) {
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      else throw err;
    }
  }
  throw new Error("Request failed");
}

function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    cache.set(key, { data, ts: now });
    return data;
  });
}

function bustCache(key: string) { cache.delete(key); }

export interface User {
  tg_id: number;
  full_name: string;
  phone: string;
  inn: string;
  balance: number;
}

export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  description?: string;
}

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

const emptyUser: User = { tg_id: 0, full_name: "", phone: "", inn: "", balance: 0 };

export const api = {
  auth: (force = false) =>
    force
      ? request<User>("/api/auth")
      : withCache<User>("auth", () => request<User>("/api/auth")),

  profile: () => request<User>("/api/user"),

  updateProfile: (data: Partial<User>) =>
    request<User>("/api/user", { method: "PUT", body: JSON.stringify(data) }).then((u) => {
      bustCache("auth");
      return u;
    }),

  generatePaymentLink: (amount: number, method: string) =>
    request<PaymentLink>("/api/payment/generate", { method: "POST", body: JSON.stringify({ amount, method }) }).then((res) => {
      bustCache("payments");
      return res;
    }),

  report: (force = false) =>
    force
      ? request<Report>("/api/report")
      : withCache<Report>("report", () => request<Report>("/api/report")),

  expenses: (force = false) =>
    force
      ? request<Expense[]>("/api/expenses")
      : withCache<Expense[]>("expenses", () => request<Expense[]>("/api/expenses")),

  addExpense: (amount: number, category: string) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify({ amount, category }) }).then((e) => {
      bustCache("expenses");
      return e;
    }),

  deleteExpense: (id: number) => {
    bustCache("expenses");
    return request(`/api/expenses/${id}`, { method: "DELETE" });
  },

  payments: (force = false) =>
    force
      ? request<Payment[]>("/api/payments")
      : withCache<Payment[]>("payments", () => request<Payment[]>("/api/payments")),
};
