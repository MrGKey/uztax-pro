import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { Icons } from "../utils/icons";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="header"><h1 className="header-title">Profil</h1></div>
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div className="skeleton skeleton-circle" style={{ width: 64, height: 64, margin: "0 auto 12px" }} />
          <div className="skeleton skeleton-h24 skeleton-w50" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <RegisterForm onDone={(u) => setUser(u)} />;
  }

  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => navigate("/")}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Profil</h1>
      </div>

      <div className="card fade-in-d1" style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
          color: "#0a0e1a",
          display: "flex", alignItems: "center", justifyContent: "center",
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
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: (u: User) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inn, setInn] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !inn) return;
    setSaving(true);
    try {
      const user = await api.updateProfile({ full_name: name, phone, inn } as User);
      onDone(user);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "40px 0 24px" }} className="fade-in">
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
          color: "#0a0e1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 16px",
          boxShadow: "0 2px 20px rgba(119,179,155,0.3)"
        }}>
          {Icons.profile}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>Ro'yxatdan o'tish</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
          IP ma'lumotlarini kiriting
        </p>
      </div>

      <div className="card fade-in-d1">
        <div className="input-group">
          <label>FIO</label>
          <input className="input" placeholder="Aliyev Aliy" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Telefon</label>
          <input className="input" placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="input-group">
          <label>STIR (INN)</label>
          <input className="input" placeholder="123456789" value={inn} onChange={(e) => setInn(e.target.value)} />
        </div>
      </div>

      <button className="btn fade-in-d2" onClick={handleSubmit} disabled={saving || !name || !phone || !inn}>
        {saving ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </div>
  );
}
