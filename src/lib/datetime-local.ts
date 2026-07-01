/** Convert ISO string to value for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse datetime-local input value to ISO string. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/** Earliest selectable datetime-local value (ponytail: 10y back enough for late reports). */
export function datetimeLocalYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setHours(0, 0, 0, 0);
  return toDatetimeLocalValue(d.toISOString());
}
