const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const PLAIN = new Intl.NumberFormat("en-US");
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return COMPACT.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return PLAIN.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

/** Compact with an explicit sign, for growth deltas: "+1.2K", "-3". */
export function formatSigned(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const compact = COMPACT.format(Math.abs(value));
  return value < 0 ? `-${compact}` : `+${compact}`;
}

export function formatDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? "—" : DATE.format(time);
}

export function shortDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? "—" : SHORT_DATE.format(time);
}

/** Maps an insight series to the {label, value} points the charts expect. */
export function toChartPoints(
  points: { date: string; value: number }[] | undefined,
): { label: string; value: number }[] {
  return (points ?? []).map((point) => ({
    label: shortDate(point.date),
    value: point.value,
  }));
}
