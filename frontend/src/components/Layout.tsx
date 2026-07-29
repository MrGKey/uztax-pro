import { Outlet, NavLink } from "react-router-dom";
import { useEffect } from "react";

export default function Layout() {
  useEffect(() => {
    try {
      const WebApp = (window as any).Telegram?.WebApp;
      WebApp?.ready();
      WebApp?.expand();
    } catch {}
  }, []);

  return (
    <div>
      <Outlet />
      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <div className="nav-icon">{l.icon}</div>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const links = [
  { to: "/", icon: "📊", label: "Главная" },
  { to: "/payment", icon: "💳", label: "Платёж" },
  { to: "/tax", icon: "💰", label: "Налог" },
  { to: "/expenses", icon: "🧾", label: "Расходы" },
  { to: "/profile", icon: "👤", label: "Профиль" },
];
