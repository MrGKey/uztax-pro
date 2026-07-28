import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { formatSum } from "../utils/telegram";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.auth().then(setUser).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
        <h2>UzTax Pro</h2>
        <p style={{ color: "var(--hint)", margin: "12px 0 24px" }}>
          Учёт доходов, налог 1% и платёжные ссылки
        </p>
        <button className="btn" onClick={() => navigate("/profile")}>
          Начать
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar" style={{ marginTop: 8 }}>
        <h1>UzTax Pro</h1>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, color: "var(--hint)" }}>Доход сегодня</p>
        <p style={{ fontSize: 28, fontWeight: 700 }}>{formatSum(0)}</p>
      </div>

      <div className="grid-2">
        <div className="card stat">
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {formatSum(0)}
          </div>
          <div className="stat-label">Доход (месяц)</div>
        </div>
        <div className="card stat">
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {formatSum(0)}
          </div>
          <div className="stat-label">Налог 1%</div>
        </div>
      </div>

      <button className="btn" onClick={() => navigate("/payment")}>
        💳 Создать ссылку на оплату
      </button>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button
          className="btn"
          style={{ flex: 1, background: "var(--section)", color: "var(--text)" }}
          onClick={() => navigate("/tax")}
        >
          📊 Отчёт
        </button>
        <button
          className="btn"
          style={{ flex: 1, background: "var(--section)", color: "var(--text)" }}
          onClick={() => navigate("/expenses")}
        >
          🧾 Расходы
        </button>
      </div>
    </div>
  );
}
