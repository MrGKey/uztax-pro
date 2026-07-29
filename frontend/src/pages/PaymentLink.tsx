import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { Icons } from "../utils/icons";
import { copyToClipboard } from "../utils/telegram";

const METHODS = [
  { id: "payme", label: "Payme", icon: "💚" },
  { id: "click", label: "Click", icon: "🔵" },
  { id: "uzum", label: "Uzum", icon: "🟣" },
];

export default function PaymentLink() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("payme");
  const [link, setLink] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const handleGenerate = async () => {
    const amt = parseInt(amount.replace(/\s/g, ""), 10);
    if (!amt || amt < 100) return;
    setLoading(true);
    try {
      const res = await api.generatePaymentLink(amt, method);
      setLink(res);
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
          <button className="header-back" onClick={() => setLink(null)}>{Icons.chevronLeft}</button>
          <h1 className="header-title">Ссылка создана</h1>
        </div>
        <div className="card card-primary stat" style={{ padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>{METHODS.find((m) => m.id === method)?.icon}</div>
          <div className="stat-value" style={{ fontSize: 30 }}>{fmt(amt)} so'm</div>
          <div className="stat-label" style={{ opacity: 0.6, marginTop: 6, textTransform: "none", fontSize: 13 }}>
            {METHODS.find((m) => m.id === method)?.label}
          </div>
        </div>
        <div className="card">
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, fontSize: 12, wordBreak: "break-all", marginBottom: 12, lineHeight: 1.5 }}>
            {link.url}
          </div>
          <button className="btn btn-gold" onClick={() => copyToClipboard(link.url)}>
            {Icons.copy} Скопировать ссылку
          </button>
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setLink(null)}>
            Создать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <button className="header-back" onClick={() => navigate("/")}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Ссылка на оплату</h1>
      </div>
      <div className="card">
        <div className="input-group">
          <label>Сумма (сум)</label>
          <input className="input input-lg" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="input-group" style={{ marginBottom: 10 }}>
          <label>Платёжная система</label>
        </div>
        <div className="method-grid">
          {METHODS.map((m) => (
            <button key={m.id} className={`method-btn${method === m.id ? " active" : ""}`} onClick={() => setMethod(m.id)}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <button className="btn" onClick={handleGenerate} disabled={loading || !amount || parseInt(amount) < 100}>
        {loading ? "Создание..." : "Создать ссылку"}
      </button>
    </div>
  );
}
