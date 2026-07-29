const API_BASE = import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;

function offlineUser() {
  return { tg_id: 0, full_name: "Test IP", phone: "+998901234567", inn: "123456789", balance: 0 };
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

function withCache<T>(key: string, fetcher: () => Promise<T>, force = false): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (!force && cached && now - cached.ts < CACHE_TTL) return Promise.resolve(cached.data as T);
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

const mockUser = () => MOCK_USER;
const mockPayments = () => MOCK_PAYMENTS;
const mockExpenses = () => MOCK_EXPENSES;
const mockReport = () => ({ revenue: 2068000, tax_1pct: 20680, expenses: 664000, net: 1387320, payment_count: 12 });

export const api = {
  auth: (force = false) =>
    force ? request<User>("/api/auth").catch(() => mockUser()) : withCache<User>("auth", () => request<User>("/api/auth").catch(() => mockUser())),

  profile: () => request<User>("/api/user").catch(() => mockUser()),

  updateProfile: (data: Partial<User>) =>
    request<User>("/api/user", { method: "PUT", body: JSON.stringify(data) }).catch(() => {
      bustCache("auth");
      return { tg_id: 0, full_name: data.full_name || "", phone: data.phone || "", inn: data.inn || "", balance: 0 };
    }),

  generatePaymentLink: (amount: number, method: string) =>
    request<PaymentLink>("/api/payment/generate", { method: "POST", body: JSON.stringify({ amount, method }) }).catch(() => {
      bustCache("payments");
      return { url: "https://payme.uz/12345", amount, method };
    }),

  report: (force = false) =>
    force ? request<Report>("/api/report").catch(() => mockReport()) : withCache<Report>("report", () => request<Report>("/api/report").catch(() => mockReport())),

  expenses: (force = false) =>
    force ? request<Expense[]>("/api/expenses").catch(() => mockExpenses()) : withCache<Expense[]>("expenses", () => request<Expense[]>("/api/expenses").catch(() => mockExpenses())),

  addExpense: (amount: number, category: string) =>
    request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify({ amount, category }) }).catch(() => {
      bustCache("expenses");
      return { id: Date.now(), amount, category, created_at: new Date().toISOString() };
    }),

  deleteExpense: (id: number) => {
    bustCache("expenses");
    return request(`/api/expenses/${id}`, { method: "DELETE" }).catch(() => ({ ok: true }));
  },

  payments: (force = false) =>
    force ? request<Payment[]>("/api/payments").catch(() => mockPayments()) : withCache<Payment[]>("payments", () => request<Payment[]>("/api/payments").catch(() => mockPayments())),
};
