import { useState } from "react";
import { useT } from "../utils/i18n";
import { haptic } from "../utils/telegram";

const TAX_REGIMES = [
  { id: "service", labelKey: "serv" },
  { id: "trade", labelKey: "trade" },
  { id: "manufacturing", labelKey: "manuf" },
  { id: "it", labelKey: "itp" },
];

export function useOnboarding() {
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem("soliqpay_onboarded") === "1"; } catch { return false; } });
  const dismiss = () => { try { localStorage.setItem("soliqpay_onboarded", "1"); } catch {}; setSeen(true); };
  return { seen, dismiss };
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-[200] bg-navy flex flex-col justify-between p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-7xl font-black mb-4" style={{ background: "linear-gradient(135deg,#f9d898,#e8b84a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>S</div>
        <h1 className="text-3xl font-bold mb-2">SoliqPay</h1>
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed">{t("reg_desc")}</p>
      </div>
      <div className="mt-6">
        <button className="btn btn-gold" onClick={() => { haptic("impact"); onDone(); }}>{t("reg_btn")}</button>
      </div>
    </div>
  );
}
