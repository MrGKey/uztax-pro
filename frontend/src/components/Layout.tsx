import { NavLink, Outlet } from "react-router-dom";
import { useT } from "../utils/i18n";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { haptic } from "../utils/telegram";

const links = [
  { to: "/", icon: "🏠", key: "nav_home" },
  { to: "/payment", icon: "💳", key: "nav_pay" },
  { to: "/tax", icon: "📊", key: "nav_tax" },
  { to: "/expenses", icon: "📝", key: "nav_exp" },
  { to: "/profile", icon: "👤", key: "nav_prof" },
];

export default function Layout() {
  const { t } = useT();
  const online = useOnlineStatus();
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
            <div className="text-lg mb-0.5">{l.icon}</div>
            <div className="text-[10px]">{t(l.key)}</div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
