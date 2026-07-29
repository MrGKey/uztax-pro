import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User, type Payment } from "../utils/api";
import { Icons, ChartSparkline, PremiumHero } from "../utils/icons";
import PullToRefresh from "../components/PullToRefresh";
import { AnimatedNumber } from "../utils/useCountUp";
import { haptic, formatSum, formatDate } from "../utils/telegram";

const PAYMENT_METHODS: Record<string, { label: string; color: string }> = {
  payme: { label: "Payme", color: "#27AE60" },
  click: { label: "Click", color: "#0972D3" },
  uzum: { label: "Uzum", color: "#7B2FF7" },
};

const todayStr = new Date().toDateString();

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    if (!force) setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([api.auth(force), api.payments(force)]);
      setUser(u);
      setPayments(p);
    } catch {
      setError("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const todayPayments = payments.filter((p) => new Date(p.created_at).toDateString() === todayStr);
  const todayRevenue = todayPayments.reduce((s, p) => s + p.amount, 0);
  const monthlyRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const monthlyTax = Math.round(monthlyRevenue * 0.01);

  if (loading) {
    return (
      <div>
        <div className="header"><h1 className="header-title shimmer-card">UzTax Pro</h1></div>
        <div><div className="skeleton skeleton-block" style={{ height: 120 }} /></div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="skeleton skeleton-h60" />
          <div className="skeleton skeleton-h60" />
        </div>
        <div className="skeleton skeleton-h20" style={{ marginTop: 12, height: 40 }} />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <div className="header-avatar" style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
          color: "#0a0e1a", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0,
          boxShadow: "0 2px 12px rgba(119,179,155,0.3)"
        }}>
          {user ? user.full_name[0] : "U"}
        </div>
        <h1 className="header-title">UzTax Pro</h1>
      </div>

      {error && (
        <div className="error-banner fade-in" onClick={() => load()}>
          {error} — bosing qayta yuklash
        </div>
      )}

      <div className="hero-section fade-in-d1">
        <div className="hero-text">
          <h2>Assalomu alaykum,<br />{user ? user.full_name.split(" ")[0] : "tadbirkor"}!</h2>
          <p>{todayPayments.length > 0 ? `Bugun ${todayPayments.length} ta to'lov` : "Hali to'lovlar yo'q"}</p>
        </div>
        <PremiumHero />
      </div>

      <div className="card card-primary stat fade-in-d2" style={{ padding: 20, position: "relative" }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12 }}>
          Bugungi daromad
        </div>
        <div className="stat-value-lg" style={{ marginTop: 2 }}>
          <AnimatedNumber value={todayRevenue} />
        </div>
        {todayPayments.length > 0 && (
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, opacity: 0.5, fontWeight: 500 }}>
            {todayPayments.length} ta to'lov
          </div>
        )}
      </div>

      <div className="grid-2 fade-in-d3">
        <div className="card stat" style={{ position: "relative" }}>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            <AnimatedNumber value={monthlyRevenue} />
          </div>
          <div className="stat-label">Oylik</div>
        </div>
        <div className="card stat" style={{ position: "relative" }}>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {user ? <AnimatedNumber value={monthlyTax} /> : "—"}
          </div>
          <div className="stat-label">Soliq 1%</div>
        </div>
      </div>

      <div className="card fade-in-d4" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Daromad dinamikasi</span>
          <span style={{ color: "var(--primary)", display: "flex" }}>{Icons.trendingUp}</span>
        </div>
        <ChartSparkline />
      </div>

      {payments.length > 0 && (
        <div className="fade-in-d5">
          <div className="section-header" style={{ padding: "0 4px" }}>
            <span className="section-title">Oxirgi to'lovlar</span>
            <span className="section-link" onClick={() => { haptic("impact"); navigate("/payment"); }}>Barchasi</span>
          </div>
          <div className="card" style={{ padding: "4px 16px" }}>
            {payments.slice(0, 3).map((p, i) => (
              <div key={p.id} className="payment-item" style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
                <div className="payment-icon" style={{ background: `${PAYMENT_METHODS[p.method]?.color || "#566478"}15` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: PAYMENT_METHODS[p.method]?.color || "#566478" }}>
                    {p.method[0].toUpperCase()}
                  </span>
                </div>
                <div className="payment-info">
                  <div className="payment-amount">{formatSum(p.amount)}</div>
                  <div className="payment-meta">
                    {p.description || PAYMENT_METHODS[p.method]?.label || p.method}
                    {" · "}{formatDate(p.created_at)}
                  </div>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-success" : "badge-primary"}`} style={{ fontSize: 10 }}>
                  {p.status === "completed" ? "Bajarildi" : "Kutilmoqda"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions fade-in-d5" style={{ marginTop: 4 }}>
        <div className="quick-action" onClick={() => { haptic("impact"); navigate("/payment"); }}>
          {Icons.payment}
          <span>To'lov</span>
        </div>
        <div className="quick-action" onClick={() => { haptic("impact"); navigate("/tax"); }}>
          {Icons.tax}
          <span>Hisobot</span>
        </div>
        <div className="quick-action" onClick={() => { haptic("impact"); navigate("/expenses"); }}>
          {Icons.expense}
          <span>Xarajat</span>
        </div>
        <div className="quick-action" onClick={() => { haptic("impact"); navigate("/profile"); }}>
          {Icons.profile}
          <span>Profil</span>
        </div>
      </div>

      {refreshing && <div className="toast toast-refresh">Yangilanmoqda...</div>}
    </PullToRefresh>
  );
}
