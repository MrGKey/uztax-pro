import { NavLink, Outlet } from "react-router-dom";
import { useT } from "../utils/i18n";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { haptic } from "../utils/telegram";
import { Icons } from "../utils/icons";

export default function Layout() {
  const { t } = useT();
  const online = useOnlineStatus();
  const links = [
    { to: "/", icon: Icons.home, key: "nav_home" },
    { to: "/payment", icon: Icons.payment, key: "nav_pay" },
    { to: "/tax", icon: Icons.tax, key: "nav_tax" },
    { to: "/expenses", icon: Icons.expense, key: "nav_exp" },
    { to: "/profile", icon: Icons.profile, key: "nav_prof" },
  ];
  return (
    <div>
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-[250] bg-red-500 text-white text-center py-1.5 px-4 text-xs font-semibold" style={{ paddingTop: "calc(6px + env(safe-area-inset-top,0px))" }}>
          {t("offline_txt")}
        </div>
      )}
      <Outlet />
      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => haptic("impact")}>
            <div className="nav-icon">{l.icon}</div>
            <div>{t(l.key)}</div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
