import { useEffect, useState } from 'react';

export function useSparkline(values: number[], width = 120, height = 32, max?: number): string {
  const [path, setPath] = useState('');
  useEffect(() => {
    if (!values.length) {
      setPath('');
      return;
    }
    const peak = max ?? Math.max(...values, 1);
    const step = width / Math.max(1, values.length - 1);
    const pts = values.map((v, i) => {
      const x = i * step;
      const y = height - (v / peak) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    setPath(`M ${pts.join(' L ')}`);
  }, [values, width, height, max]);
  return path;
}

export function Sparkline({
  values,
  color = '#3aa0ff',
  width = 120,
  height = 32,
  max,
  fill = true,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  max?: number;
  fill?: boolean;
}) {
  const path = useSparkline(values, width, height, max);
  if (!path) return <svg width={width} height={height} />;
  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  const id = `spark-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RadialGauge({
  value,
  size = 56,
  stroke = 5,
  color = '#3aa0ff',
  label,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-semibold text-ink-100">{Math.round(value * 100)}%</span>
        {label && <span className="text-[8px] uppercase tracking-wide text-ink-400">{label}</span>}
      </div>
    </div>
  );
}

export function UsageBar({
  used,
  total,
  color = 'bg-brand-500',
  height = 'h-1.5',
}: {
  used: number;
  total: number;
  color?: string;
  height?: string;
}) {
  const p = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className={`w-full ${height} rounded-full bg-white/[0.06] overflow-hidden`}>
      <div
        className={`${color} ${height} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
