import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { Icons, ChartSparkline } from "../utils/icons";

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
        <div className="card card-primary" style={{ padding: 24 }}>
          <div className="skeleton skeleton-h20 skeleton-w40" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="skeleton skeleton-h40" style={{ background: "rgba(255,255,255,0.2)", marginTop: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
          {user ? user.full_name[0] : "?"}
        </div>
        <h1 className="header-title">UzTax Pro</h1>
      </div>

      <div className="card card-primary stat" style={{ padding: 24 }}>
        <div className="stat-label" style={{ opacity: 0.7, textTransform: "none", fontSize: 13 }}>
          Сегодняшний доход
        </div>
        <div className="stat-value" style={{ fontSize: 34, marginTop: 4 }}>0 so'm</div>
      </div>

      <div className="grid-2">
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

      <div className="card" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Динамика доходов</span>
          <span style={{ color: "var(--primary)" }}>{Icons.trendingUp}</span>
        </div>
        <ChartSparkline />
      </div>

      <button className="btn" onClick={() => navigate("/payment")} style={{ marginTop: 4 }}>
        {Icons.payment} Новая платёжная ссылка
      </button>

      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/tax")}>
          {Icons.tax} Отчёт
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/expenses")}>
          {Icons.expense} Расходы
        </button>
      </div>
    </div>
  );
}
