import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Expense } from "../utils/api";
import { formatSum } from "../utils/telegram";

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    api
      .expenses()
      .then(setExpenses)
      .finally(() => setLoading(false));
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

  const categories = [
    { id: "goods", label: "Товары" },
    { id: "rent", label: "Аренда" },
    { id: "salary", label: "Зарплата" },
    { id: "tax", label: "Налоги" },
    { id: "other", label: "Прочее" },
  ];

  return (
    <div>
      <div className="topbar">
        <button className="back" onClick={() => navigate("/")}>←</button>
        <h1>Расходы</h1>
      </div>

      {!showForm && (
        <button
          className="btn"
          style={{ marginBottom: 12 }}
          onClick={() => setShowForm(true)}
        >
          + Добавить расход
        </button>
      )}

      {showForm && (
        <div className="card">
          <label className="label">Сумма</label>
          <input
            className="input"
            type="number"
            placeholder="Сумма в сум"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <label className="label" style={{ marginTop: 12 }}>
            Категория
          </label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn"
              onClick={handleAdd}
              disabled={!amount}
              style={{ flex: 1 }}
            >
              Сохранить
            </button>
            <button
              className="btn"
              style={{ flex: 1, background: "var(--section)", color: "var(--text)" }}
              onClick={() => setShowForm(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--hint)", textAlign: "center", marginTop: 20 }}>Загрузка...</p>
      ) : expenses.length === 0 ? (
        <p style={{ color: "var(--hint)", textAlign: "center", marginTop: 40 }}>
          Расходов пока нет
        </p>
      ) : (
        expenses.map((e) => (
          <div key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontWeight: 600 }}>{formatSum(e.amount)}</p>
              <p style={{ fontSize: 13, color: "var(--hint)" }}>
                {e.category} · {new Date(e.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
