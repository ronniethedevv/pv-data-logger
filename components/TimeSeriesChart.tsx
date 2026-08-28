"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatHm, formatMonthDayTime, isSameDay } from "@/lib/utils";

export type ChartPoint = { t: number } & Record<string, number>;

export type ChartSeries = {
  key: string;
  name: string;
  color: string;
  /** Which Y-axis this series binds to. Defaults to "left". */
  axis?: "left" | "right";
  /** Per-series overrides for the tooltip; fall back to chart-level props. */
  unit?: string;
  precision?: number;
};

type TimeSeriesChartProps = {
  data: ChartPoint[];
  series: ChartSeries[];
  variant?: "area" | "line";
  unit?: string;
  height?: number;
  /** Decimal places shown in the tooltip. */
  precision?: number;
  /** Render a marker at every data point so individual samples are visible. */
  showDots?: boolean;
};

const GRID = "#F1F5F9"; // slate-100
const AXIS = "#64748B"; // slate-500
const AREA_FILL = "#DBEAFE"; // blue-100

/** Add 10% headroom above the data max so lines never touch the top edge. */
function withHeadroom(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1;
  return max * 1.1;
}

/**
 * Whether the window crosses a calendar day. Checked by date rather than by
 * duration, since even a 12 h window straddling midnight needs dated labels to
 * be unambiguous.
 */
function spansMultipleDays(data: ChartPoint[]): boolean {
  if (data.length < 2) return false;
  return !isSameDay(data[0].t, data[data.length - 1].t);
}

export function TimeSeriesChart({
  data,
  series,
  variant = "line",
  unit,
  height = 280,
  precision = 1,
  showDots = false,
}: TimeSeriesChartProps) {
  const multiDay = spansMultipleDays(data);
  // Axis ticks stay compact; the tooltip carries the date when the window
  // crosses midnight, so a hovered point is never ambiguous about its day.
  const xFormatter = (t: number) => formatHm(t);
  const tooltipFormatter = (t: number) => (multiDay ? formatMonthDayTime(t) : formatHm(t));

  // Thin out markers so dense windows (e.g. 48 h) stay readable; always show
  // dots when there are only a handful of points.
  const dotProps = (color: string) =>
    showDots ? { r: data.length > 120 ? 1.4 : 2.2, fill: color, strokeWidth: 0 } : false;

  const renderTooltip = (props: TooltipProps<number, string>) => (
    <ChartTooltip
      {...props}
      series={series}
      unit={unit}
      precision={precision}
      xFormatter={tooltipFormatter}
    />
  );

  const hasRightAxis = series.some((s) => s.axis === "right");

  const axisProps = {
    stroke: GRID,
    tick: { fill: AXIS, fontSize: 12 },
    tickLine: false,
  } as const;

  if (variant === "area") {
    const s = series[0];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={xFormatter}
            minTickGap={48}
            {...axisProps}
          />
          <YAxis
            domain={[0, (max: number) => Math.ceil(withHeadroom(max))]}
            width={44}
            {...axisProps}
          />
          <Tooltip content={renderTooltip} />
          <Area
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={AREA_FILL}
            fillOpacity={0.3}
            isAnimationActive={false}
            dot={dotProps(s.color)}
            activeDot={{ r: 3.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={xFormatter}
          minTickGap={48}
          {...axisProps}
        />
        <YAxis
          yAxisId="left"
          domain={[
            (min: number) => Math.floor(min * 0.95),
            (max: number) => Math.ceil(withHeadroom(max)),
          ]}
          width={44}
          {...axisProps}
        />
        {hasRightAxis ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, (max: number) => withHeadroom(max)]}
            width={44}
            {...axisProps}
          />
        ) : null}
        <Tooltip content={renderTooltip} />
        {series.map((s) => (
          <Line
            key={s.key}
            yAxisId={s.axis === "right" ? "right" : "left"}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={dotProps(s.color)}
            activeDot={{ r: 3.5 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  unit,
  precision,
  xFormatter,
}: TooltipProps<number, string> & {
  series: ChartSeries[];
  unit?: string;
  precision: number;
  xFormatter: (t: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-xs shadow-none">
      <p className="mb-1 font-medium tabular-nums text-slate-500">
        {xFormatter(Number(label))}
      </p>
      <ul className="space-y-0.5">
        {payload.map((entry) => {
          const s = series.find((x) => x.key === entry.dataKey);
          const u = s?.unit ?? unit;
          const p = s?.precision ?? precision;
          return (
            <li key={entry.dataKey} className="flex items-center gap-2 tabular-nums">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="text-slate-600">{entry.name}</span>
              <span className="ml-auto font-medium text-slate-900">
                {Number(entry.value).toFixed(p)}
                {u ? ` ${u}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
