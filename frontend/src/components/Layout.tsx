import { Outlet, NavLink } from "react-router-dom";
import { haptic } from "../utils/telegram";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { useT } from "../utils/i18n";
import { Icons } from "../utils/icons";

export default function Layout() {
  const { t } = useT();
  const online = useOnlineStatus();
  const links = [
    { to: "/", icon: Icons.home, label: t("nav_home") },
    { to: "/payment", icon: Icons.payment, label: t("nav_pay") },
    { to: "/tax", icon: Icons.tax, label: t("nav_tax") },
    { to: "/expenses", icon: Icons.expense, label: t("nav_exp") },
    { to: "/profile", icon: Icons.profile, label: t("nav_prof") },
  ];

  return (
    <div>
      {!online && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 250,
          background: "var(--danger)", color: "white", textAlign: "center",
          padding: "6px 16px", fontSize: 12, fontWeight: 600,
          paddingTop: "calc(6px + env(safe-area-inset-top, 0px))",
        }}>
          Internet yo'q — ma'lumotlar telefon saqlanadi
        </div>
      )}
      <Outlet />
      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => haptic("impact")}
          >
            <div className="nav-icon">{l.icon}</div>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
