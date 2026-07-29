import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { Icons, MethodIcons } from "../utils/icons";
import BottomSheet from "../components/BottomSheet";
import { copyToClipboard } from "../utils/telegram";

const METHODS = [
  { id: "payme", label: "Payme" },
  { id: "click", label: "Click" },
  { id: "uzum", label: "Uzum" },
];

export default function PaymentLink() {
  const navigate = useNavigate();
  const [showSheet, setShowSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("payme");
  const [link, setLink] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  useEffect(() => { if (showToast) { const t = setTimeout(() => setShowToast(false), 2000); return () => clearTimeout(t); } }, [showToast]);

  const handleGenerate = async () => {
    const amt = parseInt(amount.replace(/\s/g, ""), 10);
    if (!amt || amt < 100) return;
    setLoading(true);
    try {
      const res = await api.generatePaymentLink(amt, method);
      setLink(res);
      setShowSheet(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (link) {
    const amt = parseInt(amount.replace(/\s/g, ""), 10);
    return (
      <div>
        <div className="header">
          <button className="header-back" onClick={() => { setLink(null); setAmount(""); }}>{Icons.chevronLeft}</button>
          <h1 className="header-title">Ссылка создана</h1>
        </div>
        <div className="card card-primary stat" style={{ padding: 24 }}>
          <div className="link-result-icon">
            {MethodIcons[method]()}
          </div>
          <div className="stat-value-lg" style={{ fontSize: 30 }}>{fmt(amt)} so'm</div>
          <div className="stat-label" style={{ opacity: 0.6, marginTop: 8, textTransform: "none", fontSize: 13 }}>
            {METHODS.find((m) => m.id === method)?.label}
          </div>
        </div>
        <div className="card">
          <div style={{
            background: "var(--surface-alt)", borderRadius: 12, padding: 14,
            fontSize: 12, wordBreak: "break-all", marginBottom: 16,
            lineHeight: 1.5, fontFamily: "monospace", color: "var(--text-secondary)"
          }}>
            {link.url}
          </div>
          <button className="btn btn-gold" onClick={() => { copyToClipboard(link.url); setShowToast(true); }}>
            {Icons.check} Скопировано
          </button>
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => { setLink(null); setAmount(""); }}>
            Создать ещё
          </button>
        </div>
        {showToast && <div className="toast">Ссылка скопирована</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => navigate("/")}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Ссылка на оплату</h1>
      </div>

      <div className="card card-primary stat fade-in-d1" style={{ padding: 20 }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.6)", textTransform: "none", fontSize: 12, marginBottom: 4 }}>
          Создайте платёжную ссылку
        </div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          Клиент оплатит в один клик
        </div>
      </div>

      <div className="card fade-in-d2">
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>Платёжная система</label>
        </div>
        <div className="method-grid">
          {METHODS.map((m) => {
            const Icon = MethodIcons[m.id];
            return (
              <button key={m.id} className={`method-btn${method === m.id ? " active" : ""}`} onClick={() => setMethod(m.id)}>
                <Icon />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn fade-in-d3" onClick={() => setShowSheet(true)}>
        {Icons.payment} Указать сумму
      </button>

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label style={{ textAlign: "center", display: "block" }}>Сумма (сум)</label>
          <input
            className="input input-lg"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <button className="btn" onClick={handleGenerate} disabled={loading || !amount || parseInt(amount) < 100}>
          {loading ? "Создание..." : "Создать ссылку"}
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowSheet(false)}>
          Отмена
        </button>
      </BottomSheet>
    </div>
  );
}
