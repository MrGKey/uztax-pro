import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";

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
          <div className="skeleton skeleton-h24 skeleton-w50" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="skeleton skeleton-h48" style={{ background: "rgba(255,255,255,0.2)", marginTop: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>
          {user ? user.full_name[0] : "?"}
        </div>
        <h1 className="header-title">UzTax Pro</h1>
      </div>

      <div className="card card-primary stat" style={{ padding: 24 }}>
        <div className="stat-label" style={{ color: "rgba(255,255,255,0.7)", textTransform: "none", fontSize: 13 }}>
          Доход сегодня
        </div>
        <div className="stat-value" style={{ fontSize: 32, marginTop: 4 }}>
          0 so'm
        </div>
      </div>

      <div className="grid-2">
        <div className="card stat">
          <div className="stat-value" style={{ color: "var(--success)" }}>0 so'm</div>
          <div className="stat-label">За месяц</div>
        </div>
        <div className="card stat">
          <div className="stat-value" style={{ color: user ? "var(--danger)" : "var(--text-secondary)" }}>
            {user ? "0 so'm" : "—"}
          </div>
          <div className="stat-label">Налог 1%</div>
        </div>
      </div>

      <button className="btn" onClick={() => navigate("/payment")}>
        💳 Новая платёжная ссылка
      </button>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/tax")}>
          📊 Отчёт
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/expenses")}>
          🧾 Расходы
        </button>
      </div>
    </div>
  );
}
