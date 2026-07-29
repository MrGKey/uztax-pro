import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Report } from "../utils/api";
import { Icons, BarChart } from "../utils/icons";
import { AnimatedNumber } from "../utils/useCountUp";
import { haptic } from "../utils/telegram";
import PullToRefresh from "../components/PullToRefresh";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

export default function TaxReport() {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const r = await api.report(); setReport(r); } catch {} finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await api.report(true);
    await load(true);
    setRefreshing(false);
  };

  const monthLabel = monthOffset === 0
    ? "Joriy oy"
    : currentMonth.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });

  const barData = [80, 95, 70, 120, 110, 90, 130, 100, 115, 140];
  const barMonths = monthOffset === 0
    ? MONTHS.slice(0, 10)
    : ["1", "5", "10", "15", "20", "25", "30"];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Soliq hisoboti</h1>
      </div>

      <div className="month-selector fade-in-d1">
        <button className="month-nav" onClick={() => { haptic("impact"); setMonthOffset(Math.min(monthOffset + 1, 11)); }} disabled={monthOffset >= 11}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="month-current">{monthLabel}</span>
        <button className="month-nav" onClick={() => { haptic("impact"); setMonthOffset(Math.max(monthOffset - 1, 0)); }} disabled={monthOffset <= 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {loading ? (
        <div>
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-h40" style={{ marginTop: 12 }} />
        </div>
      ) : (
        <>
          <div className="card card-primary stat fade-in-d2" style={{ padding: 20 }}>
            <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12 }}>
              Daromad
            </div>
            <div className="stat-value-lg" style={{ marginTop: 4 }}>
              <AnimatedNumber value={report?.revenue ?? 0} />
            </div>
          </div>

          <div className="card fade-in-d3">
            <div className="row">
              <span className="row-label">1% soliq</span>
              <span className="row-value" style={{ color: "var(--danger)" }}>
                <AnimatedNumber value={report?.tax_1pct ?? 0} />
              </span>
            </div>
            <div className="row">
              <span className="row-label">Xarajatlar</span>
              <span className="row-value">
                <AnimatedNumber value={report?.expenses ?? 0} />
              </span>
            </div>
            <div className="divider" />
            <div className="row">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Sof daromad</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--success)" }}>
                <AnimatedNumber value={report?.net ?? 0} />
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="row">
                <span className="row-label">To'lovlar soni</span>
                <span className="badge badge-primary">{report?.payment_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="card fade-in-d4">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 500 }}>
              {monthOffset === 0 ? "Oylik daromadlar" : "Kunlik daromadlar"}
            </div>
            <BarChart months={barMonths} data={barData} color="var(--primary)" />
          </div>
        </>
      )}

      {refreshing && <div className="toast">Yangilanmoqda...</div>}
    </PullToRefresh>
  );
}
