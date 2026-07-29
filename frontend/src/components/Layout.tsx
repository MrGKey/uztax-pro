import { Outlet, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { Icons } from "../utils/icons";

const links = [
  { to: "/", icon: Icons.home, label: "Главная" },
  { to: "/payment", icon: Icons.payment, label: "Платёж" },
  { to: "/tax", icon: Icons.tax, label: "Налог" },
  { to: "/expenses", icon: Icons.expense, label: "Расходы" },
  { to: "/profile", icon: Icons.profile, label: "Профиль" },
];

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
