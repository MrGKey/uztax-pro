import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { Icons } from "../utils/icons";
import { haptic, showConfirm, copyToClipboard } from "../utils/telegram";
import PullToRefresh from "../components/PullToRefresh";

const FAQs = [
  { q: "1% soliq qanday hisoblanadi?", a: "Barcha daromadlaringizning 1% miqdorida. Avtomatik hisoblanadi." },
  { q: "Qaysi to'lov tizimlari qo'llab-quvvatlanadi?", a: "Payme, Click, Uzum, Humo va Uzcard." },
  { q: "Xarajatlarni qanday qo'shish mumkin?", a: "Xarajatlar sahifasida '+' tugmasini bosing va summani kiriting." },
  { q: "Ma'lumotlarim xavfsizmi?", a: "Barcha ma'lumotlar Telegram orqali himoyalangan va shifrlangan." },
  { q: "Qanday qilib qo'llab-quvvatlash olish mumkin?", a: "@uztax_bot orqali yoki profil sahifasidagi feedback formasi." },
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const load = async (force = false) => {
    if (!force) setLoading(true);
    try { const u = await api.auth(force); setUser(u); } catch {} finally { if (!force) setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    haptic("impact");
    const ok = await showConfirm("Chiqishni tasdiqlaysizmi?");
    if (ok) {
      try { localStorage.removeItem("uztax_onboarded"); } catch {}
      window.location.reload();
    }
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    haptic("impact");
    try {
      const url = `${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/feedback`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: feedback }),
      }).catch(() => {});
      setFeedbackSent(true);
      setFeedback("");
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch {}
  };

  const referralLink = user ? `https://t.me/uztax_pro_bot?start=ref_${user.tg_id}` : "";

  if (loading) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="header"><h1 className="header-title">Profil</h1></div>
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div className="skeleton skeleton-circle" style={{ width: 64, height: 64, margin: "0 auto 12px" }} />
          <div className="skeleton skeleton-h24 skeleton-w50" style={{ margin: "0 auto" }} />
        </div>
      </PullToRefresh>
    );
  }

  if (!user) {
    return <RegisterForm onDone={(u) => setUser(u)} />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Profil</h1>
      </div>

      <div className="card fade-in-d1" style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
          color: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, margin: "0 auto 12px",
          boxShadow: "0 2px 16px rgba(119,179,155,0.3)"
        }}>
          {user.full_name[0]}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{user.full_name}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Yakka tartibdagi tadbirkor</div>
      </div>

      <div className="card fade-in-d2">
        <div className="row">
          <span className="row-label">Telefon</span>
          <span className="row-value">{user.phone || "—"}</span>
        </div>
        <div className="row">
          <span className="row-label">STIR (INN)</span>
          <span className="row-value">{user.inn || "—"}</span>
        </div>
        <div className="row">
          <span className="row-label">Balans</span>
          <span className="row-value" style={{ color: "var(--success)" }}>{user.balance.toLocaleString()} so'm</span>
        </div>
      </div>

      <div className="card sub-card fade-in-d3">
        <div className="row" style={{ border: "none" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gold)" }}>UzTax Pro</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Tarif: Free</div>
          </div>
          <span className="badge badge-gold">Bepul</span>
        </div>
      </div>

      <div className="card fade-in-d3" onClick={() => { haptic("impact"); window.open("https://soliq.uz"); }} style={{ cursor: "pointer" }}>
        <div className="row" style={{ border: "none" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>SOLIQ integratsiyasi</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Tez orada</div>
          </div>
          <span className="badge badge-primary">Kelmoqda</span>
        </div>
      </div>

      <div className="card fade-in-d4">
        <div className="section-header" style={{ marginBottom: 4 }}>
          <span className="section-title">Do'stlaringizni taklif eting</span>
        </div>
        <div className="settings-item" onClick={() => { haptic("impact"); copyToClipboard(referralLink); }} style={{ cursor: "pointer" }}>
          <div className="settings-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          </div>
          <span className="settings-label" style={{ fontSize: 12, wordBreak: "break-all" }}>{referralLink}</span>
          <span className="settings-arrow">{Icons.copy}</span>
        </div>
      </div>

      <div className="card fade-in-d4">
        <div className="section-header" style={{ marginBottom: 8 }}>
          <span className="section-title">Ko'p so'raladigan savollar</span>
        </div>
        {FAQs.map((faq, i) => (
          <div key={i}>
            <div className="settings-item" onClick={() => { haptic("impact"); setFaqOpen(faqOpen === i ? null : i); }} style={{ cursor: "pointer" }}>
              <span className="settings-label">{faq.q}</span>
              <span className={`settings-arrow`} style={{ transform: faqOpen === i ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>{Icons.chevronDown}</span>
            </div>
            {faqOpen === i && (
              <div style={{ padding: "0 0 12px 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card fade-in-d5">
        <div className="section-header" style={{ marginBottom: 8 }}>
          <span className="section-title">Feedback / Yordam</span>
        </div>
        {feedbackSent ? (
          <div style={{ textAlign: "center", padding: 16, color: "var(--success)", fontSize: 14, fontWeight: 600 }}>
            Raxmat! Xabaringiz yuborildi.
          </div>
        ) : (
          <>
            <textarea className="input" style={{ height: 80, resize: "none", fontSize: 14 }} placeholder="Savol yoki taklifingizni yozing..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={handleFeedback} disabled={!feedback.trim()}>
              Yuborish
            </button>
          </>
        )}
      </div>

        <div className="card fade-in-d4">
          <div className="section-header" style={{ marginBottom: 4 }}>
            <span className="section-title">Sozlamalar</span>
          </div>
          <div className="settings-item" onClick={() => { haptic("impact"); navigate("/legal"); }}>
            <div className="settings-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <span className="settings-label">Foydalanish shartlari</span>
            <span className="settings-arrow">{Icons.arrowRight}</span>
          </div>
          <div className="settings-item" onClick={() => { haptic("impact"); handleLogout(); }}>
          <div className="settings-icon" style={{ background: "rgba(248, 113, 113, 0.1)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span className="settings-label" style={{ color: "var(--danger)" }}>Chiqish</span>
          <span className="settings-arrow">{Icons.arrowRight}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "var(--text-muted)" }}>
        UzTax Pro v0.1.0
      </div>

      {refreshing && <div className="toast toast-refresh">Yangilanmoqda...</div>}
    </PullToRefresh>
  );
}

function RegisterForm({ onDone }: { onDone: (u: User) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inn, setInn] = useState("");
  const [saving, setSaving] = useState(false);

  const nameValid = name.length >= 3;
  const phoneValid = /^\+998\d{9}$/.test(phone);
  const innValid = /^\d{9}$/.test(inn);
  const canSubmit = nameValid && phoneValid && innValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    haptic("impact");
    try {
      const user = await api.updateProfile({ full_name: name, phone, inn } as User);
      haptic("success");
      onDone(user);
    } catch { haptic("error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "40px 0 24px" }} className="fade-in">
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
          color: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 16px",
          boxShadow: "0 2px 20px rgba(119,179,155,0.3)"
        }}>
          {Icons.profile}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>Ro'yxatdan o'tish</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>IP ma'lumotlarini kiriting</p>
      </div>

      <div className="card fade-in-d1">
        <div className="input-group">
          <label>FIO</label>
          <input className={`input${name && !nameValid ? " input-error" : ""}`}
            placeholder="Aliyev Aliy" value={name} onChange={(e) => setName(e.target.value)} />
          {name && !nameValid && <div className="input-error-text">Kamida 3 belgi</div>}
        </div>
        <div className="input-group">
          <label>Telefon</label>
          <input className={`input${phone && !phoneValid ? " input-error" : ""}`}
            placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phone && !phoneValid && <div className="input-error-text">Format: +998901234567</div>}
        </div>
        <div className="input-group">
          <label>STIR (INN)</label>
          <input className={`input${inn && !innValid ? " input-error" : ""}`}
            placeholder="123456789" value={inn} onChange={(e) => setInn(e.target.value)} />
          {inn && !innValid && <div className="input-error-text">9 ta raqam</div>}
        </div>
      </div>

      <button className="btn fade-in-d2" onClick={handleSubmit} disabled={saving || !canSubmit}>
        {saving ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </div>
  );
}
