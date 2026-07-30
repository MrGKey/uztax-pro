import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PaymentLink from "./pages/PaymentLink";
import TaxReport from "./pages/TaxReport";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import Legal from "./pages/Legal";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import { T } from "./utils/i18n";

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("soliqpay_theme") === "dark"; }
    catch { return true; }
  });
  useEffect(() => {
    try {
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.colorScheme && !localStorage.getItem("soliqpay_theme")) {
        setIsDark(WebApp.colorScheme === "dark");
      }
      WebApp?.ready();
      WebApp?.expand();
      WebApp?.enableClosingConfirmation?.();
    } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("soliqpay_theme")) setIsDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("soliqpay_theme", next ? "dark" : "light"); } catch {}
  };
  return { colorScheme: isDark ? "dark" : "light", isDark, toggleTheme };
}


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<PaymentLink />} />
          <Route path="/tax" element={<TaxReport />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  const { colorScheme, isDark, toggleTheme } = useTheme();
  const { seen, dismiss } = useOnboarding();

  return (
    <ErrorBoundary>
      <T>
        <div className="app" data-theme={colorScheme}>
          {!seen && <Onboarding onDone={dismiss} />}
          <AnimatedRoutes />
        </div>
      </T>
    </ErrorBoundary>
  );
}

export { useTheme };
