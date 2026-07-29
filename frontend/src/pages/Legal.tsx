import { useNavigate } from "react-router-dom";
import { haptic } from "../utils/telegram";
import { Icons } from "../utils/icons";

export default function Legal() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/profile"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Shartnoma va maxfiylik</h1>
      </div>

      <div className="card fade-in-d1" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
        <h3 style={{ color: "var(--text)", marginBottom: 8, fontSize: 15 }}>1. Umumiy qoidalar</h3>
        <p style={{ marginBottom: 12 }}>UzTax Pro — yakka tartibdagi tadbirkorlar uchun 1% soliqni hisoblash va to'lov havolalarini yaratish vositasi. Foydalanuvchi ushbu shartnomani qabul qilish orqali xizmatdan foydalanishni boshlaydi.</p>

        <h3 style={{ color: "var(--text)", marginBottom: 8, fontSize: 15 }}>2. Персональные данные</h3>
        <p style={{ marginBottom: 8 }}>В соответствии с Законом РУз «О персональных данных» (№ЗРУ-547 от 02.07.2019):</p>
        <ul style={{ marginLeft: 16, marginBottom: 12 }}>
          <li style={{ marginBottom: 4 }}>Собираемые данные: ФИО, телефон, ИНН, Telegram ID, данные о платежах и расходах</li>
          <li style={{ marginBottom: 4 }}>Цель обработки: расчёт налога 1%, создание платёжных ссылок, учёт доходов и расходов</li>
          <li style={{ marginBottom: 4 }}>Данные хранятся на защищённых серверах (Render, США/ЕС)</li>
          <li style={{ marginBottom: 4 }}>Срок хранения: до момента удаления аккаунта пользователем</li>
          <li style={{ marginBottom: 4 }}>Пользователь имеет право: получить свои данные, удалить их, отозвать согласие</li>
        </ul>

        <h3 style={{ color: "var(--text)", marginBottom: 8, fontSize: 15 }}>3. Права пользователя</h3>
        <ul style={{ marginLeft: 16, marginBottom: 12 }}>
          <li style={{ marginBottom: 4 }}>Право на доступ к своим данным (раздел «Экспорт данных» в профиле)</li>
          <li style={{ marginBottom: 4 }}>Право на удаление всех данных (раздел «Удалить данные» в профиле)</li>
          <li style={{ marginBottom: 4 }}>Право на отзыв согласия на обработку данных</li>
          <li style={{ marginBottom: 4 }}>Право на обжалование действий оператора в уполномоченный орган</li>
        </ul>

        <h3 style={{ color: "var(--text)", marginBottom: 8, fontSize: 15 }}>4. Меры защиты</h3>
        <ul style={{ marginLeft: 16, marginBottom: 12 }}>
          <li style={{ marginBottom: 4 }}>HTTPS шифрование всех данных при передаче</li>
          <li style={{ marginBottom: 4 }}>HMAC-верификация Telegram init data (предотвращение подделки запросов)</li>
          <li style={{ marginBottom: 4 }}>Параметризованные SQL-запросы (защита от SQL-инъекций)</li>
          <li style={{ marginBottom: 4 }}>Rate limiting: 30 запросов в минуту (защита от DDoS)</li>
          <li style={{ marginBottom: 4 }}>CORS ограничен доменом приложения</li>
          <li style={{ marginBottom: 4 }}>Пароли и токены не хранятся — используется Telegram авторизация</li>
        </ul>

        <h3 style={{ color: "var(--text)", marginBottom: 8, fontSize: 15 }}>5. Контакты</h3>
        <p style={{ marginBottom: 4 }}>По вопросам обработки данных: @uzbtax_bot (вкладка Feedback)</p>
        <p style={{ marginBottom: 12 }}>Уполномоченный орган: УзКомНазорат (uzkomnazorat.uz)</p>
      </div>

      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "var(--text-muted)" }}>
        UzTax Pro v0.2.0 · Последнее обновление: 2026
      </div>
    </div>
  );
}
