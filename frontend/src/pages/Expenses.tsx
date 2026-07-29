import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Expense } from "../utils/api";

const categories: Record<string, string> = {
  goods: "📦 Товары",
  rent: "🏢 Аренда",
  salary: "👥 Зарплата",
  tax: "📋 Налоги",
  other: "📌 Прочее",
};

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    api.expenses().then(setExpenses).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const amt = parseInt(amount, 10);
    if (!amt) return;
    try {
      const e = await api.addExpense(amt, category);
      setExpenses((prev) => [e, ...prev]);
      setShowForm(false);
      setAmount("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

  return (
    <div>
      <div className="header">
        <button className="header-back" onClick={() => navigate("/")}>←</button>
        <h1 className="header-title">Расходы</h1>
      </div>

      <div className="card stat card-primary">
        <div className="stat-label" style={{ color: "rgba(255,255,255,0.7)", textTransform: "none" }}>
          Всего расходов
        </div>
        <div className="stat-value" style={{ fontSize: 28, marginTop: 4 }}>{fmt(total)}</div>
      </div>

      {!showForm && (
        <button className="btn" onClick={() => setShowForm(true)} style={{ marginBottom: 12 }}>
          + Добавить расход
        </button>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="input-group">
            <label>Сумма</label>
            <input className="input input-lg" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Категория</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(categories).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={handleAdd} disabled={!amount} style={{ flex: 1 }}>Сохранить</button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card"><div className="skeleton skeleton-h24" /><div className="skeleton skeleton-h24" /></div>
      ) : expenses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <div className="empty-text">Расходов пока нет</div>
          <button className="btn btn-secondary" style={{ marginTop: 16, width: "auto" }} onClick={() => setShowForm(true)}>
            + Добавить первый расход
          </button>
        </div>
      ) : (
        expenses.map((e) => (
          <div key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{fmt(e.amount)}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                {(categories[e.category] || e.category)} · {new Date(e.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontSize: 24 }}>{
              { goods: "📦", rent: "🏢", salary: "👥", tax: "📋" }[e.category] || "📌"
            }</div>
          </div>
        ))
      )}
    </div>
  );
}
