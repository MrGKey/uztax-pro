import { Routes, Route, Navigate } from "react-router-dom";
import { useThemeParams } from "@telegram-apps/sdk-react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PaymentLink from "./pages/PaymentLink";
import TaxReport from "./pages/TaxReport";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";

export default function App() {
  const theme = useThemeParams();
  const colorScheme = theme.isDark ? "dark" : "light";

  return (
    <div className="app" data-theme={colorScheme}>
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
