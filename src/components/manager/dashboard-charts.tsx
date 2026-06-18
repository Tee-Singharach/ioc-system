"use client";

import { useMemo } from "react";
import type { ActivityDay, StatusSlice } from "@/lib/manager-dashboard";
import { donutColor, donutStatusLabel } from "@/lib/manager-dashboard";
import { Card, CardBody } from "@/components/ui/card";

export function DashboardStatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardBody className="px-5 py-4">
        <p className="text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
        <p className="mt-1 text-sm text-zinc-500">{label}</p>
      </CardBody>
    </Card>
  );
}

export function CreatedFinishedChart({
  series,
  rangeDays,
  onRangeChange,
}: {
  series: ActivityDay[];
  rangeDays: 7 | 30;
  onRangeChange: (days: 7 | 30) => void;
}) {
  const max = useMemo(
    () => Math.max(1, ...series.flatMap((d) => [d.created, d.completed])),
    [series],
  );

  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">คำร้องสร้าง / เสร็จสิ้น</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" aria-hidden />
                สร้างใหม่
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-green-600" aria-hidden />
                เสร็จสิ้น
              </span>
            </div>
          </div>
          <div className="flex rounded-lg border border-zinc-200 p-0.5 text-xs">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onRangeChange(d)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  rangeDays === d
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {d === 7 ? "7 วัน" : "1 เดือน"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex min-h-48 flex-1 items-end gap-1 sm:gap-2">
          {series.map((day) => (
            <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-0.5 sm:gap-1">
                <div
                  className="w-[42%] max-w-5 rounded-t bg-blue-600 transition-all"
                  style={{ height: `${(day.created / max) * 100}%`, minHeight: day.created ? 4 : 0 }}
                  title={`สร้าง ${day.created}`}
                />
                <div
                  className="w-[42%] max-w-5 rounded-t bg-green-600 transition-all"
                  style={{ height: `${(day.completed / max) * 100}%`, minHeight: day.completed ? 4 : 0 }}
                  title={`เสร็จ ${day.completed}`}
                />
              </div>
              <span className="truncate text-[10px] text-zinc-400 sm:text-xs">{day.label}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function StatusDonutChart({ slices }: { slices: StatusSlice[] }) {
  const chartSlices = slices.filter((s) => s.count > 0);
  const total = chartSlices.reduce((sum, s) => sum + s.count, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col p-5">
        <h2 className="text-sm font-semibold text-zinc-900">สัดส่วนตามสถานะ</h2>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row">
          <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r={r} fill="none" stroke="#f4f4f5" strokeWidth="14" />
              {total === 0 ? null : (
                chartSlices.map((slice) => {
                  const len = (slice.count / total) * c;
                  const el = (
                    <circle
                      key={slice.status}
                      cx="50"
                      cy="50"
                      r={r}
                      fill="none"
                      stroke={donutColor(slice.status)}
                      strokeWidth="14"
                      strokeDasharray={`${len} ${c - len}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />
                  );
                  offset += len;
                  return el;
                })
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-zinc-900">{total}</span>
              <span className="text-xs text-zinc-500">ทั้งหมด</span>
            </div>
          </div>
          <ul className="w-full min-w-0 space-y-2 sm:flex-1">
            {slices.length === 0 ? (
              <li className="text-sm text-zinc-500">ไม่มีข้อมูล</li>
            ) : (
              slices.map((slice) => (
                <li key={slice.status} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColor(slice.status) }}
                      aria-hidden
                    />
                    <span className="truncate text-zinc-700">{donutStatusLabel(slice.status)}</span>
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${slice.count === 0 ? "text-zinc-400" : "text-zinc-900"}`}
                  >
                    {slice.count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
