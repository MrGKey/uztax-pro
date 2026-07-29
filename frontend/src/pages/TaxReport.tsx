import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Report } from "../utils/api";
import { Icons } from "../utils/icons";
const MONTHS_UZ = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
import { AnimatedNumber } from "../utils/useCountUp";
import { haptic } from "../utils/telegram";
import PullToRefresh from "../components/PullToRefresh";

export default function TaxReport() {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (!force) setLoading(true);
    try { const r = await api.report(force); setReport(r); } catch {} finally { if (!force) setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="header fade-in">
        <button className="header-back" onClick={() => { haptic("impact"); navigate("/"); }}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Soliq hisoboti</h1>
        <button className="btn btn-sm btn-ghost" onClick={() => { haptic("impact"); window.open(`${import.meta.env.VITE_API_URL || "https://uztax-pro.onrender.com"}/api/report/html`); }} style={{ width: "auto", padding: "8px 12px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          PDF
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

          {report && report.payment_count > 0 && (
            <div className="card fade-in-d4" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Oylik daromadlar
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Tahlil uchun yana {Math.max(0, 3 - Math.min(report.payment_count, 3))} oy ma'lumot kerak
              </div>
            </div>
          )}
        </>
      )}

      {refreshing && <div className="toast toast-refresh">Yangilanmoqda...</div>}
    </PullToRefresh>
  );
}
