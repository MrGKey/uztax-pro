import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Report } from "../utils/api";

export default function TaxReport() {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.report().then(setReport).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

  return (
    <div>
      <div className="header">
        <button className="header-back" onClick={() => navigate("/")}>←</button>
        <h1 className="header-title">Налоговый отчёт</h1>
      </div>

      {loading ? (
        <div>
          <div className="card"><div className="skeleton skeleton-h40" /><div className="skeleton skeleton-h20 skeleton-w60" /></div>
          <div className="card"><div className="skeleton skeleton-h20" /><div className="skeleton skeleton-h20" /><div className="skeleton skeleton-h20" /></div>
        </div>
      ) : (
        <>
          <div className="card card-primary stat" style={{ padding: 24 }}>
            <div className="stat-label" style={{ color: "rgba(255,255,255,0.7)", textTransform: "none" }}>
              Доход за месяц
            </div>
            <div className="stat-value" style={{ fontSize: 30, marginTop: 4 }}>
              {fmt(report?.revenue ?? 0)}
            </div>
          </div>

          <div className="card card-stripe">
            <div className="row">
              <span className="row-label">Налог 1%</span>
              <span className="row-value" style={{ color: "var(--danger)" }}>
                {fmt(report?.tax_1pct ?? 0)}
              </span>
            </div>
            <div className="row">
              <span className="row-label">Расходы</span>
              <span className="row-value">{fmt(report?.expenses ?? 0)}</span>
            </div>
            <div className="divider" />
            <div className="row">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Чистый доход</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--success)" }}>
                {fmt(report?.net ?? 0)}
              </span>
            </div>
          </div>

          <div className="card card-stripe">
            <div className="row">
              <span className="row-label">Платежей за месяц</span>
              <span className="badge badge-primary">{report?.payment_count ?? 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
