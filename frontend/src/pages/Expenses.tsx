import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Expense } from "../utils/api";
import { Icons, CatIcons } from "../utils/icons";
import BottomSheet from "../components/BottomSheet";
import { formatSum } from "../utils/telegram";

const categories: Record<string, string> = {
  goods: "Tovarlar",
  rent: "Ijara",
  salary: "Maosh",
  tax: "Soliq",
  other: "Boshqa",
};

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
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
      setShowSheet(false);
      setAmount("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => navigate("/")}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Xarajatlar</h1>
        <button className="btn btn-sm btn-ghost" onClick={() => setShowSheet(true)} style={{ width: "auto", padding: "8px 12px" }}>
          {Icons.plus}
        </button>
      </div>

      <div className="card card-primary stat fade-in-d1" style={{ padding: 20 }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12 }}>
          Jami xarajatlar
        </div>
        <div className="stat-value-lg" style={{ marginTop: 4 }}>{formatSum(total)}</div>
      </div>

      {loading ? (
        <div className="fade-in-d2">
          <div className="card"><div className="skeleton skeleton-h24" /></div>
          <div className="card"><div className="skeleton skeleton-h24" /></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty fade-in-d2">
          <div className="empty-icon" style={{ opacity: 0.3 }}>{Icons.expense}</div>
          <div className="empty-text">Xarajatlar yo'q</div>
          <button className="btn btn-secondary" style={{ marginTop: 20, width: "auto" }} onClick={() => setShowSheet(true)}>
            {Icons.plus} Birinchi xarajat
          </button>
        </div>
      ) : (
        <div className="card fade-in-d2" style={{ padding: "4px 16px" }}>
          {expenses.map((e, i) => (
            <div key={e.id} className="expense-item" style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
              <div className="expense-icon">
                {CatIcons[e.category] || CatIcons.other}
              </div>
              <div className="expense-info">
                <div className="expense-amount">{formatSum(e.amount)}</div>
                <div className="expense-meta">
                  {categories[e.category] || e.category}
                  {" · "}
                  {new Date(e.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                </div>
              </div>
              <span className="tag">{categories[e.category]?.slice(0, 4) || "..."}</span>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ textAlign: "center", display: "block" }}>Summa (so'm)</label>
          <input className="input input-lg" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
        <div className="input-group">
          <label>Kategoriya</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(categories).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={handleAdd} disabled={!amount}>
          {Icons.check} Saqlash
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowSheet(false)}>
          Bekor qilish
        </button>
      </BottomSheet>
    </div>
  );
}
