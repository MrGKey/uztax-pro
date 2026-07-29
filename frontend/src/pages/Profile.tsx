import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { api, type User } from "../utils/api";
import { Icons } from "../utils/icons";
import { haptic, showConfirm, copyToClipboard } from "../utils/telegram";
import PullToRefresh from "../components/PullToRefresh";

const TAX_REGIMES = [
  { id: "service", label: "Xizmatlar — 1%", desc: "Marketing, dizayn, konsalting" },
  { id: "trade", label: "Savdo — 4%", desc: "Chakana va ulgurji savdo" },
  { id: "manufacturing", label: "Ishlab chiqarish — 4%", desc: "Mahsulot ishlab chiqarish" },
  { id: "it", label: "IT-park — 0%", desc: "Rezidentlari IT parki" },
];

const CURRENCIES = [
  { code: "UZS", symbol: "so'm", rate: 1 },
  { code: "USD", symbol: "$", rate: 12700 },
  { code: "EUR", symbol: "€", rate: 13800 },
];

const FAQs = [
  { q: "1% soliq qanday hisoblanadi?", a: "Barcha daromadlaringizning 1% miqdorida. Avtomatik hisoblanadi." },
  { q: "Qaysi to'lov tizimlari qo'llab-quvvatlanadi?", a: "Payme, Click, Uzum, Humo va Uzcard." },
  { q: "Xarajatlarni qanday qo'shish mumkin?", a: "Xarajatlar sahifasida '+' tugmasini bosing va summani kiriting." },
  { q: "Ma'lumotlarim xavfsizmi?", a: "Barcha ma'lumotlar Telegram orqali himoyalangan va shifrlangan." },
  { q: "Qanday qilib qo'llab-quvvatlash olish mumkin?", a: "@uzbtax_bot orqali yoki profil sahifasidagi feedback formasi." },
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
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

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const clearAllData = async () => {
    haptic("impact");
    const ok = await showConfirm("Barcha ma'lumotlarni o'chirishni tasdiqlaysizmi?");
    if (ok) {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("uztax_"));
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {}
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    haptic("impact");
    const ok = await showConfirm("Chiqishni tasdiqlaysizmi?");
    if (ok) {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("uztax_"));
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {}
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

  const referralLink = user ? `https://t.me/uzbtax_bot?start=ref_${user.tg_id}` : "";

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

  const needsReg = user && (!user.phone || !user.inn || !user.full_name);
  if (!user || needsReg) {
    return <RegisterForm onDone={(u) => setUser(u)} />;
  }

  // Track first visit
  try {
    if (!localStorage.getItem("uztax_visited")) {
      localStorage.setItem("uztax_visited", "1");
      fetch(`${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/analytics/track`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  } catch {}

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
        <div className="row">
          <span className="row-label">Soliq rejimi</span>
          <select className="select" value={(user as any).tax_regime || "service"}
            onChange={async (e) => {
              haptic("impact");
              try {
                const u = await api.updateProfile({ ...user, tax_regime: e.target.value } as any);
                if (u) setUser(u);
              } catch {}
            }}
            style={{ fontSize: 13, padding: "6px 10px", width: "auto" }}
          >
            {TAX_REGIMES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <div className="row">
          <span className="row-label">Valyuta</span>
          <select className="select" value={(user as any).currency || "UZS"}
            onChange={async (e) => {
              haptic("impact");
              try {
                const u = await api.updateProfile({ ...user, currency: e.target.value } as any);
                if (u) setUser(u);
              } catch {}
            }}
            style={{ fontSize: 13, padding: "6px 10px", width: "auto" }}
          >
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
          </select>
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

      {/* Tax Calendar */}
      <TaxCalendarCard />

      {/* Strategy 1: Telegram Stars Premium */}
      <div className="card card-primary fade-in-d3" style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0e1a", marginBottom: 4 }}>UzTax Premium</div>
        <div style={{ fontSize: 13, color: "rgba(0,0,0,0.6)", marginBottom: 12 }}>
          Cheksiz to'lovlar · PDF · 0.5% komissiya
        </div>
        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginBottom: 8 }}>5 Telegram Stars / oy</div>
        <button className="btn" style={{ background: "#f9d898", color: "#0a0e1a", boxShadow: "0 4px 24px rgba(249,216,152,0.3)", width: "auto", display: "inline-flex" }}
          onClick={async () => {
            haptic("impact");
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/stars/purchase`, {
                method: "POST", headers: { "Content-Type": "application/json" },
              });
              const data = await res.json();
              if (data.ok && data.result) window.open(data.result);
              else showToast("Stars xarid qilish imkoniyati hozircha ishga tushirilmoqda");
            } catch { showToast("Xatolik yuz berdi"); }
          }}
        >
          ⭐ Premium olish
        </button>
      </div>

      {/* Push notifications */}
      <div className="card fade-in-d4" style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Bildirishnomalar</span>
          <label className="toggle-wrap" style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked onChange={async (e) => {
              const on = e.target.checked;
              haptic("impact");
              try { localStorage.setItem("uztax_notify", on ? "1" : "0"); } catch {}
            }} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: "absolute", inset: 0, borderRadius: 12, transition: "0.3s",
              background: "var(--surface-alt)", border: "1px solid var(--border)",
            }} />
            <span className="toggle-thumb" style={{
              position: "absolute", width: 18, height: 18, borderRadius: "50%", top: 3, left: 3,
              transition: "0.3s", background: "var(--text-muted)",
            }} />
          </label>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Напоминания о налоге и уведомления о платежах
        </div>
      </div>

      {/* Language selector */}
      <LangSelector />

      {/* Strategy 2: Commission info */}
      <div className="card fade-in-d4" style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Komissiya (to'lovlar bo'yicha)</span>
          <span className="badge badge-primary">0.5%</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Har bir to'lov havolasidan 0.5% — eng past komissiya bozorda
        </div>
      </div>

      {/* Strategy 3: Partner Program */}
      <div className="card fade-in-d4">
        <div className="section-header" style={{ marginBottom: 8 }}>
          <span className="section-title">Partnerlik dasturi</span>
        </div>
        <div className="settings-item" onClick={async () => {
          haptic("impact");
          const url = `${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/partner/stats`;
          try {
            const res = await fetch(url);
            const data = await res.json();
            showToast(`Taklif qilingan: ${data.referred} | Daromad: ${(data.earned || 0).toLocaleString()} so'm`);
          } catch { showToast("Ma'lumot olinmadi"); }
        }} style={{ cursor: "pointer" }}>
          <div className="settings-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <span className="settings-label">Mening partnerlik ma'lumotlarim</span>
          <span className="settings-arrow">{Icons.arrowRight}</span>
        </div>
        <div className="settings-item" onClick={async () => {
          haptic("impact");
          const url = `${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/partner/register`;
          try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
            const data = await res.json();
            if (data.referral_link) {
              copyToClipboard(data.referral_link);
              showToast("Partnerlik havolasi nusxalandi!");
            }
          } catch { showToast("Xatolik"); }
        }} style={{ cursor: "pointer" }}>
          <div className="settings-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          </div>
          <span className="settings-label">Partnerlik havolasini olish</span>
          <span className="settings-arrow">{Icons.arrowRight}</span>
        </div>
      </div>

      {/* Strategy 5: SOLIQ */}
      <div className="card fade-in-d4" onClick={async () => {
        haptic("impact");
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/soliq/submit`, {
            method: "POST", headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (data.ok) showToast(`Deklaratsiya topshirildi! Soliq: ${data.tax.toLocaleString()} so'm`);
          else showToast(data.detail || "Xatolik");
        } catch { showToast("SOLIQ hozircha ishga tushirilmoqda"); }
      }} style={{ cursor: "pointer" }}>
        <div className="row" style={{ border: "none" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>📋 SOLIQ deklaratsiyasi</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>1% soliqni avtomatik topshirish</div>
          </div>
          <span className="badge badge-primary">Sinov</span>
        </div>
      </div>

      {/* Referral */}
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
        <div className="settings-item" onClick={() => {
          haptic("impact");
          const root = document.querySelector(".app");
          if (root) {
            const cur = root.getAttribute("data-theme");
            const next = cur === "dark" ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try { localStorage.setItem("uztax_theme", next); } catch {}
          }
        }}>
          <div className="settings-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          </div>
          <span className="settings-label">Tema (dark / light)</span>
          <span className="settings-arrow">{Icons.arrowRight}</span>
        </div>
        <div className="settings-item" onClick={() => { haptic("impact"); navigate("/legal"); }}>
            <div className="settings-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <span className="settings-label">Foydalanish shartlari</span>
            <span className="settings-arrow">{Icons.arrowRight}</span>
          </div>
          <div className="settings-item" onClick={async () => {
            haptic("impact");
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/user/data-export`, {
                headers: { "Content-Type": "application/json" },
              });
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "uztax-data.json"; a.click();
              showToast("Ma'lumotlar yuklandi");
            } catch { showToast("Xatolik"); }
          }}>
            <div className="settings-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </div>
            <span className="settings-label">Eksport ma'lumotlarni</span>
            <span className="settings-arrow">{Icons.arrowRight}</span>
          </div>
          <div className="settings-item" onClick={() => { haptic("impact"); clearAllData(); }}>
            <div className="settings-icon" style={{ background: "rgba(248, 113, 113, 0.1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <span className="settings-label" style={{ color: "var(--danger)" }}>O'chirish ma'lumotlarni</span>
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
      {toast && <div className="toast">{toast}</div>}
    </PullToRefresh>
  );
}

function RegisterForm({ onDone }: { onDone: (u: User) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inn, setInn] = useState("");
  const [taxRegime, setTaxRegime] = useState("service");
  const [currency, setCurrency] = useState("UZS");
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);

  const nameValid = name.length >= 3;
  const phoneValid = /^\+998\d{9}$/.test(phone);
  const innValid = /^\d{9}$/.test(inn);
  const canSubmit = nameValid && phoneValid && innValid && consent;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    haptic("impact");
    try {
      const user = await api.updateProfile({ full_name: name, phone, inn, tax_regime: taxRegime, currency } as any);
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

        <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 12, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--success)" }}>Уважаемый пользователь!</strong><br />
          В соответствии с Законом РУз «О персональных данных» (№ЗРУ-547 от 02.07.2019), пожалуйста, подтвердите согласие.
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
          <div className="input-group">
            <label>Soliq rejimi</label>
            <select className="select" value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)}>
              {TAX_REGIMES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Valyuta</label>
            <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }} />
          Я согласен на обработку персональных данных согласно <span style={{ color: "var(--primary)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); window.location.href = "/#/legal"; }}>политике</span>
        </label>

        <button className="btn fade-in-d2" onClick={handleSubmit} disabled={saving || !canSubmit}>
        {saving ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </div>
  );
}

function TaxCalendarCard() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const deadline = 25;
  const daysLeft = deadline - day;

  return (
    <div className="card fade-in-d3">
      <div className="section-header" style={{ marginBottom: 8 }}>
        <span className="section-title">Soliq kalendari</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Oylik soliq to'lovi: {month}-oy
        </span>
        <span className={`badge ${daysLeft > 3 ? "badge-success" : daysLeft > 0 ? "badge-gold" : "badge-danger"}`}
          style={{ fontSize: 12 }}>
          {daysLeft > 0 ? `${daysLeft} kun qoldi` : daysLeft === 0 ? "Bugun" : `${-daysLeft} kun o'tgan`}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--surface-alt)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          height: "100%", width: `${Math.min(100, (day / deadline) * 100)}%`,
          background: daysLeft > 3 ? "var(--success)" : daysLeft > 0 ? "var(--warning)" : "var(--danger)",
          borderRadius: 2, transition: "width 0.6s"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
        <span>1-{month}-{today.getFullYear()}</span>
        <span>{deadline}-{month}-{today.getFullYear()}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
        {daysLeft > 0
          ? "To'lov muddati: 25-kungacha"
          : `Peni: 0.5% kuniga. ${-daysLeft} kun × 0.5% = ${(-daysLeft * 0.5).toFixed(1)}% qo'shimcha`}
      </div>
    </div>
  );
}

function LangSelector() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("uztax_lang") || "uz"; } catch { return "uz"; }
  });
  return (
    <div className="card fade-in-d4" style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Til / Язык</span>
        <select className="select" style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            try { localStorage.setItem("uztax_lang", e.target.value); } catch {}
            window.location.reload();
          }}>
          <option value="uz">O'zbekcha</option>
          <option value="ru">Русский</option>
        </select>
      </div>
    </div>
  );
}
