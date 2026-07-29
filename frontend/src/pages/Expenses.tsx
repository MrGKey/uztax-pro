import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { api, type Expense } from "../utils/api";
import { Icons, CatIcons } from "../utils/icons";
import BottomSheet from "../components/BottomSheet";
import PullToRefresh from "../components/PullToRefresh";
import { formatSum, haptic } from "../utils/telegram";
import { AnimatedNumber } from "../utils/useCountUp";

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
  const [refreshing, setRefreshing] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const touchRef = useRef(0);
  const [swiping, setSwiping] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const e = await api.expenses();
      setExpenses(e);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const handleAdd = async () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt < 100) { showToast("Minimal summa 100 so'm"); return; }
    try {
      const e = await api.addExpense(amt, category);
      setExpenses((prev) => [e, ...prev]);
      setShowSheet(false);
      setAmount("");
      haptic("success");
      showToast("Xarajat qo'shildi");
    } catch (e: any) {
      showToast(e.message || "Xatolik");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    haptic("warning");
    try {
      const el = document.getElementById(`exp-${id}`);
      el?.classList.add("expense-exit");
      await new Promise((r) => setTimeout(r, 250));
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast("Xarajat o'chirildi");
    } catch {
      showToast("O'chirib bo'lmadi");
    } finally {
      setDeleting(null);
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Xarajatlar</h1>
        <button className="btn btn-sm btn-ghost" onClick={() => { haptic("impact"); setShowSheet(true); }} style={{ width: "auto", padding: "8px 12px" }}>
          {Icons.plus}
        </button>
      </div>

      <div className="card card-primary stat fade-in-d1" style={{ padding: 20 }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12 }}>
          Jami xarajatlar
        </div>
        <div className="stat-value-lg" style={{ marginTop: 4 }}><AnimatedNumber value={total} /></div>
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
          <button className="btn btn-secondary" style={{ marginTop: 20, width: "auto" }} onClick={() => { haptic("impact"); setShowSheet(true); }}>
            {Icons.plus} Birinchi xarajat
          </button>
        </div>
      ) : (
        <div className="card fade-in-d2" style={{ padding: "4px 16px" }}>
          {expenses.map((e, i) => (
            <div
              key={e.id}
              id={`exp-${e.id}`}
              className={`expense-item ${deleting === e.id ? "expense-deleting" : ""}`}
              style={{ animationDelay: `${i * 0.05}s`, position: "relative", overflow: "hidden" }}
              onTouchStart={(ev) => { touchRef.current = ev.touches[0].clientX; setSwiping(e.id); }}
              onTouchMove={(ev) => {
                if (swiping !== e.id) return;
                const dx = ev.touches[0].clientX - touchRef.current;
                if (dx < -30) {
                  const el = document.getElementById(`exp-${e.id}`);
                  if (el) el.style.transform = `translateX(${Math.max(-80, dx)}px)`;
                }
              }}
              onTouchEnd={(ev) => {
                const dx = ev.changedTouches[0].clientX - touchRef.current;
                const el = document.getElementById(`exp-${e.id}`);
                if (dx < -60 && el) {
                  el.style.transform = "translateX(-80px)";
                  setTimeout(() => handleDelete(e.id), 200);
                } else {
                  if (el) el.style.transform = "";
                }
                setSwiping(null);
              }}
            >
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
        <button className="btn" onClick={() => { haptic("impact"); handleAdd(); }} disabled={!amount || parseInt(amount) < 100}>
          {Icons.check} Saqlash
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { haptic("impact"); setShowSheet(false); }}>
          Bekor qilish
        </button>
      </BottomSheet>

      {toast && <div className="toast">{toast}</div>}
    </PullToRefresh>
  );
}
