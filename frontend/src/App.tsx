import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import Layout from "./components/Layout";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import { T } from "./utils/i18n";

const Home = lazy(() => import("./pages/Home"));
const PaymentLink = lazy(() => import("./pages/PaymentLink"));
const TaxReport = lazy(() => import("./pages/TaxReport"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Profile = lazy(() => import("./pages/Profile"));
const Legal = lazy(() => import("./pages/Legal"));

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
          <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}><AnimatedRoutes /></Suspense>
        </div>
      </T>
    </ErrorBoundary>
  );
}
