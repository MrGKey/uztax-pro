import { Outlet, NavLink } from "react-router-dom";
import { haptic } from "../utils/telegram";
import { Icons } from "../utils/icons";

const links = [
  { to: "/", icon: Icons.home, label: "Bosh sahifa" },
  { to: "/payment", icon: Icons.payment, label: "To'lov" },
  { to: "/tax", icon: Icons.tax, label: "Soliq" },
  { to: "/expenses", icon: Icons.expense, label: "Xarajat" },
  { to: "/profile", icon: Icons.profile, label: "Profil" },
];

export default function Layout() {
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
