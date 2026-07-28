import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { copyToClipboard, formatSum } from "../utils/telegram";

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
    return (
      <div>
        <div className="topbar">
          <button className="back" onClick={() => setLink(null)}>←</button>
          <h1>Ссылка создана</h1>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 700 }}>
            {formatSum(parseInt(amount.replace(/\s/g, ""), 10))}
          </p>
          <p style={{ color: "var(--hint)", margin: "8px 0 16px" }}>
            {METHODS.find((m) => m.id === method)?.label}
          </p>
          <div
            style={{
              background: "var(--section)",
              borderRadius: 8,
              padding: 12,
              wordBreak: "break-all",
              fontSize: 12,
              marginBottom: 16,
              textAlign: "left",
            }}
          >
            {link.url}
          </div>
          <button className="btn" onClick={() => copyToClipboard(link.url)}>
            📋 Скопировать
          </button>
          <button
            className="btn"
            style={{ marginTop: 8, background: "var(--section)", color: "var(--text)" }}
            onClick={() => setLink(null)}
          >
            Создать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <button className="back" onClick={() => navigate("/")}>←</button>
        <h1>Ссылка на оплату</h1>
      </div>

      <div className="card">
        <label className="label">Сумма (сум)</label>
        <input
          className="input"
          type="number"
          placeholder="Например: 100000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="card">
        <label className="label">Платёжная система</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                flex: 1,
                padding: "12px 8px",
                border: `2px solid ${method === m.id ? "var(--btn)" : "var(--border)"}`,
                borderRadius: 10,
                background: method === m.id ? "var(--btn)" : "var(--card)",
                color: method === m.id ? "var(--btn-text)" : "var(--text)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn"
        onClick={handleGenerate}
        disabled={loading || !amount || parseInt(amount) < 100}
      >
        {loading ? "Создание..." : "🔗 Создать ссылку"}
      </button>
    </div>
  );
}
