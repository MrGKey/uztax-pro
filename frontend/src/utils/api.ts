const API_BASE = import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com";

const memCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;
const STORAGE_PREFIX = "uztax_cache_";

function saveToStorage(key: string, data: unknown) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch {}
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

function removeFromStorage(key: string) {
  try { localStorage.removeItem(STORAGE_PREFIX + key); } catch {}
}

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
  const cached = memCache.get(key);
  if (cached && now - cached.ts < CACHE_TTL) return Promise.resolve(cached.data as T);
  const stored = loadFromStorage<T>(key);
  if (stored !== null) {
    memCache.set(key, { data: stored, ts: now });
    return Promise.resolve(stored);
  }
  return fetcher().then((data) => {
    memCache.set(key, { data, ts: now });
    saveToStorage(key, data);
    return data;
  });
}

function bustCache(key: string) { memCache.delete(key); removeFromStorage(key); }

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

export const api = {
  auth: (force = false) => {
    const cached = loadFromStorage<User>("auth");
    if (!force && cached) {
      request<User>("/api/auth").then((u) => { saveToStorage("auth", u); }).catch(() => {});
      return Promise.resolve(cached);
    }
    return request<User>("/api/auth").then((u) => { saveToStorage("auth", u); return u; });
  },

  profile: () => request<User>("/api/user"),

  updateProfile: (data: Partial<User>) =>
    request<User>("/api/user", { method: "PUT", body: JSON.stringify(data) }).then((u) => {
      saveToStorage("auth", u);
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
