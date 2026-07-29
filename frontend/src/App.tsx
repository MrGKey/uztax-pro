import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PaymentLink from "./pages/PaymentLink";
import TaxReport from "./pages/TaxReport";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import Onboarding, { useOnboarding } from "./components/Onboarding";

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try {
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.colorScheme) {
        setIsDark(WebApp.colorScheme === "dark");
        WebApp.ready();
        WebApp.expand();
        return;
      }
    } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDark ? "dark" : "light";
}

export default function App() {
  const colorScheme = useTheme();
  const { seen, dismiss } = useOnboarding();

  return (
    <div className="app" data-theme={colorScheme}>
      {!seen && <Onboarding onDone={dismiss} />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<PaymentLink />} />
          <Route path="/tax" element={<TaxReport />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}
