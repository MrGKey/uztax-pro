import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type User, type Payment } from "../utils/api";
import { AnimatedNumber } from "../utils/useCountUp";
import { useT } from "../utils/i18n";
import { haptic, formatSum, formatDate } from "../utils/telegram";

export default function Home() {
  const { t } = useT();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toDateString();

  useEffect(() => {
    Promise.all([api.auth(), api.payments()]).then(([u, p]) => { setUser(u); setPayments(p); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const todayPayments = payments.filter(p => new Date(p.created_at).toDateString() === todayStr);
  const todayRev = todayPayments.reduce((s, p) => s + p.amount, 0);
  const monthRev = payments.reduce((s, p) => s + p.amount, 0);
  const monthTax = Math.round(monthRev * 0.01);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-10 bg-surface-alt rounded-[16px] animate-pulse" />
      <div className="h-[200px] bg-surface-alt rounded-[24px] animate-pulse" />
      <div className="grid grid-cols-2 gap-4"><div className="h-[100px] bg-surface-alt rounded-[20px] animate-pulse" /><div className="h-[100px] bg-surface-alt rounded-[20px] animate-pulse" /></div>
    </div>
  );

  return (
    <div className="px-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-navy font-bold text-lg" style={{ boxShadow: "0 4px 12px rgba(245,158,11,0.25)" }}>{user ? user.full_name[0] : "S"}</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>SoliqPay</h1>
            <p className="text-xs text-text-secondary">{t("greets")}, {user?.full_name?.split(" ")[0] || "IP"}</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="clay-gold mb-4 fade-up-1" style={{ padding: "28px 24px" }}>
        <p className="text-sm opacity-70 font-medium mb-1">{t("home_today_revenue")}</p>
        <div className="text-4xl font-extrabold tracking-tight"><AnimatedNumber value={todayRev} /></div>
        <p className="text-xs mt-2 opacity-60">{todayPayments.length > 0 ? t("bugun", { n: todayPayments.length }) : t("home_no_payments")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 fade-up-2">
        <div className="clay text-center py-6">
          <div className="text-2xl font-bold text-primary"><AnimatedNumber value={monthRev} /></div>
          <p className="text-xs text-text-secondary mt-1">{t("home_monthly")}</p>
        </div>
        <div className="clay text-center py-6">
          <div className="text-2xl font-bold text-accent">{user ? <AnimatedNumber value={monthTax} /> : "—"}</div>
          <p className="text-xs text-text-secondary mt-1">{t("soliq_txt")} 1%</p>
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="fade-up-3 mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("home_recent")}</span>
            <button className="text-xs text-primary font-medium" onClick={() => { haptic("impact"); navigate("/payment"); }}>{t("home_all")} →</button>
          </div>
          <div className="clay py-2 px-4">
            {payments.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 py-3 ${i < 2 ? "border-b border-border" : ""}`}>
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <span className="text-xs font-bold text-primary">{p.method[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{formatSum(p.amount)}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{p.description || p.method} · {formatDate(p.created_at)}</div>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-success" : "badge-primary"}`}>✅</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-4 fade-up-4">
        {[
          { icon: "💳", label: t("nav_pay"), to: "/payment" },
          { icon: "📊", label: t("nav_tax"), to: "/tax" },
          { icon: "📝", label: t("nav_exp"), to: "/expenses" },
          { icon: "👤", label: t("nav_prof"), to: "/profile" },
        ].map((a) => (
          <button key={a.to} className="clay flex flex-col items-center gap-2 py-5 px-2 cursor-pointer border-none text-text-secondary text-xs font-medium transition-all active:scale-95"
            onClick={() => { haptic("impact"); navigate(a.to); }}>
            <span className="text-2xl">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
