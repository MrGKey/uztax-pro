import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { Icons, MethodIcons } from "../utils/icons";
import BottomSheet from "../components/BottomSheet";
import { copyToClipboard, haptic } from "../utils/telegram";

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
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const parsedAmount = parseInt(amount.replace(/\s/g, ""), 10) || 0;
  const amountError = amount && (isNaN(parsedAmount) || parsedAmount < 100) ? "Minimal summa 100 so'm" : null;

  const handleGenerate = async () => {
    if (!parsedAmount || parsedAmount < 100) { showToast("Minimal summa 100 so'm"); return; }
    setLoading(true);
    haptic("impact");
    try {
      const res = await api.generatePaymentLink(parsedAmount, method);
      setLink(res);
      setShowSheet(false);
      haptic("success");
      showToast("Havola yaratildi");
    } catch (e: any) {
      showToast(e.message || "Xatolik");
      haptic("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!link) return;
    copyToClipboard(link.url);
    showToast("Havola nusxalandi");
  };

  if (link) {
    return (
      <div>
        <div className="header fade-in">
          <button className="header-back" onClick={() => { haptic("impact"); setLink(null); setAmount(""); }}>{Icons.chevronLeft}</button>
          <h1 className="header-title">Havola yaratildi</h1>
        </div>
        <div className="card card-primary stat fade-in-d1" style={{ padding: 24 }}>
          <div className="link-result-icon">
            {MethodIcons[method]()}
          </div>
          <div className="stat-value-lg" style={{ fontSize: 30 }}>{parsedAmount.toLocaleString()} so'm</div>
          <div className="stat-label" style={{ opacity: 0.6, marginTop: 8, textTransform: "none", fontSize: 13 }}>
            {METHODS.find((m) => m.id === method)?.label}
          </div>
        </div>
        <div className="card fade-in-d2">
          <div style={{
            background: "var(--surface-alt)", borderRadius: 12, padding: 14,
            fontSize: 12, wordBreak: "break-all", marginBottom: 16,
            lineHeight: 1.5, fontFamily: "monospace", color: "var(--text-secondary)"
          }}>
            {link.url}
          </div>
          <button className="btn btn-gold" onClick={handleCopy}>
            {Icons.check} Nusxalandi
          </button>
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => { haptic("impact"); setLink(null); setAmount(""); }}>
            Yangi havola
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">To'lov havolasi</h1>
      </div>

      <div className="card card-primary stat fade-in-d1" style={{ padding: 20 }}>
        <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12, marginBottom: 4 }}>
          To'lov havolasini yarating
        </div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          Mijoz bir bosishda to'laydi
        </div>
      </div>

      <div className="card fade-in-d2">
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>To'lov tizimi</label>
        </div>
        <div className="method-grid">
          {METHODS.map((m) => {
            const Icon = MethodIcons[m.id];
            return (
              <button key={m.id} className={`method-btn${method === m.id ? " active" : ""}`} onClick={() => { haptic("impact"); setMethod(m.id); }}>
                <Icon />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn fade-in-d3" onClick={() => { haptic("impact"); setShowSheet(true); }}>
        {Icons.payment} Summani kiriting
      </button>

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label style={{ textAlign: "center", display: "block" }}>Summa (so'm)</label>
          <input
            className={`input input-lg${amountError ? " input-error" : ""}`}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          {amountError && <div className="input-error-text">{amountError}</div>}
        </div>
        <button className="btn" onClick={handleGenerate} disabled={loading || !amount || !!amountError}>
          {loading ? "Yaratilmoqda..." : "Havolani yaratish"}
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { haptic("impact"); setShowSheet(false); }}>
          Bekor qilish
        </button>
      </BottomSheet>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
