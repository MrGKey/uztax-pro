import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type User } from "../utils/api";
import { showAlert } from "../utils/telegram";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .auth()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Загрузка...</p>;
  }

  if (!user) {
    return <RegisterForm onDone={(u) => setUser(u)} />;
  }

  return (
    <div>
      <div className="topbar">
        <button className="back" onClick={() => navigate("/")}>←</button>
        <h1>Профиль</h1>
      </div>

      <div className="card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>{user.full_name}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <Row label="Телефон" value={user.phone} />
          <Row label="STIR (ИНН)" value={user.inn} />
          <Row label="Баланс" value={`${user.balance.toLocaleString()} so'm`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ color: "var(--hint)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
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
      const user = await api.updateProfile({
        full_name: name,
        phone,
        inn,
      } as User);
      onDone(user);
    } catch (e: any) {
      showAlert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💼</div>
        <h2>Регистрация</h2>
        <p style={{ color: "var(--hint)", marginTop: 8 }}>
          Введите данные вашего ИП
        </p>
      </div>

      <div className="card">
        <label className="label">ФИО</label>
        <input
          className="input"
          placeholder="Иван Иванов"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="card">
        <label className="label">Телефон</label>
        <input
          className="input"
          placeholder="+998901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="card">
        <label className="label">STIR (ИНН)</label>
        <input
          className="input"
          placeholder="123456789"
          value={inn}
          onChange={(e) => setInn(e.target.value)}
        />
      </div>

      <button
        className="btn"
        onClick={handleSubmit}
        disabled={saving || !name || !phone || !inn}
      >
        {saving ? "Сохранение..." : "✅ Зарегистрироваться"}
      </button>
    </div>
  );
}
