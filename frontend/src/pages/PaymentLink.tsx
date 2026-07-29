import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Payment } from "../utils/api";
import { Icons, MethodIcons } from "../utils/icons";
import BottomSheet from "../components/BottomSheet";
import { copyToClipboard, haptic, formatSum, formatDateTime } from "../utils/telegram";
import { AnimatedNumber } from "../utils/useCountUp";

const METHODS = [
  { id: "payme", label: "Payme" },
  { id: "click", label: "Click" },
  { id: "uzum", label: "Uzum" },
  { id: "humo", label: "Humo" },
  { id: "uzcard", label: "Uzcard" },
];

const METHOD_COLORS: Record<string, string> = {
  payme: "#27AE60", click: "#0972D3", uzum: "#7B2FF7",
  humo: "#E31E24", uzcard: "#0066B3",
};

export default function PaymentLink() {
  const navigate = useNavigate();
  const [showSheet, setShowSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("payme");
  const [link, setLink] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => { api.payments().then(setPayments).catch(() => {}); }, []);

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
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
      api.payments(true).then(setPayments).catch(() => {});
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

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  if (link) {
    return (
      <div>
        <div className="header fade-in">
          <button className="header-back" onClick={() => { haptic("impact"); setLink(null); setAmount(""); }}>{Icons.chevronLeft}</button>
          <h1 className="header-title">Havola yaratildi</h1>
        </div>
        <div className="card card-primary stat fade-in-d1" style={{ padding: 24 }}>
          <div className="link-result-icon">{MethodIcons[method]()}</div>
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
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => { haptic("impact"); handleShare(link.url, parsedAmount, method); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Ulashish
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { haptic("impact"); setLink(null); setAmount(""); }}>
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
          Jami to'lovlar
        </div>
        <div className="stat-value-lg" style={{ marginTop: 4 }}>
          <AnimatedNumber value={totalRevenue} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>{payments.length} ta to'lov</div>
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

      {payments.length > 0 && (
        <div className="fade-in-d4" style={{ marginTop: 16 }}>
          <div className="section-header">
            <span className="section-title">To'lovlar tarixi</span>
          </div>
          <div className="card" style={{ padding: "4px 16px" }}>
            {payments.slice(0, 5).map((p, i) => (
              <div key={p.id} className="payment-item" style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
                <div className="payment-icon" style={{ background: `${METHOD_COLORS[p.method] || "#566478"}15` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: METHOD_COLORS[p.method] || "#566478" }}>
                    {p.method[0].toUpperCase()}
                  </span>
                </div>
                <div className="payment-info">
                  <div className="payment-amount">{formatSum(p.amount)}</div>
                  <div className="payment-meta">{formatDateTime(p.created_at)}</div>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-success" : "badge-primary"}`}>
                  {p.status === "completed" ? "Bajarildi" : "Kutilmoqda"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label style={{ textAlign: "center", display: "block" }}>Summa (so'm)</label>
          <input
            className={`input input-lg${amountError ? " input-error" : ""}`}
            type="number" placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
          />
          {amountError && <div className="input-error-text" style={{ textAlign: "center" }}>{amountError}</div>}
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

function handleShare(url: string, amount: number, method: string) {
  const text = `To'lov: ${amount.toLocaleString()} so'm (${method})\n${url}`;
  if (navigator.share) {
    navigator.share({ title: "To'lov havolasi", text, url });
  } else {
    navigator.clipboard.writeText(text).then(() => {});
  }
}
