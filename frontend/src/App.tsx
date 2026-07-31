import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { retrieveLaunchParams, isTMA } from "@telegram-apps/sdk";
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
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soliqpay_theme");
      if (saved) { setIsDark(saved === "dark"); return; }
    } catch {}
    try {
      const lp = retrieveLaunchParams() as any;
      if (lp?.themeParams?.bgColor) setIsDark(true);
      if (isTMA()) document.documentElement.classList.add("tma");
    } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.matches) setIsDark(true);
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("soliqpay_theme")) setIsDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDark ? "dark" : "light";
}

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <div key={loc.pathname} className="fade-in">
      <Routes location={loc}>
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
  const theme = useTheme();
  const { seen, dismiss } = useOnboarding();
  return (
    <ErrorBoundary>
      <T>
        <div data-theme={theme} className="max-w-[420px] mx-auto px-4 pt-4">
          {!seen && <Onboarding onDone={dismiss} />}
          <AnimatedRoutes />
        </div>
      </T>
    </ErrorBoundary>
  );
}
