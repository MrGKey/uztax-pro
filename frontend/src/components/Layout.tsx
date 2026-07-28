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
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        padding: "8px 0",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}
    >
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            flex: 1,
            textAlign: "center",
            textDecoration: "none",
            color: isActive ? "var(--btn)" : "var(--hint)",
            fontSize: 12,
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <div style={{ fontSize: 20, marginBottom: 2 }}>{l.icon}</div>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

const links = [
  { to: "/", icon: "🏠", label: "Главная" },
  { to: "/payment", icon: "💳", label: "Платёж" },
  { to: "/tax", icon: "💰", label: "Налог" },
  { to: "/expenses", icon: "🧾", label: "Расходы" },
  { to: "/profile", icon: "👤", label: "Профиль" },
];
