export const Icons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  payment: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <circle cx="8" cy="15" r="1" />
    </svg>
  ),
  tax: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  expense: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  chevronLeft: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronDown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  trendingUp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export function ChartSparkline({ data }: { data?: number[] }) {
  const points = data || [40, 55, 48, 72, 65, 80, 75, 90, 85, 95, 88, 110];
  const max = Math.max(...points);
  const w = 200; const h = 40;
  const cx = (i: number) => (i / (points.length - 1)) * w;
  const cy = (v: number) => h - (v / max) * h;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i)},${cy(v)}`).join(' ');
  const fillD = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart-sparkline">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkFill)" className="spark-fill" />
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" className="spark-line" />
    </svg>
  );
}

export function BarChart({ months, data, color = "var(--primary)" }: { months: string[]; data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const w = 210; const h = 100;
  const barW = Math.max(16, (w - (months.length - 1) * 6) / months.length);
  const chartH = h - 20;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="bar-chart">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = (v / max) * chartH;
        const x = i * (barW + 6);
        const y = chartH - barH;
        return (
          <g key={i} className="bar-group">
            <rect x={x} y={y} width={barW} height={barH || 2} rx="4" fill={color} fillOpacity="0.7" className="bar-rect" />
            <rect x={x} y={y} width={barW} height={barH || 2} rx="4" fill="url(#barGrad)" className="bar-gradient-rect" />
          </g>
        );
      })}
      {months.map((m, i) => (
        <text key={i} x={i * (barW + 6) + barW / 2} y={h - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="inherit">
          {m}
        </text>
      ))}
    </svg>
  );
}

export function HeroIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" className="hero-illustration">
      <circle cx="100" cy="40" r="28" fill="var(--gold)" fillOpacity="0.08" />
      <circle cx="100" cy="40" r="18" fill="var(--gold)" fillOpacity="0.15" />
      <circle cx="100" cy="40" r="8" fill="var(--gold)" fillOpacity="0.4" />
      <rect x="6" y="20" width="32" height="44" rx="6" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.2" />
      <rect x="10" y="28" width="24" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.4" />
      <rect x="10" y="36" width="16" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.25" />
      <rect x="10" y="44" width="20" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.25" />
      <rect x="10" y="52" width="12" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.25" />
      <path d="M50 80 L60 52 L70 65 L80 35 L90 58 L100 42" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="100" cy="42" r="3" fill="var(--gold)" />
      <path d="M50 80 L60 52 L70 65 L80 35 L90 58 L100 42" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="2 4" opacity="0.4" />
      <rect x="116" y="28" width="18" height="36" rx="5" fill="var(--gold)" fillOpacity="0.12" stroke="var(--gold)" strokeWidth="1" />
      <rect x="120" y="40" width="10" height="2" rx="1" fill="var(--gold)" fillOpacity="0.35" />
      <rect x="120" y="46" width="7" height="2" rx="1" fill="var(--gold)" fillOpacity="0.35" />
    </svg>
  );
}

export function PaymeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="#27AE60" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">P</text>
    </svg>
  );
}

export function ClickIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="#0972D3" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">C</text>
    </svg>
  );
}

export function UzumIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="#7B2FF7" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">U</text>
    </svg>
  );
}

export const MethodIcons: Record<string, () => JSX.Element> = {
  payme: PaymeIcon,
  click: ClickIcon,
  uzum: UzumIcon,
};

export const CatIcons: Record<string, JSX.Element> = {
  goods: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  rent: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  salary: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  tax: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  other: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};
