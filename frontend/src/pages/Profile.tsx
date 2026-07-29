import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";

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
        <div className="header"><h1 className="header-title">Профиль</h1></div>
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px" }} />
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
      <div className="header">
        <button className="header-back" onClick={() => navigate("/")}>←</button>
        <h1 className="header-title">Профиль</h1>
      </div>

      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, margin: "0 auto 12px"
        }}>
          {user.full_name[0]}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{user.full_name}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>ИП</div>
      </div>

      <div className="card">
        <div className="row">
          <span className="row-label">📱 Телефон</span>
          <span className="row-value">{user.phone || "—"}</span>
        </div>
        <div className="row">
          <span className="row-label">🆔 STIR (ИНН)</span>
          <span className="row-value">{user.inn || "—"}</span>
        </div>
        <div className="row">
          <span className="row-label">💰 Баланс</span>
          <span className="row-value">{user.balance.toLocaleString()} so'm</span>
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
      <div style={{ textAlign: "center", padding: "40px 0 24px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 16px"
        }}>💼</div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Регистрация</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
          Введите данные вашего ИП
        </p>
      </div>

      <div className="card">
        <div className="input-group">
          <label>ФИО</label>
          <input className="input" placeholder="Иван Иванов" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Телефон</label>
          <input className="input" placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="input-group">
          <label>STIR (ИНН)</label>
          <input className="input" placeholder="123456789" value={inn} onChange={(e) => setInn(e.target.value)} />
        </div>
      </div>

      <button className="btn" onClick={handleSubmit} disabled={saving || !name || !phone || !inn}>
        {saving ? "Сохранение..." : "✅ Зарегистрироваться"}
      </button>
    </div>
  );
}
