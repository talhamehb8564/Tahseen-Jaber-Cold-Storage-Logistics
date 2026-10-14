"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * ADMIN CHARTS (§28, §02 — Recharts)
 * ---------------------------------------------------------------------------
 * Client components: Recharts needs the DOM to measure. The pages that use them
 * stay server components and pass plain arrays down, so no data fetching happens
 * in the browser (§40 — the provider is server-only).
 *
 * Styling follows the console palette rather than Recharts defaults. Axes are
 * muted, gridlines are hairlines, and every series uses a cold colour — a report
 * screen that arrives in default Recharts blue looks like a template (§01).
 */

const AXIS = {
  stroke: "#a3aebe",
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.08em",
} as const;

const GRID = "#c8d1de";

const SERIES = ["#b66a3c", "#7e3e22", "#122033", "#22C55E", "#F59E0B"] as const;

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string | number }[];
  unit?: string;
}

/** Shared tooltip so every chart in the console reads the same way. */
function ChartTooltip({ active, payload, label, unit }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-[2px] border border-hull-line bg-midnight/95 px-3 py-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      {label != null ? (
        <p className="font-mono text-[0.5625rem] tracking-[0.14em] text-silver-dim uppercase">
          {label}
        </p>
      ) : null}
      <ul className="mt-1.5 space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-mono text-[0.5625rem] tracking-[0.1em] text-silver-dim uppercase">
              {entry.name}
            </span>
            <span className="tabular ml-auto font-mono text-[0.6875rem] text-frost">
              {typeof entry.value === "number" ? entry.value.toLocaleString("en-US") : entry.value}
              {unit ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==========================================================================
   TEMPERATURE HISTORY — multi-zone line chart
   ========================================================================== */

export interface TemperatureSeries {
  zoneCode: string;
  points: { at: string; temperatureC: number }[];
}

export function TemperatureHistoryChart({
  series,
  height = 280,
}: {
  series: readonly TemperatureSeries[];
  height?: number;
}) {
  if (series.length === 0) return <ChartEmpty height={height} label="No telemetry history" />;

  // Recharts needs one row per timestamp with a key per zone. The provider returns
  // hourly points aligned across zones, so the first series supplies the axis.
  const base = series[0]?.points ?? [];
  const data = base.map((point, index) => {
    const row: Record<string, number | string> = {
      at: new Date(point.at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: new Date(point.at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    series.forEach((entry) => {
      const value = entry.points[index]?.temperatureC;
      if (value != null) row[entry.zoneCode] = value;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -14 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="at" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={28} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value: number) => `${value}°`}
        />
        <Tooltip content={<ChartTooltip unit="°C" />} />
        <Legend
          wrapperStyle={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#64778d",
            paddingTop: 8,
          }}
        />
        {/* 0 °C reference — the line that matters in cold storage. */}
        <ReferenceLine y={0} stroke="#7e3e22" strokeOpacity={0.35} strokeDasharray="4 4" />

        {series.map((entry, index) => (
          <Line
            key={entry.zoneCode}
            type="monotone"
            dataKey={entry.zoneCode}
            stroke={SERIES[index % SERIES.length]}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   INQUIRY VOLUME — bar chart
   ========================================================================== */

export function InquiryVolumeChart({
  data,
  height = 240,
}: {
  data: readonly { period: string; count: number }[];
  height?: number;
}) {
  if (data.length === 0) return <ChartEmpty height={height} label="No inquiry history" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={[...data]} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(182,106,60,0.06)" }} />
        <Bar dataKey="count" name="Requests" radius={[2, 2, 0, 0]} maxBarSize={38}>
          {data.map((entry, index) => (
            <Cell
              key={entry.period}
              fill={index === data.length - 1 ? "#b66a3c" : "#afbed2"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   INVENTORY DISTRIBUTION — area chart by category
   ========================================================================== */

export function InventoryDistributionChart({
  data,
  height = 240,
}: {
  data: readonly { category: string; pallets: number }[];
  height?: number;
}) {
  if (data.length === 0) return <ChartEmpty height={height} label="No inventory recorded" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={[...data]}
          dataKey="pallets"
          nameKey="category"
          innerRadius="52%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={SERIES[index % SERIES.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip unit=" pallets" />} />
        <Legend
          wrapperStyle={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#64778d",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   UTILISATION TREND — area chart, tolerates null capacity
   ========================================================================== */

export function UtilisationTrendChart({
  data,
  height = 240,
}: {
  data: readonly { period: string; percent: number | null }[];
  height?: number;
}) {
  const known = data.filter((point) => point.percent != null);

  // §45 — if capacity was never confirmed there is no trend to draw. Saying so is
  // more useful than plotting a flat zero line that reads as "empty facility".
  if (known.length === 0) {
    return (
      <ChartEmpty
        height={height}
        label="Utilisation unavailable"
        detail="No confirmed capacity figures — see the Capacity screen."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={[...data]} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <defs>
          <linearGradient id="utilisationFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b66a3c" stopOpacity={0.42} />
            <stop offset="100%" stopColor="#b66a3c" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
        />
        <Tooltip content={<ChartTooltip unit="%" />} />
        <Area
          type="monotone"
          dataKey="percent"
          name="Utilisation"
          stroke="#b66a3c"
          strokeWidth={1.8}
          fill="url(#utilisationFill)"
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function ChartEmpty({
  height,
  label,
  detail,
}: {
  height: number;
  label: string;
  detail?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[2px] border border-dashed border-hull-line/70 bg-midnight/30 px-6 text-center"
      style={{ height }}
    >
      <p className="font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase">
        {label}
      </p>
      {detail ? (
        <p className="mt-2 max-w-xs text-[0.75rem] leading-relaxed text-silver-dim/75">{detail}</p>
      ) : null}
    </div>
  );
}
