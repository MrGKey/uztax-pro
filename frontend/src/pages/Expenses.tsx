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

const CATEGORY_LIST = Object.entries(categories);

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("other");
  const [toast, setToast] = useState("");
  const [listening, setListening] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [deleting, setDeleting] = useState<number | null>(null);
  const touchRef = useRef(0);
  const [swiping, setSwiping] = useState<number | null>(null);

  const autoCategory = (text: string) => {
    const t = text.toLowerCase();
    if (/ijara|ofis|bin|arenda|аренда|офис/i.test(t)) return "rent";
    if (/tovar|mahsulot|material|sotib|товар|материал/i.test(t)) return "goods";
    if (/maosh|oklad|ish.?haqi|qarzdor|зарплата|оклад/i.test(t)) return "salary";
    if (/soliq|solik|gos|nalog|налог|гос/i.test(t)) return "tax";
    return "other";
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("Voice not supported"); return; }
    const rec = new SpeechRecognition();
    rec.lang = "uz-UZ";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      const nums = text.replace(/[^0-9]/g, "");
      if (nums) setAmount(nums);
      const cat = autoCategory(text);
      setCategory(cat);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const load = async (force = false) => {
    if (!force) setLoading(true);
    try { const e = await api.expenses(force); setExpenses(e); } catch {} finally { if (!force) setLoading(false); }
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
      setShowSheet(false); setAmount("");
      haptic("success");
      showToast("Xarajat qo'shildi");
    } catch (e: any) { showToast(e.message || "Xatolik"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;
    setDeleting(id);
    haptic("warning");
    try {
      const el = document.getElementById(`exp-${id}`);
      el?.classList.add("expense-exit");
      await new Promise((r) => setTimeout(r, 250));
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast("Xarajat o'chirildi");
    } catch { showToast("O'chirib bo'lmadi"); }
    finally { setDeleting(null); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORY_LIST.map(([id, label]) => ({
    id, label,
    total: expenses.filter((e) => e.category === id).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter((e) => e.category === id).length,
  })).filter((c) => c.count > 0);

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
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>{expenses.length} ta xarajat</div>
      </div>

      {categoryTotals.length > 0 && (
        <div className="card fade-in-d2" style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Kategoriyalar bo'yicha
          </div>
          {categoryTotals.map((c) => {
            const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
            return (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{c.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatSum(c.total)}</span>
                </div>
                <div style={{ height: 4, background: "var(--surface-alt)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: 2, transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="fade-in-d3">
          <div className="card"><div className="skeleton skeleton-h24" /></div>
          <div className="card"><div className="skeleton skeleton-h24" /></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty fade-in-d3">
          <div className="empty-icon" style={{ opacity: 0.3 }}>{Icons.expense}</div>
          <div className="empty-text">Xarajatlar yo'q</div>
          <button className="btn btn-secondary" style={{ marginTop: 20, width: "auto" }} onClick={() => { haptic("impact"); setShowSheet(true); }}>
            {Icons.plus} Birinchi xarajat
          </button>
        </div>
      ) : (
        <div className="card fade-in-d3" style={{ padding: "4px 16px" }}>
          {expenses.map((e, i) => (
            <div
              key={e.id}
              id={`exp-${e.id}`}
              className={`expense-item ${deleting === e.id ? "expense-deleting" : ""}`}
              style={{ animationDelay: `${i * 0.04}s`, position: "relative", overflow: "hidden" }}
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
                if (swiping !== e.id) return;
                const dx = ev.changedTouches[0].clientX - touchRef.current;
                const el = document.getElementById(`exp-${e.id}`);
                if (dx < -60 && el) {
                  el.style.transform = "translateX(-80px)";
                  setTimeout(() => handleDelete(e.id), 200);
                } else { if (el) el.style.transform = ""; }
                setSwiping(null);
              }}
            >
              <div className="expense-icon">{CatIcons[e.category] || CatIcons.other}</div>
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="input input-lg" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus style={{ flex: 1 }} />
            <button className="btn btn-sm btn-ghost" onClick={() => { haptic("impact"); handleVoice(); }} style={{ padding: "12px", fontSize: 20, flexShrink: 0, borderRadius: "50%", height: 52, width: 52 }}>
              {listening ? "🔴" : "🎤"}
            </button>
          </div>
        </div>
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label>Izoh</label>
          <input className="input" placeholder="Masalan: ofis ijarasi" value={note} onChange={(e) => { setNote(e.target.value); const c = autoCategory(e.target.value); if (c !== "other") setCategory(c); }} />
        </div>
        <div className="input-group">
          <label>Kategoriya {note && <span style={{ color: "var(--primary)", fontSize: 11, fontWeight: 400 }}>(avtomat: {categories[autoCategory(note)]})</span>}</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_LIST.map(([id, label]) => (
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
