import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Report } from "../utils/api";
import { formatSum } from "../utils/telegram";

export default function TaxReport() {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .report()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <button className="back" onClick={() => navigate("/")}>←</button>
        <h1>Налоговый отчёт</h1>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--hint)", marginTop: 40 }}>
          Загрузка...
        </p>
      ) : (
        <>
          <div className="card stat">
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {formatSum(report?.revenue ?? 0)}
            </div>
            <div className="stat-label">Доход (месяц)</div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span>Налог 1%</span>
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>
                {formatSum(report?.tax_1pct ?? 0)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span>Расходы</span>
              <span style={{ fontWeight: 700 }}>{formatSum(report?.expenses ?? 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span>Чистый доход</span>
              <span style={{ fontWeight: 700 }}>{formatSum(report?.net ?? 0)}</span>
            </div>
          </div>

          <div className="card">
            <label className="label">Платежей за месяц</label>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{report?.payment_count ?? 0}</p>
          </div>
        </>
      )}
    </div>
  );
}
