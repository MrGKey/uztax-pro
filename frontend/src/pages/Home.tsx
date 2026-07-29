import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { Icons, ChartSparkline, PremiumHero } from "../utils/icons";
import PullToRefresh from "../components/PullToRefresh";
import { AnimatedNumber } from "../utils/useCountUp";
import { haptic } from "../utils/telegram";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const u = await api.auth();
      setUser(u);
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

  const todayRevenue = 0;
  const monthlyRevenue = 0;
  const monthlyTax = 0;

  if (loading) {
    return (
      <div>
        <div className="header"><h1 className="header-title">UzTax Pro</h1></div>
        <div>
          <div className="skeleton skeleton-block" style={{ height: 100 }} />
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div className="skeleton skeleton-h40" />
            <div className="skeleton skeleton-h40" />
          </div>
          <div className="skeleton skeleton-h20" style={{ marginTop: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <div style={{
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
          <p>1% soliq avtomatik hisoblanadi</p>
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

      <div className="quick-actions fade-in-d4">
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

      {refreshing && <div className="toast">Yangilanmoqda...</div>}
    </PullToRefresh>
  );
}
