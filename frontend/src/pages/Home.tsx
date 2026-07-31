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

  useEffect(() => { api.auth().then(setUser).catch(() => {}); api.payments().then(setPayments).catch(() => {}).finally(() => setLoading(false)); }, []);

  const todayPayments = payments.filter(p => new Date(p.created_at).toDateString() === todayStr);
  const todayRevenue = todayPayments.reduce((s, p) => s + p.amount, 0);
  const monthlyRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const monthlyTax = Math.round(monthlyRevenue * 0.01);

  if (loading) return (
    <div className="space-y-3">
      <div className="h-8 bg-surface-alt rounded animate-pulse" />
      <div className="h-28 bg-surface-alt rounded-[16px] animate-pulse" />
      <div className="grid grid-cols-2 gap-3"><div className="h-20 bg-surface-alt rounded-[16px] animate-pulse" /><div className="h-20 bg-surface-alt rounded-[16px] animate-pulse" /></div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 py-3 mb-4 fade-in">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-navy text-base font-bold shrink-0">{user ? user.full_name[0] : "S"}</div>
        <h1 className="text-xl font-bold tracking-tight">SoliqPay</h1>
      </div>

      <div className="flex items-center gap-4 mb-4 fade-in-d1">
        <div>
          <h2 className="text-2xl font-bold">{t("greets")},<br />{user ? user.full_name.split(" ")[0] : "IP"}!</h2>
          <p className="text-sm text-text-secondary mt-1">{todayPayments.length > 0 ? t("bugun", { n: todayPayments.length }) : t("home_no_payments")}</p>
        </div>
      </div>

      <div className="card-primary rounded-[16px] p-5 mb-3 fade-in-d2">
        <div className="text-xs opacity-60 mb-1">{t("home_today_revenue")}</div>
        <div className="text-3xl font-extrabold"><AnimatedNumber value={todayRevenue} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 fade-in-d3">
        <div className="card text-center py-5"><div className="text-2xl font-bold text-success"><AnimatedNumber value={monthlyRevenue} /></div><div className="text-xs text-text-secondary mt-1">{t("home_monthly")}</div></div>
        <div className="card text-center py-5"><div className="text-2xl font-bold text-warning">{user ? <AnimatedNumber value={monthlyTax} /> : "—"}</div><div className="text-xs text-text-secondary mt-1">{t("soliq_txt")} 1%</div></div>
      </div>

      {payments.length > 0 && (
        <div className="fade-in-d4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{t("home_recent")}</span>
            <span className="text-xs text-primary font-medium cursor-pointer" onClick={() => { haptic("impact"); navigate("/payment"); }}>{t("home_all")}</span>
          </div>
          <div className="card py-1 px-4">
            {payments.slice(0, 3).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <span className="text-xs font-bold text-primary">{p.method[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{formatSum(p.amount)}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{p.description || p.method} · {formatDate(p.created_at)}</div>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-success" : "badge-primary"}`}>{p.status === "completed" ? "✅" : "⏳"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2.5 overflow-x-auto py-1 fade-in-d4 scrollbar-none">
        {[
          { icon: "💳", label: t("nav_pay"), to: "/payment" },
          { icon: "📊", label: t("nav_tax"), to: "/tax" },
          { icon: "📝", label: t("nav_exp"), to: "/expenses" },
          { icon: "👤", label: t("nav_prof"), to: "/profile" },
        ].map((a) => (
          <div key={a.to} className="flex flex-col items-center gap-2 py-4 px-6 bg-surface/80 backdrop-blur rounded-[16px] border border-border cursor-pointer text-text-secondary text-xs font-medium shrink-0 transition-all active:scale-95"
            onClick={() => { haptic("impact"); navigate(a.to); }}>
            <div className="text-xl text-primary">{a.icon}</div>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
