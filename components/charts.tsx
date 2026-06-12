"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

export type ChartPoint = { label: string; value: number };

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const PLAIN = new Intl.NumberFormat("en-US");

const AXIS_TICK = { fill: "#64748b", fontSize: 11 };
const GRID_STROKE = "#1c2740";

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: Pick<TooltipContentProps<number, string>, "active" | "payload" | "label"> & {
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#283a5c] bg-[#0d1424] px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold">
        {PLAIN.format(Number(payload[0].value ?? 0))}{" "}
        <span className="font-normal text-slate-400">{valueLabel}</span>
      </p>
    </div>
  );
}

export function AreaTrendChart({
  data,
  valueLabel,
  color = "#34d399",
  height = 256,
}: {
  data: ChartPoint[];
  valueLabel: string;
  color?: string;
  height?: number;
}) {
  const gradientId = `area-${color.replace("#", "")}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(value: number) => COMPACT.format(value)}
          />
          <Tooltip
            cursor={{ stroke: "#283a5c" }}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                valueLabel={valueLabel}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  valueLabel,
  color = "#60a5fa",
  height = 256,
}: {
  data: ChartPoint[];
  valueLabel: string;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(value: number) => COMPACT.format(value)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                valueLabel={valueLabel}
              />
            )}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
