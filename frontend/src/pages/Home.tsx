import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { Icons, ChartSparkline, HeroIllustration } from "../utils/icons";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="header"><h1 className="header-title">UzTax Pro</h1></div>
        <div>
          <div className="skeleton skeleton-block" />
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div className="skeleton skeleton-h40" />
            <div className="skeleton skeleton-h40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header fade-in">
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          color: "#1a1a1a", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0
        }}>
          {user ? user.full_name[0] : "?"}
        </div>
        <h1 className="header-title">UzTax Pro</h1>
      </div>

      <div className="hero-section fade-in-d1">
        <div className="hero-text">
          <h2>Добро пожаловать,<br />{user ? user.full_name.split(" ")[0] : "ИП"}!</h2>
          <p>Ваш налог 1% — на автопилоте</p>
        </div>
        <HeroIllustration />
      </div>

      <div className="card card-primary stat fade-in-d2" style={{ padding: 20 }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.6)", textTransform: "none", fontSize: 12 }}>
          Доход сегодня
        </div>
        <div className="stat-value-lg" style={{ marginTop: 2 }}>0 so'm</div>
      </div>

      <div className="grid-2 fade-in-d3">
        <div className="card stat">
          <div className="stat-value" style={{ color: "var(--success)" }}>0 so'm</div>
          <div className="stat-label">За месяц</div>
        </div>
        <div className="card stat">
          <div className="stat-value" style={{ color: !user ? "var(--text-secondary)" : "var(--warning)" }}>
            {user ? "0 so'm" : "—"}
          </div>
          <div className="stat-label">Налог 1%</div>
        </div>
      </div>

      <div className="card fade-in-d4" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Динамика доходов</span>
          <span style={{ color: "var(--primary)", display: "flex" }}>{Icons.trendingUp}</span>
        </div>
        <ChartSparkline />
      </div>

      <div className="quick-actions fade-in-d4">
        <div className="quick-action" onClick={() => navigate("/payment")}>
          {Icons.payment}
          <span>Ссылка</span>
        </div>
        <div className="quick-action" onClick={() => navigate("/tax")}>
          {Icons.tax}
          <span>Отчёт</span>
        </div>
        <div className="quick-action" onClick={() => navigate("/expenses")}>
          {Icons.expense}
          <span>Расходы</span>
        </div>
        <div className="quick-action" onClick={() => navigate("/profile")}>
          {Icons.profile}
          <span>Профиль</span>
        </div>
      </div>
    </div>
  );
}
