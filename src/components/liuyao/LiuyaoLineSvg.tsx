"use client";

import React from "react";

import { LineType } from "@/lib/types";

export type LiuyaoLineSvgModel = {
  segments: Array<{ x: number; width: number }>;
  mark: "O" | "X" | null;
};

export function getLiuyaoLineSvgModel(line: LineType): LiuyaoLineSvgModel {
  const isYin = line === LineType.SHAO_YIN || line === LineType.LAO_YIN;
  const mark = line === LineType.LAO_YANG ? "O" : line === LineType.LAO_YIN ? "X" : null;

  if (isYin) {
    return {
      segments: [
        { x: 0, width: 48 },
        { x: 72, width: 48 },
      ],
      mark,
    };
  }

  return {
    segments: [{ x: 0, width: 120 }],
    mark,
  };
}

export function LiuyaoLineSvg({
  line,
  className,
  lineColor = "#2F2F2F",
  markColor = "#A62121",
  showMark = true,
}: {
  line: LineType;
  className?: string;
  lineColor?: string;
  markColor?: string;
  showMark?: boolean;
}) {
  const model = getLiuyaoLineSvgModel(line);

  return (
    <svg
      className={className}
      viewBox="0 0 120 24"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="爻"
    >
      {model.segments.map((s, idx) => (
        <rect key={idx} x={s.x} y={8} width={s.width} height={8} rx={0} fill={lineColor} />
      ))}

      {showMark && model.mark === "O" && (
        <circle cx={108} cy={12} r={4} fill="none" stroke={markColor} strokeWidth={2} />
      )}
      {showMark && model.mark === "X" && (
        <>
          <line x1={104} y1={8} x2={112} y2={16} stroke={markColor} strokeWidth={2} />
          <line x1={112} y1={8} x2={104} y2={16} stroke={markColor} strokeWidth={2} />
        </>
      )}
    </svg>
  );
}
