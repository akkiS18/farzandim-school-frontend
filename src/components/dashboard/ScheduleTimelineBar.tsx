"use client";

import React from "react";
import { History } from "lucide-react";
import { addDays, formatLocalDate, parseLocalDate } from "@/lib/dateUtils";

export interface SchedulePeriod {
  start_date: string;
  end_date: string;
}

interface ScheduleTimelineBarProps {
  periods: SchedulePeriod[];
  selectedDate: string;
  loading?: boolean;
  onSelectDate: (date: string) => void;
}

const UZ_MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const PERIOD_TINTS = [
  "bg-emerald-50 text-emerald-950 hover:bg-emerald-100/90",
  "bg-sky-50 text-sky-950 hover:bg-sky-100/90",
  "bg-amber-50 text-amber-950 hover:bg-amber-100/90",
  "bg-violet-50 text-violet-950 hover:bg-violet-100/90",
];

function formatShortUzDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}-${UZ_MONTHS_SHORT[d.getMonth()]}`;
}

function diffDaysInclusive(startStr: string, endStr: string): number {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function calcDatePercentInRange(dateStr: string, startStr: string, days: number): number {
  if (days <= 1) return 50;
  const target = parseLocalDate(dateStr);
  const start = parseLocalDate(startStr);
  const offset = Math.round((target.getTime() - start.getTime()) / 86400000);
  const rawPct = (offset / (days - 1)) * 100;
  return Math.min(97, Math.max(3, rawPct));
}

type TimelineSegment =
  | {
      kind: "period";
      index: number;
      period: SchedulePeriod;
      start: string;
      end: string;
      days: number;
    }
  | {
      kind: "gap";
      start: string;
      end: string;
      days: number;
    };

export default function ScheduleTimelineBar({
  periods,
  selectedDate,
  loading = false,
  onSelectDate,
}: ScheduleTimelineBarProps) {
  const todayStr = formatLocalDate(new Date());

  if (loading) {
    return (
      <div className="border border-slate-200 bg-slate-50/70 p-4 space-y-3 animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-52 bg-slate-200" />
          <div className="h-5 w-44 bg-slate-200" />
        </div>
        <div className="h-12 w-full bg-slate-200/80" />
        <div className="flex gap-2">
          <div className="h-7 w-40 bg-slate-200" />
          <div className="h-7 w-40 bg-slate-200" />
        </div>
      </div>
    );
  }

  const sortedPeriods = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (sortedPeriods.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 flex items-center gap-2 text-xs text-slate-400 font-medium">
        <History className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Bu sinf uchun hali dars jadvali davrlari kiritilmagan.</span>
      </div>
    );
  }

  const jumpTargetForPeriod = (p: SchedulePeriod): string =>
    todayStr >= p.start_date && todayStr <= p.end_date ? todayStr : p.start_date;

  // Match backend logic: if periods ever overlapped, the latest start_date wins
  const matchingPeriods = sortedPeriods.filter(
    (p) => selectedDate >= p.start_date && selectedDate <= p.end_date
  );
  const activePeriod =
    matchingPeriods.length > 0 ? matchingPeriods[matchingPeriods.length - 1] : null;
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

  // Build ordered timeline segments including any gaps between periods
  const segments: TimelineSegment[] = [];
  sortedPeriods.forEach((curr, i) => {
    if (i > 0) {
      const prev = sortedPeriods[i - 1];
      const expectedNextStart = addDays(prev.end_date, 1);
      if (expectedNextStart < curr.start_date) {
        const gapEnd = addDays(curr.start_date, -1);
        segments.push({
          kind: "gap",
          start: expectedNextStart,
          end: gapEnd,
          days: diffDaysInclusive(expectedNextStart, gapEnd),
        });
      }
    }
    segments.push({
      kind: "period",
      index: i,
      period: curr,
      start: curr.start_date,
      end: curr.end_date,
      days: diffDaysInclusive(curr.start_date, curr.end_date),
    });
  });

  const totalDays = segments.reduce((sum, s) => sum + s.days, 0);
  const changeCount = sortedPeriods.length - 1;

  return (
    <div className="border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
      {/* Top Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1D1E26] font-mono">
            <History className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>JADVAL TARIXI VA O&apos;ZGARISHLAR</span>
          </span>
          <span className="px-2 py-0.5 text-[10px] font-extrabold font-mono bg-white border border-slate-200 text-slate-700">
            {sortedPeriods.length} ta davr
          </span>
          {changeCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold font-mono bg-[#ECFCCA] border border-lime-300 text-[#1D1E26]">
              {changeCount} marta o&apos;zgargan
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activePeriod ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-[#ECFCCA] border border-lime-300 text-[#1D1E26] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>
                Faol davr: {formatShortUzDate(activePeriod.start_date)} —{" "}
                {formatShortUzDate(activePeriod.end_date)} (
                {diffDaysInclusive(activePeriod.start_date, activePeriod.end_date)} kun)
              </span>
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-amber-50 border border-amber-300 text-amber-800 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Tanlangan sanada jadval yo&apos;q</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectDate(jumpTargetForPeriod(lastPeriod))}
                className="px-2.5 py-1 text-[11px] font-extrabold bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 transition cursor-pointer font-mono"
              >
                Oxirgi jadvalga o&apos;tish →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Proportional Horizontal Time-Chart Bar */}
      <div className="flex w-full overflow-x-auto border border-slate-200 bg-white">
        <div className="flex w-full min-w-[460px] h-14">
          {segments.map((seg, segIdx) => {
            if (seg.kind === "gap") {
              const weight = Math.max(seg.days, totalDays * 0.05);
              const dateInGap = selectedDate >= seg.start && selectedDate <= seg.end;
              const needlePct = dateInGap
                ? calcDatePercentInRange(selectedDate, seg.start, seg.days)
                : 0;
              return (
                <div
                  key={`gap-${seg.start}-${seg.end}`}
                  style={{ flexGrow: weight, flexBasis: 0 }}
                  title={`Bo'sh oraliq: ${formatShortUzDate(seg.start)} — ${formatShortUzDate(seg.end)} (${seg.days} kun)`}
                  className={`relative h-full min-w-[20px] flex items-center justify-center ${
                    segIdx > 0 ? "border-l border-slate-200" : ""
                  }`}
                >
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(-45deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px)",
                    }}
                  />
                  {dateInGap && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10 pointer-events-none"
                      style={{ left: `${needlePct}%` }}
                      title={`Tanlangan sana: ${selectedDate}`}
                    >
                      <span className="absolute -top-0.5 -left-[3px] w-2 h-2 bg-amber-500 rounded-full" />
                    </div>
                  )}
                  <span className="relative z-10 text-[9px] font-mono font-bold text-slate-400 px-1 truncate">
                    Bo&apos;sh
                  </span>
                </div>
              );
            }

            const weight = Math.max(seg.days, totalDays * 0.14);
            const isActive =
              activePeriod !== null &&
              activePeriod.start_date === seg.start &&
              activePeriod.end_date === seg.end;
            const containsToday = todayStr >= seg.start && todayStr <= seg.end;
            const needlePct = isActive
              ? calcDatePercentInRange(selectedDate, seg.start, seg.days)
              : 0;
            const tintClass = PERIOD_TINTS[seg.index % PERIOD_TINTS.length];
            const shortRange = `${formatShortUzDate(seg.start)} — ${formatShortUzDate(seg.end)}`;

            return (
              <button
                key={`period-${seg.start}-${seg.end}`}
                type="button"
                onClick={() => onSelectDate(jumpTargetForPeriod(seg.period))}
                style={{ flexGrow: weight, flexBasis: 0 }}
                title={`${seg.index + 1}-davr: ${seg.start} — ${seg.end} (${seg.days} kun)${
                  seg.index > 0 ? " • Jadval o'zgargan sana" : ""
                }`}
                className={`relative h-full min-w-[78px] px-2.5 py-1.5 text-left flex flex-col justify-between transition cursor-pointer overflow-hidden ${
                  segIdx > 0 ? "border-l border-slate-300/80" : ""
                } ${
                  isActive
                    ? "bg-[#1D1E26] text-[#D4F562] border-y-2 border-[#D4F562]"
                    : tintClass
                }`}
              >
                {isActive && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#D4F562] shadow-[0_0_6px_rgba(212,245,98,0.85)] z-10 pointer-events-none"
                    style={{ left: `${needlePct}%` }}
                  >
                    <span className="absolute top-0 -left-[3px] w-2 h-2 rounded-full bg-white border border-[#1D1E26]" />
                  </div>
                )}

                <div className="relative z-20 flex items-center justify-between gap-1 w-full min-w-0">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="text-[10px] font-black font-mono uppercase shrink-0">
                      {seg.index + 1}-davr
                    </span>
                    {seg.index > 0 && (
                      <span
                        className={`px-1 py-0 text-[9px] font-bold font-mono shrink-0 ${
                          isActive
                            ? "bg-[#D4F562]/20 text-[#D4F562]"
                            : "bg-white/80 text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        ↻ O&apos;zgargan
                      </span>
                    )}
                  </div>
                  {containsToday && (
                    <span
                      title="Bugungi kun shu davrda"
                      className="inline-flex items-center gap-1 text-[9px] font-mono font-bold shrink-0"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-[#D4F562]" : "bg-emerald-500"
                        }`}
                      />
                      <span className="hidden md:inline">Bugun</span>
                    </span>
                  )}
                </div>

                <div className="relative z-20 flex items-center justify-between gap-1.5 w-full min-w-0">
                  <span className="text-[11px] font-extrabold truncate">{shortRange}</span>
                  <span
                    className={`text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? "text-[#D4F562]/80" : "text-slate-500"
                    }`}
                  >
                    {seg.days} kun
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Change-Point Milestones Row */}
      <div className="flex flex-wrap items-center gap-2">
        {sortedPeriods.map((p, i) => {
          const isActive =
            activePeriod !== null &&
            activePeriod.start_date === p.start_date &&
            activePeriod.end_date === p.end_date;
          const shortStart = formatShortUzDate(p.start_date);
          const shortEnd = formatShortUzDate(p.end_date);
          const label =
            i === 0
              ? `Boshlangan: ${shortStart} (${shortStart} — ${shortEnd})`
              : `↻ ${shortStart} dan o'zgargan (${shortStart} — ${shortEnd})`;

          return (
            <button
              key={`chip-${p.start_date}-${p.end_date}`}
              type="button"
              onClick={() => onSelectDate(jumpTargetForPeriod(p))}
              title={`${p.start_date} — ${p.end_date} (${diffDaysInclusive(p.start_date, p.end_date)} kun)`}
              className={`px-2.5 py-1 text-[11px] font-bold font-mono border transition cursor-pointer ${
                isActive
                  ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
