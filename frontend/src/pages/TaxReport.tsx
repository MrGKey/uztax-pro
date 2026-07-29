import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, type Report } from "../utils/api";
import { Icons, BarChart } from "../utils/icons";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt"];

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
      <div className="header fade-in">
        <button className="header-back" onClick={() => navigate("/")}>{Icons.chevronLeft}</button>
        <h1 className="header-title">Soliq hisoboti</h1>
      </div>

      {loading ? (
        <div>
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-h40" style={{ marginTop: 12 }} />
        </div>
      ) : (
        <>
          <div className="card card-primary stat fade-in-d1" style={{ padding: 20 }}>
            <div className="stat-label" style={{ color: "rgba(0,0,0,0.55)", textTransform: "none", fontSize: 12 }}>
              Oylik daromad
            </div>
            <div className="stat-value-lg" style={{ marginTop: 4 }}>
              {fmt(report?.revenue ?? 0)}
            </div>
          </div>

          <div className="card fade-in-d2">
            <div className="row">
              <span className="row-label">1% soliq</span>
              <span className="row-value" style={{ color: "var(--danger)" }}>
                {fmt(report?.tax_1pct ?? 0)}
              </span>
            </div>
            <div className="row">
              <span className="row-label">Xarajatlar</span>
              <span className="row-value">{fmt(report?.expenses ?? 0)}</span>
            </div>
            <div className="divider" />
            <div className="row">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Sof daromad</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--success)" }}>
                {fmt(report?.net ?? 0)}
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="row">
                <span className="row-label">To'lovlar soni</span>
                <span className="badge badge-primary">{report?.payment_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="card fade-in-d3">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 500 }}>
              Oylik daromadlar
            </div>
            <BarChart
              months={MONTHS}
              data={[80, 95, 70, 120, 110, 90, 130, 100, 115, 140]}
              color="var(--primary)"
            />
          </div>
        </>
      )}
    </div>
  );
}
