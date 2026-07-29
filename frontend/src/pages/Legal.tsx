import { useNavigate } from "react-router-dom";
import { haptic } from "../utils/telegram";
import { Icons } from "../utils/icons";

export default function Legal() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/profile"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Foydalanish shartlari</h1>
      </div>
      <div className="card fade-in-d1" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
        <h3 style={{ color: "var(--text)", marginBottom: 8 }}>1. Umumiy qoidalar</h3>
        <p style={{ marginBottom: 12 }}>UzTax Pro — bu yakka tartibdagi tadbirkorlar uchun 1% soliqni avtomatik hisoblash va to'lov havolalarini yaratish vositasi.</p>

        <h3 style={{ color: "var(--text)", marginBottom: 8 }}>2. Ma'lumotlar xavfsizligi</h3>
        <p style={{ marginBottom: 12 }}>Barcha ma'lumotlar Telegram orqali himoyalangan. Ma'lumotlaringiz uchinchi shaxslarga uzatilmaydi.</p>

        <h3 style={{ color: "var(--text)", marginBottom: 8 }}>3. Mas'uliyat</h3>
        <p style={{ marginBottom: 12 }}>Ilova soliq hisob-kitoblarida yordam beradi, ammo yakuniy javobgarlik foydalanuvchiga tegishli.</p>

        <h3 style={{ color: "var(--text)", marginBottom: 8 }}>4. Aloqa</h3>
        <p>Savollar bo'yicha: @uzbtax_bot orqali feedback qoldiring.</p>
      </div>
      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "var(--text-muted)" }}>
        UzTax Pro v0.2.0
      </div>
    </div>
  );
}
