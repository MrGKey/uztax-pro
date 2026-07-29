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
      <path d={fillD} fill="url(#sparkFill)" />
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
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = (v / max) * chartH;
        const x = i * (barW + 6);
        const y = chartH - barH;
        return (
          <g key={i} className="bar-group">
            <rect x={x} y={y} width={barW} height={barH || 2} rx="4" fill={color} fillOpacity="0.6" className="bar-rect" />
            <rect x={x} y={y} width={barW} height={barH || 2} rx="4" fill="url(#barGrad)" className="bar-gradient-rect" />
          </g>
        );
      })}
      {months.map((m, i) => (
        <text key={i} x={i * (barW + 6) + barW / 2} y={h - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="Inter, sans-serif">
          {m}
        </text>
      ))}
    </svg>
  );
}

export function PremiumHero() {
  return (
    <svg width="150" height="130" viewBox="0 0 150 130" fill="none" className="hero-illustration">
      <defs>
        <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#77b39b" />
          <stop offset="100%" stopColor="#5a9a82" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9d898" />
          <stop offset="100%" stopColor="#f0c470" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(119,179,155,0.2)" />
          <stop offset="100%" stopColor="rgba(119,179,155,0.05)" />
        </linearGradient>
      </defs>

      {/* Glow behind */}
      <circle cx="90" cy="45" r="40" fill="url(#tealGrad)" fillOpacity="0.08" />
      <circle cx="90" cy="45" r="25" fill="url(#goldGrad)" fillOpacity="0.06" />

      {/* Stack of cards */}
      <rect x="16" y="46" width="34" height="44" rx="6" fill="url(#cardGrad)" stroke="var(--primary)" strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="12" y="40" width="34" height="44" rx="6" fill="var(--surface-alt)" stroke="var(--primary)" strokeWidth="0.8" strokeOpacity="0.2" />
      <rect x="8" y="34" width="34" height="44" rx="6" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.4" />
      {/* Lines on card */}
      <rect x="14" y="42" width="22" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.3" />
      <rect x="14" y="49" width="16" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.2" />
      <rect x="14" y="56" width="18" height="3" rx="1.5" fill="var(--primary)" fillOpacity="0.2" />
      {/* Gold accent on card */}
      <rect x="14" y="63" width="10" height="3" rx="1.5" fill="var(--gold)" fillOpacity="0.3" />

      {/* Chart line */}
      <path d="M54 65 L68 48 L80 58 L92 38 L104 52 L116 42" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M54 65 L68 48 L80 58 L92 38 L104 52 L116 42" stroke="url(#tealGrad)" strokeWidth="1.2" strokeLinecap="round" fill="none" strokeDasharray="2 3" opacity="0.5" />

      {/* End dot */}
      <circle cx="116" cy="42" r="4" fill="var(--gold)" />

      {/* Gold coin */}
      <circle cx="120" cy="68" r="14" fill="url(#goldGrad)" fillOpacity="0.15" stroke="var(--gold)" strokeWidth="0.8" strokeOpacity="0.3" />
      <circle cx="120" cy="68" r="10" fill="url(#goldGrad)" fillOpacity="0.1" />
      <text x="120" y="72" textAnchor="middle" fill="var(--gold)" fontSize="11" fontWeight="700" opacity="0.6">$</text>

      {/* Teal coin */}
      <circle cx="136" cy="58" r="10" fill="url(#tealGrad)" fillOpacity="0.12" stroke="var(--primary)" strokeWidth="0.8" strokeOpacity="0.3" />
      <text x="136" y="62" textAnchor="middle" fill="var(--primary)" fontSize="9" fontWeight="700" opacity="0.5">S</text>

      {/* Decorative dots */}
      <circle cx="4" cy="12" r="2" fill="var(--gold)" fillOpacity="0.15" />
      <circle cx="60" cy="8" r="1.5" fill="var(--primary)" fillOpacity="0.12" />
      <circle cx="140" cy="20" r="2.5" fill="var(--gold)" fillOpacity="0.1" />
      <circle cx="30" cy="28" r="1" fill="var(--primary)" fillOpacity="0.08" />
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
