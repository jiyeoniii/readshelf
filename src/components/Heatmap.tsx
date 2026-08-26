"use client";

import { heatmapWeeks, level } from "@/lib/stats";
import type { ReadingRecord } from "@/lib/types";

const LEVEL_VAR = [
  "var(--grass-0)",
  "var(--grass-1)",
  "var(--grass-2)",
  "var(--grass-3)",
];

const DAY_LABELS = ["", "월", "", "수", "", "금", ""];

export default function Heatmap({
  records,
  weeks = 26,
}: {
  records: ReadingRecord[];
  weeks?: number;
}) {
  const grid = heatmapWeeks(records, weeks);

  // 월 라벨: 각 주의 첫 날이 새로운 달로 넘어가는 지점에 표시
  const monthLabels = grid.map((col, i) => {
    const month = Number(col[0].key.slice(5, 7));
    const prev = i > 0 ? Number(grid[i - 1][0].key.slice(5, 7)) : -1;
    return month !== prev ? `${month}월` : "";
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex gap-2">
        {/* 요일 라벨 */}
        <div className="flex flex-col gap-[3px] pt-[18px] text-[10px] leading-[13px] text-muted">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="h-[13px]">
              {d}
            </span>
          ))}
        </div>

        <div>
          {/* 월 라벨 */}
          <div className="mb-1 flex gap-[3px] text-[10px] text-muted">
            {monthLabels.map((m, i) => (
              <span key={i} className="w-[13px] shrink-0 whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {grid.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    title={
                      cell.future
                        ? ""
                        : `${cell.key} · ${cell.pages}쪽`
                    }
                    style={{
                      backgroundColor: cell.future
                        ? "transparent"
                        : LEVEL_VAR[level(cell.pages)],
                    }}
                    className="h-[13px] w-[13px] rounded-[3px]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
        <span>적음</span>
        {LEVEL_VAR.map((v) => (
          <span
            key={v}
            style={{ backgroundColor: v }}
            className="h-[11px] w-[11px] rounded-[3px]"
          />
        ))}
        <span>많음</span>
        <span className="ml-2">· 1~30쪽 / 31~99쪽 / 100쪽 이상</span>
      </div>
    </div>
  );
}
