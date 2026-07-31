import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type User, type Payment } from "../utils/api";
import { Icons } from "../utils/icons";
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
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full sk" /><div className="flex-1"><div className="h-5 sk w-32 mb-2" /><div className="h-3 sk w-20" /></div></div>
      <div className="h-[200px] sk" />
      <div className="grid grid-cols-2 gap-4"><div className="h-[110px] sk" /><div className="h-[110px] sk" /></div>
      <div className="h-[150px] sk" />
    </div>
  );

  return (
    <div className="px-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 fu">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full pcard-teal flex items-center justify-center text-navy font-bold text-lg" style={{ padding: 0, boxShadow: "0 4px 16px rgba(119,179,155,0.3)" }}>{user ? user.full_name[0] : "S"}</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>SoliqPay</h1>
            <p className="text-xs text-text-secondary">{t("greets")}, {user?.full_name?.split(" ")[0] || "IP"}</p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="pcard-gold rounded-[22px] mb-4 fu-1" style={{ padding: "28px 24px" }}>
        <p className="text-sm opacity-60 font-medium mb-1">{t("home_today_revenue")}</p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 34, fontWeight: 600, letterSpacing: -1 }}><AnimatedNumber value={todayRev} /></div>
        <p className="text-xs mt-2 opacity-60">{todayPayments.length > 0 ? t("bugun", { n: todayPayments.length }) : t("home_no_payments")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 fu-2">
        <div className="pcard text-center" style={{ padding: "20px 12px" }}>
          <div className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-mono)" }}><AnimatedNumber value={monthRev} /></div>
          <p className="text-xs text-text-secondary mt-1">{t("home_monthly")}</p>
        </div>
        <div className="pcard text-center" style={{ padding: "20px 12px" }}>
          <div className="text-2xl font-bold text-gold" style={{ fontFamily: "var(--font-mono)" }}>{user ? <AnimatedNumber value={monthTax} /> : "—"}</div>
          <p className="text-xs text-text-secondary mt-1">{t("soliq_txt")} 1%</p>
        </div>
      </div>

      {/* Recent */}
      {payments.length > 0 && (
        <div className="fu-3 mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{t("home_recent")}</span>
            <button className="text-xs text-primary font-medium" onClick={() => { haptic("impact"); navigate("/payment"); }}>{t("home_all")} →</button>
          </div>
          <div className="pcard py-2 px-4">
            {payments.slice(0, 3).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 py-3 ${i < 2 ? "border-b border-border" : ""}`}>
                <div className="w-10 h-10 rounded-[12px] pcard-teal flex items-center justify-center shrink-0" style={{ padding: 0 }}>
                  <span className="text-xs font-bold text-navy">{p.method[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{formatSum(p.amount)}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{p.description || p.method} · {formatDate(p.created_at)}</div>
                </div>
                <span className="pbadge pbadge-success">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-4 fu-4">
        {[
          { icon: Icons.payment, label: t("nav_pay"), to: "/payment", color: "#77b39b" },
          { icon: Icons.tax, label: t("nav_tax"), to: "/tax", color: "#f9d898" },
          { icon: Icons.expense, label: t("nav_exp"), to: "/expenses", color: "#77b39b" },
          { icon: Icons.profile, label: t("nav_prof"), to: "/profile", color: "#f9d898" },
        ].map((a) => (
          <button key={a.to} className="pcard flex flex-col items-center gap-2 py-5 px-2 cursor-pointer border-none text-text-secondary text-xs font-medium transition-all active:scale-95" style={{ border: "1px solid var(--color-border)", padding: "20px 8px" }}
            onClick={() => { haptic("impact"); navigate(a.to); }}>
            <span style={{ color: a.color, display: "flex" }}>{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
