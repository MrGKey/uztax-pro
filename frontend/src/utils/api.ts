const API_BASE = import.meta.env.VITE_API_URL || "";

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
  auth: () => request<User>("/api/auth"),
  profile: () => request<User>("/api/user"),
  updateProfile: (data: Partial<User>) =>
    request<User>("/api/user", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  generatePaymentLink: (amount: number, method: string) =>
    request<PaymentLink>("/api/payment/generate", {
      method: "POST",
      body: JSON.stringify({ amount, method }),
    }),
  report: () => request<Report>("/api/report"),
  expenses: () => request<Expense[]>("/api/expenses"),
  addExpense: (amount: number, category: string) =>
    request<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify({ amount, category }),
    }),
};
