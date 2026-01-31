"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Hash,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { EightChar, SixtyCycle, SolarTime } from "tyme4ts";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useToastStore } from "@/stores/useToastStore";
import type { BaZiData } from "@/lib/types";
import { BRANCHES, STEMS } from "@/lib/constants";
import type { AiRecognizeBaziResult } from "@/lib/aiRecognition";
import { scrollAndFlash } from "@/lib/scrollFlash";
import { loadLocationPickerSchema, formatSelection } from "@/lib/locationData";
import { filterCities, filterDistricts, filterProvinces, type LocationNode } from "@/lib/locationSearch";
import { resolveLocationIdsFromText } from "@/lib/locationResolve";
import {
  deriveBaziPickerFromSolar,
  deriveBaziPickerFromSolarTime,
  getBaziPickerYearItems,
  getBaziTimePickerOpenDefaults,
  getNowButtonResult,
  parseQuickFourPillarsInput,
  parseQuickSolarInput,
  tryDeriveSolarFromLunar,
} from "@/lib/baziTimePicker";

const pad2 = (n: number) => n.toString().padStart(2, "0");

const toBjIsoFromSolar = (solar: { y: number; m: number; d: number; h: number; min: number }) => {
  return `${solar.y}-${pad2(solar.m)}-${pad2(solar.d)}T${pad2(solar.h)}:${pad2(solar.min)}:00+08:00`;
};

const nowBjIso = () => {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return `${bj.getUTCFullYear()}-${pad2(bj.getUTCMonth() + 1)}-${pad2(bj.getUTCDate())}T${pad2(
    bj.getUTCHours(),
  )}:${pad2(bj.getUTCMinutes())}:00+08:00`;
};

type PickerItem = string | number | LocationNode;

const PickerColumn = ({
  items,
  value,
  onChange,
  label,
  renderItem,
  showDivider = true,
}: {
  items: PickerItem[];
  value: string | number;
  onChange: (val: string | number) => void;
  label: string;
  renderItem?: (label: string) => React.ReactNode;
  showDivider?: boolean;
}) => {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const settleTimerRef = React.useRef<number | null>(null);
  const lastEmittedRef = React.useRef<string>(String(value));

  const commitClosestToCenter = React.useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const centerY = scrollerRect.top + scrollerRect.height / 2;
    const buttons = scroller.querySelectorAll<HTMLButtonElement>("button[data-picker-item='1']");

    let best: { dist: number; value: string } | null = null;
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      const btnCenter = rect.top + rect.height / 2;
      const dist = Math.abs(btnCenter - centerY);
      const v = btn.dataset.pickerValue ?? "";
      if (!best || dist < best.dist) best = { dist, value: v };
    }

    if (!best) return;
    if (best.value === lastEmittedRef.current) return;
    lastEmittedRef.current = best.value;
    onChange(typeof value === "number" ? Number(best.value) : best.value);
  }, [onChange, value]);

  const handleScroll = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        commitClosestToCenter();
      }, 120);
    });
  }, [commitClosestToCenter]);

  React.useEffect(() => {
    lastEmittedRef.current = String(value);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const selector = `button[data-picker-item='1'][data-picker-value='${CSS.escape(String(value))}']`;
    const btn = scroller.querySelector<HTMLButtonElement>(selector);
    btn?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center w-full relative ${
        showDivider ? "border-r border-[#B37D56]/10" : ""
      }`}
    >
      <span className="text-[10px] text-[#B37D56] font-bold mb-6 uppercase tracking-widest">
        {label}
      </span>
      <div className="relative w-full h-44 flex items-center justify-center">
        <div className="absolute inset-x-0 top-[calc(50%-20px)] h-[0.5px] bg-[#B37D56]/30 z-0" />
        <div className="absolute inset-x-0 top-[calc(50%+20px)] h-[0.5px] bg-[#B37D56]/30 z-0" />
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar w-full snap-y snap-mandatory relative z-10"
        >
          <div className="py-20 flex flex-col items-center">
            {items.map((item) => (
              <button
                key={typeof item === "object" ? item.id : item}
                onClick={() => {
                  const nextValue = typeof item === "object" ? item.id : String(item);
                  onChange(typeof value === "number" ? Number(nextValue) : nextValue);
                }}
                data-picker-item="1"
                data-picker-value={typeof item === "object" ? item.id : String(item)}
                className={`w-full py-2 text-center transition-all duration-300 snap-center chinese-font outline-none ${
                  (typeof item === "object" ? item.id : item.toString()) === value.toString()
                    ? "text-[#2F2F2F] font-bold text-base"
                    : "text-[#2F2F2F]/10 text-xs hover:text-[#2F2F2F]/30"
                }`}
              >
                {(() => {
                  const labelText = typeof item === "object" ? item.name : String(item);
                  return renderItem ? renderItem(labelText) : labelText;
                })()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LocationPickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (loc: string) => void;
  initialLocation?: string;
}) => {
  const [regionType, setRegionType] = useState<"domestic" | "overseas">("domestic");
  const [schema, setSchema] = useState<Awaited<ReturnType<typeof loadLocationPickerSchema>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [level1Id, setLevel1Id] = useState<string>("");
  const [level2Id, setLevel2Id] = useState<string>("");
  const [level3Id, setLevel3Id] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    loadLocationPickerSchema(regionType)
      .then((s) => {
        setSchema(s);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, regionType]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialLocation) return;
    const trimmed = initialLocation.trim();
    if (!trimmed) return;

    // Lightweight heuristic: if it contains latin letters and no CJK, prefer overseas schema.
    const hasLatin = /[A-Za-z]/.test(trimmed);
    const hasCjk = /[\u4e00-\u9fff]/.test(trimmed);
    if (hasLatin && !hasCjk) setRegionType("overseas");
  }, [initialLocation, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
  }, [isOpen, regionType]);

  useEffect(() => {
    if (!isOpen) return;
    if (!schema) return;
    const trimmed = (initialLocation ?? "").trim();
    if (!trimmed) return;

    const resolved = resolveLocationIdsFromText(schema, trimmed);
    if (resolved.level1Id) setLevel1Id(resolved.level1Id);
    if (resolved.level2Id) setLevel2Id(resolved.level2Id);
    if (resolved.level3Id) setLevel3Id(resolved.level3Id);
  }, [initialLocation, isOpen, schema]);

  const filteredProvinces = useMemo(
    () => (schema ? filterProvinces(schema.hierarchy, query) : []),
    [schema, query],
  );

  const filteredCities = useMemo(
    () => (schema && level1Id ? filterCities(schema.hierarchy, level1Id, query) : []),
    [schema, level1Id, query],
  );

  const filteredDistricts = useMemo(
    () => (schema && level2Id ? filterDistricts(schema.hierarchy, level2Id, query) : []),
    [schema, level2Id, query],
  );

  useEffect(() => {
    if (filteredProvinces.length === 0) return;
    if (!filteredProvinces.some((n) => n.id === level1Id)) setLevel1Id(filteredProvinces[0].id);
  }, [filteredProvinces, level1Id]);

  useEffect(() => {
    if (filteredCities.length === 0) return;
    if (!filteredCities.some((n) => n.id === level2Id)) setLevel2Id(filteredCities[0].id);
  }, [filteredCities, level2Id]);

  useEffect(() => {
    if (filteredDistricts.length === 0) return;
    if (!filteredDistricts.some((n) => n.id === level3Id)) setLevel3Id(filteredDistricts[0].id);
  }, [filteredDistricts, level3Id]);

  const highlight = useMemo(() => {
    const q = query.trim();
    if (!q) return undefined;

    const qLower = q.toLowerCase();
    function renderHighlightedText(raw: string | number) {
      const text = String(raw);
      const lower = text.toLowerCase();
      const idx = lower.indexOf(qLower);
      if (idx < 0) return text;

      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + q.length);
      const after = text.slice(idx + q.length);
      return (
        <>
          {before}
          <span className="text-[#B37D56]">{match}</span>
          {after}
        </>
      );
    }

    return renderHighlightedText;
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#B37D56]/10 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex bg-[#FAF7F2] p-0.5 border border-[#B37D56]/10 rounded-[2px]">
              <button
                onClick={() => setRegionType("domestic")}
                className={`px-6 py-1.5 text-[10px] chinese-font transition-all rounded-[1px] ${
                  regionType === "domestic" ? "bg-[#B37D56] text-white" : "text-[#2F2F2F]/30"
                }`}
              >
                国内
              </button>
              <button
                onClick={() => setRegionType("overseas")}
                className={`px-6 py-1.5 text-[10px] chinese-font transition-all rounded-[1px] ${
                  regionType === "overseas" ? "bg-[#B37D56] text-white" : "text-[#2F2F2F]/30"
                }`}
              >
                海外
              </button>
            </div>
            <button onClick={onClose} className="text-[#2F2F2F]/20 hover:text-[#A62121]">
              <X size={20} />
            </button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B37D56]/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索全国城市及地区"
              className="w-full bg-[#FAF7F2] border border-[#B37D56]/10 pl-9 pr-4 py-2 text-xs rounded-[4px] outline-none focus:border-[#B37D56] transition-all"
            />
          </div>
        </div>

        <div className="p-8 flex justify-between min-h-[240px]">
          {isLoading || !schema ? (
            <div className="w-full py-16 text-center text-xs text-[#2F2F2F]/30 chinese-font">
              加载中…
            </div>
          ) : (
            <>
              <PickerColumn
                label={schema.labels.level1}
                items={filteredProvinces}
                value={level1Id}
                onChange={(v) => {
                  const nextLevel1Id = String(v);
                  setLevel1Id(nextLevel1Id);
                  const nextLevel2 = filterCities(schema.hierarchy, nextLevel1Id, query);
                  const nextLevel2Id = nextLevel2[0]?.id ?? "";
                  setLevel2Id(nextLevel2Id);
                  const nextLevel3 = nextLevel2Id
                    ? filterDistricts(schema.hierarchy, nextLevel2Id, query)
                    : [];
                  setLevel3Id(nextLevel3[0]?.id ?? "");
                }}
                renderItem={highlight}
              />
              <PickerColumn
                label={schema.labels.level2}
                items={filteredCities}
                value={level2Id}
                onChange={(v) => {
                  const nextLevel2Id = String(v);
                  setLevel2Id(nextLevel2Id);
                  const nextLevel3 = filterDistricts(schema.hierarchy, nextLevel2Id, query);
                  setLevel3Id(nextLevel3[0]?.id ?? "");
                }}
                renderItem={highlight}
              />
              <PickerColumn
                label={schema.labels.level3}
                items={filteredDistricts}
                value={level3Id}
                onChange={(v) => setLevel3Id(String(v))}
                showDivider={false}
                renderItem={highlight}
              />
            </>
          )}
        </div>

        <div className="p-8 pt-0">
          <button
            onClick={() => {
              if (!schema) return;
              onConfirm(
                formatSelection(schema, {
                  level1Id,
                  level2Id,
                  level3Id,
                }),
              );
              onClose();
            }}
            className="w-full h-12 bg-[#2F2F2F] text-white font-bold chinese-font tracking-[0.4em] rounded-[2px] hover:bg-black transition-all"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

type BaziTimePickerConfirmData =
  | {
      tab: "fourPillars";
      solar: { y: number; m: number; d: number; h: number; min: number };
      lunar: { y: number; m: string; d: string; h: number; min: number };
      fourPillars: { yS: string; yB: string; mS: string; mB: string; dS: string; dB: string; hS: string; hB: string };
    }
  | {
      tab: "solar" | "lunar";
      solar: { y: number; m: number; d: number; h: number; min: number };
      lunar: { y: number; m: string; d: string; h: number; min: number };
      fourPillars: { yS: string; yB: string; mS: string; mB: string; dS: string; dB: string; hS: string; hB: string };
    };

const BaziTimePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BaziTimePickerConfirmData) => void;
}) => {
  const toast = useToastStore();
  const [tab, setTab] = useState<"solar" | "lunar" | "fourPillars">("solar");
  const [solar, setSolar] = useState({ y: 1990, m: 1, d: 1, h: 0, min: 0 });
  const [lunar, setLunar] = useState({ y: 1989, m: "腊月", d: "初五", h: 0, min: 0 });
  const [fourPillars, setFourPillars] = useState({
    yS: "乙",
    yB: "酉",
    mS: "戊",
    mB: "寅",
    dS: "丙",
    dB: "戌",
    hS: "己",
    hB: "丑",
  });

  const [picking, setPicking] = useState<{ p: "y" | "m" | "d" | "h"; t: "S" | "B" } | null>(
    null,
  );
  const pillarsOrder = useMemo(() => ["y", "m", "d", "h"] as const, []);

  const [fourPillarsCandidates, setFourPillarsCandidates] = useState<SolarTime[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const wasOpenRef = React.useRef(false);
  const lastSolarSyncKeyRef = React.useRef<string | null>(null);
  const [quickInput, setQuickInput] = useState("");

  const getSolarMaxDay = React.useCallback((y: number, m: number) => {
    const safeMonth = Math.min(12, Math.max(1, m));
    return new Date(y, safeMonth, 0).getDate();
  }, []);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const defaults = getBaziTimePickerOpenDefaults(new Date());
      setTab(defaults.tab);
      setSolar(defaults.derived.solar);
      setLunar(defaults.derived.lunar);
      setFourPillars(defaults.derived.fourPillars);
      setFourPillarsCandidates([]);
      setSelectedCandidateIndex(0);
      setPicking(null);
      setQuickInput("");
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    lastSolarSyncKeyRef.current = null;
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "fourPillars") return;

    const maxDay = getSolarMaxDay(solar.y, solar.m);
    if (solar.d > maxDay) {
      setSolar({ ...solar, d: maxDay });
      return;
    }

    const key = `${solar.y}-${solar.m}-${solar.d}-${solar.h}-${solar.min}`;
    if (lastSolarSyncKeyRef.current === key) return;
    lastSolarSyncKeyRef.current = key;

    try {
      const derived = deriveBaziPickerFromSolar(solar);
      setLunar(derived.lunar);
      setFourPillars(derived.fourPillars);
    } catch {
      // ignore invalid dates while scrolling
    }
  }, [getSolarMaxDay, isOpen, solar, tab]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab !== "lunar") return;

    const nextSolar = tryDeriveSolarFromLunar(lunar);
    if (!nextSolar) return;
    if (
      nextSolar.y === solar.y &&
      nextSolar.m === solar.m &&
      nextSolar.d === solar.d &&
      nextSolar.h === solar.h &&
      nextSolar.min === solar.min
    )
      return;

    setSolar(nextSolar);
  }, [isOpen, lunar, solar, tab]);

  const computeCandidates = React.useCallback((fp: typeof fourPillars) => {
    try {
      const ec = new EightChar(
        SixtyCycle.fromName(`${fp.yS}${fp.yB}`),
        SixtyCycle.fromName(`${fp.mS}${fp.mB}`),
        SixtyCycle.fromName(`${fp.dS}${fp.dB}`),
        SixtyCycle.fromName(`${fp.hS}${fp.hB}`),
      );
      const list = ec.getSolarTimes(1900, 2100) as SolarTime[];
      setFourPillarsCandidates(list);
      setSelectedCandidateIndex(0);
    } catch {
      setFourPillarsCandidates([]);
      setSelectedCandidateIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (tab !== "fourPillars") return;
    computeCandidates(fourPillars);
  }, [computeCandidates, fourPillars, isOpen, tab]);

  const handleNow = () => {
    const { derived, shouldAutoConfirm, shouldAutoClose } = getNowButtonResult(new Date());
    setSolar(derived.solar);
    setLunar(derived.lunar);
    setFourPillars(derived.fourPillars);
    if (shouldAutoConfirm) onConfirm({ tab, ...derived } as BaziTimePickerConfirmData);
    if (shouldAutoClose) onClose();
  };

  const applyQuickInput = React.useCallback(() => {
    const raw = quickInput.trim();
    if (!raw) {
      toast.show("请输入要识别的内容", "warning");
      return;
    }

    const parsedSolar = parseQuickSolarInput(raw);
    if (parsedSolar) {
      setTab("solar");
      setSolar(parsedSolar);
      toast.show(
        `已定位到 ${parsedSolar.y} / ${pad2(parsedSolar.m)} / ${pad2(parsedSolar.d)}  ${pad2(
          parsedSolar.h,
        )}:${pad2(parsedSolar.min)}`,
        "success",
      );
      return;
    }

    const parsedFp = parseQuickFourPillarsInput(raw);
    if (parsedFp) {
      setTab("fourPillars");
      setPicking(null);
      setFourPillars(parsedFp);
      toast.show("已识别四柱并更新匹配时间", "success");
      return;
    }

    toast.show("未能识别：支持 199303270255 或 乙酉戊寅丙戌己丑", "warning");
  }, [quickInput, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden relative animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-2 flex items-center justify-between border-b border-[#B37D56]/10">
          <button
            onClick={handleNow}
            className="px-4 py-1.5 bg-[#B37D56]/10 text-[#B37D56] text-[10px] font-bold chinese-font hover:bg-[#B37D56] hover:text-white transition-all rounded-[2px] border border-[#B37D56]/20"
          >
            现在
          </button>
          <div className="flex bg-[#FAF7F2] border border-[#B37D56]/10 p-0.5 rounded-[2px]">
            {(
              [
                { id: "solar", l: "公历" },
                { id: "lunar", l: "农历" },
                { id: "fourPillars", l: "四柱" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-[10px] chinese-font transition-all ${
                  tab === t.id
                    ? "bg-[#B37D56] text-white rounded-[1px]"
                    : "text-[#2F2F2F]/30 hover:text-[#2F2F2F]"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-[#2F2F2F]/20 hover:text-[#A62121]">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 min-h-[280px]">
          <div className="mb-6">
            <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-2 block">
              快捷识别
            </label>
            <div className="flex gap-2 items-stretch">
              <div className="flex items-center gap-2 flex-1 bg-[#FAF7F2] border border-[#B37D56]/20 px-3 rounded-[2px]">
                <Search size={14} className="text-[#B37D56]/50 shrink-0" />
                <input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyQuickInput();
                  }}
                  placeholder="199303270255 或 乙酉戊寅丙戌己丑"
                  className="w-full bg-transparent py-2 outline-none text-xs chinese-font font-bold text-[#2F2F2F] placeholder:text-[#2F2F2F]/30"
                />
              </div>
              <button
                type="button"
                onClick={applyQuickInput}
                className="px-4 bg-[#2F2F2F] text-white font-bold chinese-font text-xs rounded-[2px] hover:bg-black transition-all"
              >
                识别
              </button>
            </div>
            <p className="text-[10px] text-[#2F2F2F]/30 chinese-font mt-2">
              数字支持：YYYYMMDDHHmm；四柱支持：年柱月柱日柱时柱（8 字）。
            </p>
          </div>
          {tab === "solar" && (
            <div className="flex justify-between">
              <PickerColumn
                label="年"
                items={getBaziPickerYearItems()}
                value={solar.y}
                onChange={(v) => setSolar({ ...solar, y: Number(v) })}
              />
              <PickerColumn
                label="月"
                items={Array.from({ length: 12 }, (_, i) => i + 1)}
                value={solar.m}
                onChange={(v) => setSolar({ ...solar, m: Number(v) })}
              />
              <PickerColumn
                label="日"
                items={Array.from({ length: 31 }, (_, i) => i + 1)}
                value={solar.d}
                onChange={(v) => setSolar({ ...solar, d: Number(v) })}
              />
              <PickerColumn
                label="时"
                items={Array.from({ length: 24 }, (_, i) => i)}
                value={solar.h}
                onChange={(v) => setSolar({ ...solar, h: Number(v) })}
              />
              <PickerColumn
                label="分"
                items={Array.from({ length: 60 }, (_, i) => i)}
                value={solar.min}
                onChange={(v) => setSolar({ ...solar, min: Number(v) })}
                showDivider={false}
              />
            </div>
          )}
          {tab === "lunar" && (
            <div className="flex justify-between">
              <PickerColumn
                label="年"
                items={getBaziPickerYearItems()}
                value={lunar.y}
                onChange={(v) => setLunar({ ...lunar, y: Number(v) })}
              />
              <PickerColumn
                label="月"
                items={[
                  "正月",
                  "二月",
                  "三月",
                  "四月",
                  "五月",
                  "六月",
                  "七月",
                  "八月",
                  "九月",
                  "十月",
                  "冬月",
                  "腊月",
                ]}
                value={lunar.m}
                onChange={(v) => setLunar({ ...lunar, m: String(v) })}
              />
              <PickerColumn
                label="日"
                items={[
                  "初一",
                  "初二",
                  "初三",
                  "初四",
                  "初五",
                  "初六",
                  "初七",
                  "初八",
                  "初九",
                  "初十",
                  "十一",
                  "十二",
                  "十三",
                  "十四",
                  "十五",
                  "十六",
                  "十七",
                  "十八",
                  "十九",
                  "二十",
                  "廿一",
                  "廿二",
                  "廿三",
                  "廿四",
                  "廿五",
                  "廿六",
                  "廿七",
                  "廿八",
                  "廿九",
                  "三十",
                ]}
                value={lunar.d}
                onChange={(v) => setLunar({ ...lunar, d: String(v) })}
              />
              <PickerColumn
                label="时"
                items={Array.from({ length: 24 }, (_, i) => i)}
                value={lunar.h}
                onChange={(v) => setLunar({ ...lunar, h: Number(v) })}
              />
              <PickerColumn
                label="分"
                items={Array.from({ length: 60 }, (_, i) => i)}
                value={lunar.min}
                onChange={(v) => setLunar({ ...lunar, min: Number(v) })}
                showDivider={false}
              />
            </div>
          )}
          {tab === "fourPillars" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-0 border border-[#B37D56]/10 p-4">
                {[
                  { label: "年", s: fourPillars.yS, b: fourPillars.yB, key: "y" as const },
                  { label: "月", s: fourPillars.mS, b: fourPillars.mB, key: "m" as const },
                  { label: "日", s: fourPillars.dS, b: fourPillars.dB, key: "d" as const },
                  { label: "时", s: fourPillars.hS, b: fourPillars.hB, key: "h" as const },
                ].map((p, i) => (
                  <div
                    key={p.key}
                    className={`flex flex-col items-center gap-3 ${
                      i < 3 ? "border-r border-[#B37D56]/5" : ""
                    }`}
                  >
                    <span className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">
                      {p.label}柱
                    </span>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => setPicking({ p: p.key, t: "S" })}
                        className={`w-10 h-10 border flex items-center justify-center text-lg font-bold transition-all chinese-font rounded-[2px] ${
                          picking?.p === p.key && picking?.t === "S"
                            ? "bg-[#B37D56] text-white border-[#B37D56]"
                            : "border-[#B37D56]/10 text-[#2F2F2F] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {p.s}
                      </button>
                      <button
                        onClick={() => setPicking({ p: p.key, t: "B" })}
                        className={`w-10 h-10 border flex items-center justify-center text-lg font-bold transition-all chinese-font rounded-[2px] ${
                          picking?.p === p.key && picking?.t === "B"
                            ? "bg-[#B37D56] text-white border-[#B37D56]"
                            : "border-[#B37D56]/10 text-[#2F2F2F] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {p.b}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {picking && (
                <div className="bg-[#FAF7F2] p-4 border border-[#B37D56]/20 animate-in slide-in-from-bottom-2 grid grid-cols-6 gap-2">
                  {(picking.t === "S" ? STEMS : BRANCHES).map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        const key = `${picking.p}${picking.t}` as keyof typeof fourPillars;
                        setFourPillars((prev) => ({ ...prev, [key]: val }));
                        if (picking.t === "S") setPicking({ ...picking, t: "B" });
                        else {
                          const idx = pillarsOrder.indexOf(picking.p);
                          if (idx < 3) setPicking({ p: pillarsOrder[idx + 1], t: "S" });
                          else setPicking(null);
                        }
                      }}
                      className="h-8 bg-white border border-[#B37D56]/10 text-[#2F2F2F] font-bold chinese-font hover:bg-[#B37D56] hover:text-white transition-all text-xs rounded-[2px] active:scale-95"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-[#FAF7F2] p-4 border border-[#B37D56]/20">
                <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-3">
                  反推匹配公历时间
                </p>
                {fourPillarsCandidates.length > 0 ? (
                  <div className="space-y-2">
                    {fourPillarsCandidates.slice(0, 6).map((st, idx) => {
                      const derived = deriveBaziPickerFromSolarTime(st);
                      const label = `${derived.solar.y} / ${pad2(derived.solar.m)} / ${pad2(derived.solar.d)}  ${pad2(derived.solar.h)}:${pad2(derived.solar.min)}`;
                      return (
                        <button
                          key={st.toString()}
                          type="button"
                          onClick={() => setSelectedCandidateIndex(idx)}
                          className={`w-full flex items-center justify-between px-4 py-3 bg-white border transition-all rounded-[2px] ${
                            selectedCandidateIndex === idx
                              ? "border-[#B37D56] text-[#2F2F2F]"
                              : "border-[#B37D56]/10 text-[#2F2F2F]/60 hover:border-[#B37D56]/30"
                          }`}
                        >
                          <span className="text-xs font-bold chinese-font">{label}</span>
                          <span
                            className={`w-4 h-4 border rounded-[1px] flex items-center justify-center ${
                              selectedCandidateIndex === idx
                                ? "bg-[#B37D56] border-[#B37D56]"
                                : "border-[#B37D56]/20"
                            }`}
                          >
                            {selectedCandidateIndex === idx ? (
                              <Check size={10} className="text-white" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                    {fourPillarsCandidates.length > 6 ? (
                      <p className="text-[10px] text-[#2F2F2F]/30 chinese-font pt-2">
                        仅展示前 6 个匹配（共 {fourPillarsCandidates.length} 个）。
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#2F2F2F]/30 chinese-font italic">
                    未找到可反推的公历时间，请调整四柱。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-8 pt-0">
          <button
            onClick={() => {
              if (tab === "fourPillars") {
                const picked = fourPillarsCandidates[selectedCandidateIndex];
                if (!picked) return;
                const derived = deriveBaziPickerFromSolarTime(picked);
                onConfirm({ tab, ...derived } as BaziTimePickerConfirmData);
              } else {
                onConfirm({ tab, solar, lunar, fourPillars } as BaziTimePickerConfirmData);
              }
              onClose();
            }}
            className="w-full h-12 bg-[#2F2F2F] text-white font-bold chinese-font tracking-[0.4em] rounded-[2px] hover:bg-black transition-all"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export function BaziEditView({
  id,
  embedded = false,
  aiPrefill,
  onSaved,
  redirectTo,
}: {
  id?: string;
  embedded?: boolean;
  aiPrefill?: (AiRecognizeBaziResult & { _nonce: number }) | null;
  onSaved?: () => void;
  redirectTo?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastStore();

  const records = useCaseStore((state) => state.records);
  const addRecord = useCaseStore((state) => state.addRecord);
  const updateRecord = useCaseStore((state) => state.updateRecord);
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);

  const [subject, setSubject] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [createCustomerAlso, setCreateCustomerAlso] = useState(false);
  const [recordDate, setRecordDate] = useState(() => nowBjIso());
  const [gender, setGender] = useState<"male" | "female">("male");
  const [location, setLocation] = useState("请选择地区");
  const [bazi, setBazi] = useState<Partial<BaZiData>>({
    yearStem: "乙",
    yearBranch: "酉",
    monthStem: "戊",
    monthBranch: "寅",
    dayStem: "丙",
    dayBranch: "戌",
    hourStem: "己",
    hourBranch: "丑",
    isDst: false,
    isTrueSolarTime: true,
    calendarType: "solar",
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const genderRef = useRef<HTMLDivElement | null>(null);
  const timeCardRef = useRef<HTMLDivElement | null>(null);
  const locationRowRef = useRef<HTMLDivElement | null>(null);
  const lastAppliedAiNonceRef = useRef<number | null>(null);

  useEffect(() => {
    if (id) return;
    const fromQuery = searchParams.get("customerId");
    if (!fromQuery) return;
    const cust = customers.find((c) => c.id === fromQuery);
    if (!cust) return;
    setCustomerId(cust.id);
    setSubject(cust.name);
    setGender(cust.gender === "female" ? "female" : "male");
    setCreateCustomerAlso(false);
  }, [id, searchParams, customers]);

  useEffect(() => {
    if (!id) return;
    const record = records.find((r) => r.id === id);
    if (record && record.module === "bazi" && record.baziData) {
      setSubject(record.subject);
      setCustomerId(record.customerId || "");
      setTags(record.tags ?? []);
      setBazi(record.baziData);
      setRecordDate(record.baziData.birthDate);
      setLocation(record.baziData.location || "请选择地区");
      const cust = customers.find((c) => c.id === record.customerId);
      if (cust) setGender(cust.gender === "female" ? "female" : "male");
    }
  }, [id, records, customers]);

  useEffect(() => {
    if (!aiPrefill) return;
    if (typeof aiPrefill._nonce !== "number") return;
    if (lastAppliedAiNonceRef.current === aiPrefill._nonce) return;
    lastAppliedAiNonceRef.current = aiPrefill._nonce;

    const nextName = typeof aiPrefill.name === "string" ? aiPrefill.name.trim() : "";
    const nextGender = aiPrefill.gender;
    const nextLocation = typeof aiPrefill.location === "string" ? aiPrefill.location.trim() : "";

    if (nextName && !subject.trim()) setSubject(nextName);
    if (nextGender === "male" || nextGender === "female") setGender(nextGender);
    if (nextLocation) setLocation(nextLocation);

    const solar = aiPrefill.solar;
    if (
      solar &&
      Number.isInteger(solar.y) &&
      Number.isInteger(solar.m) &&
      Number.isInteger(solar.d) &&
      Number.isInteger(solar.h) &&
      Number.isInteger(solar.min)
    ) {
      const derived = deriveBaziPickerFromSolar({
        y: solar.y,
        m: solar.m,
        d: solar.d,
        h: solar.h,
        min: solar.min,
      });
      setBazi((prev) => ({
        ...prev,
        yearStem: derived.fourPillars.yS,
        yearBranch: derived.fourPillars.yB,
        monthStem: derived.fourPillars.mS,
        monthBranch: derived.fourPillars.mB,
        dayStem: derived.fourPillars.dS,
        dayBranch: derived.fourPillars.dB,
        hourStem: derived.fourPillars.hS,
        hourBranch: derived.fourPillars.hB,
        calendarType: "solar",
      }));
      setRecordDate(toBjIsoFromSolar(derived.solar));
    } else if (aiPrefill.fourPillars) {
      const fp = aiPrefill.fourPillars;
      const yS = typeof fp.yearStem === "string" ? fp.yearStem.trim() : "";
      const yB = typeof fp.yearBranch === "string" ? fp.yearBranch.trim() : "";
      const mS = typeof fp.monthStem === "string" ? fp.monthStem.trim() : "";
      const mB = typeof fp.monthBranch === "string" ? fp.monthBranch.trim() : "";
      const dS = typeof fp.dayStem === "string" ? fp.dayStem.trim() : "";
      const dB = typeof fp.dayBranch === "string" ? fp.dayBranch.trim() : "";
      const hS = typeof fp.hourStem === "string" ? fp.hourStem.trim() : "";
      const hB = typeof fp.hourBranch === "string" ? fp.hourBranch.trim() : "";

      const canApply =
        STEMS.includes(yS) &&
        BRANCHES.includes(yB) &&
        STEMS.includes(mS) &&
        BRANCHES.includes(mB) &&
        STEMS.includes(dS) &&
        BRANCHES.includes(dB) &&
        STEMS.includes(hS) &&
        BRANCHES.includes(hB);

      if (canApply) {
        setBazi((prev) => ({
          ...prev,
          yearStem: yS,
          yearBranch: yB,
          monthStem: mS,
          monthBranch: mB,
          dayStem: dS,
          dayBranch: dB,
          hourStem: hS,
          hourBranch: hB,
          calendarType: "fourPillars",
        }));
      }
    }

    window.setTimeout(() => {
      scrollAndFlash(nameInputRef.current);
      scrollAndFlash(genderRef.current);
      scrollAndFlash(timeCardRef.current);
      scrollAndFlash(locationRowRef.current);
    }, 0);
  }, [aiPrefill, subject]);

  const handleTimePickerConfirm = (data: BaziTimePickerConfirmData) => {
    setBazi((prev) => ({
      ...prev,
      yearStem: data.fourPillars.yS,
      yearBranch: data.fourPillars.yB,
      monthStem: data.fourPillars.mS,
      monthBranch: data.fourPillars.mB,
      dayStem: data.fourPillars.dS,
      dayBranch: data.fourPillars.dB,
      hourStem: data.fourPillars.hS,
      hourBranch: data.fourPillars.hB,
      calendarType: data.tab,
    }));
    setRecordDate(toBjIsoFromSolar(data.solar));
    toast.show("时间已更新", "info");
  };

  const addTagsFromText = React.useCallback(
    (input: string) => {
      const parts = input
        .split(/[,\s，]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (parts.length === 0) return;

      const next: string[] = [];
      const seen = new Set<string>();
      for (const t of [...tags, ...parts]) {
        const normalized = t.trim();
        if (!normalized) continue;
        if (normalized.length > 32) {
          toast.show("标签过长（最多 32 字）", "warning");
          continue;
        }
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        next.push(normalized);
        if (next.length >= 50) break;
      }

      if (next.length >= 50) toast.show("标签过多（最多 50 个）", "warning");
      setTags(next);
    },
    [tags, toast],
  );

  const handleSave = async () => {
    const baziData = { ...(bazi as BaZiData), birthDate: recordDate, location };
    try {
      if (id) {
        await updateRecord(id, { module: "bazi", subject, customerId, tags, baziData });
        toast.show("已保存", "success");
      } else {
        let resolvedCustomerId = customerId;
        if (createCustomerAlso && !resolvedCustomerId) {
          const name = subject.trim();
          if (!name) {
            toast.show("请输入姓名", "error");
            return;
          }

          const m = recordDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
          const birthDate = m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
          const birthTime = m ? `${m[4]}:${m[5]}` : undefined;

          resolvedCustomerId = await addCustomer({
            name,
            gender,
            birthDate,
            birthTime,
            tags: [],
            notes: "",
            customFields: {},
          });
          setCustomerId(resolvedCustomerId);
        }

        const fallbackTitle = resolvedCustomerId
          ? `${customers.find((c) => c.id === resolvedCustomerId)?.name || "缘主"}的命例`
          : "未命名命例";
        await addRecord({
          customerId: resolvedCustomerId,
          module: "bazi",
          subject: subject || fallbackTitle,
          notes: "",
          tags,
          baziData,
          verifiedStatus: "unverified",
          verifiedNotes: "",
        });
        toast.show("录入成功", "success");
      }
      onSaved?.();
      if (redirectTo === null) return;
      router.push(redirectTo ?? "/bazi");
    } catch {
      toast.show("保存失败，请稍后重试", "error");
    }
  };

  const dateParts = useMemo(() => {
    const m = recordDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (m) {
      const date = `${m[1]} / ${m[2]} / ${m[3]}`;
      const time = `${m[4]}:${m[5]}`;
      return { date, time };
    }

    const d = new Date(recordDate);
    const date = `${d.getFullYear()} / ${pad2(d.getMonth() + 1)} / ${pad2(d.getDate())}`;
    const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return { date, time };
  }, [recordDate]);

	  return (
	    <div
	      className={`w-full max-w-none animate-in fade-in duration-500 ${
	        embedded ? "space-y-6" : "space-y-8 pb-20"
	      }`}
	    >
      {!embedded ? (
        <header className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black text-white rounded-none flex items-center justify-center shrink-0 rotate-45">
            <Hash size={18} className="-rotate-45" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#2F2F2F] chinese-font tracking-tight">
              八字推演
            </h2>
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest opacity-60">
              Professional Bazi Engine
            </p>
          </div>
        </header>
      ) : null}

	      <div
	        className={
	          embedded
	            ? "space-y-8"
	            : "bg-white rounded-[4px] border border-[#B37D56]/20 shadow-none relative p-10 space-y-12"
	        }
	      >
	        {!embedded ? (
	          <>
	            <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-[#B37D56]/10 pointer-events-none" />
	            <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-[#B37D56]/10 pointer-events-none" />
	          </>
	        ) : null}
	
	        <div
	          className={`grid items-end ${
	            embedded ? "grid-cols-1 gap-6" : "grid-cols-1 md:grid-cols-2 gap-8"
	          }`}
        >
          <div className="space-y-2">
            <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest ml-1">
              姓名
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="输入姓名"
              className="w-full bg-transparent border-b border-[#B37D56]/10 py-2 outline-none focus:border-[#B37D56] transition-all chinese-font font-bold text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest ml-1">
              性别
            </label>
            <div ref={genderRef} className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "male", l: "乾造" },
                  { id: "female", l: "坤造" },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`w-full py-2.5 rounded-[2px] text-xs chinese-font border transition-all font-bold ${
                    gender === g.id
                      ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                      : "bg-white border-[#B37D56]/20 text-[#2F2F2F]/40 hover:border-[#B37D56]/40"
                  }`}
                >
                  {g.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest ml-1">
              标签
            </label>
            {tags.length > 0 ? (
              <button
                type="button"
                onClick={() => setTags([])}
                className="text-[10px] font-bold tracking-widest text-[#2F2F2F]/30 hover:text-[#A62121] transition-colors"
              >
                清空
              </button>
            ) : null}
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 border border-[#B37D56]/10 bg-[#FAF7F2] text-[#2F2F2F]/70 font-bold tracking-widest rounded-[2px] hover:border-[#A62121]/30 hover:text-[#A62121] transition-colors"
                >
                  {tag}
                  <X size={12} className="opacity-40" />
                </button>
              ))}
            </div>
          ) : null}

          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTagsFromText(tagDraft);
                setTagDraft("");
                return;
              }
              if (e.key === "Backspace" && tagDraft.length === 0 && tags.length > 0) {
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            placeholder="输入标签，回车添加（支持逗号/空格分隔）"
            className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px] outline-none focus:border-[#A62121] transition-colors chinese-font"
          />
          <p className="text-[10px] text-[#2F2F2F]/30 chinese-font ml-1">最多 50 个，每个最多 32 字。</p>
        </div>

        <div
          className={`w-full flex flex-col gap-4 ${
            embedded ? "" : "md:flex-row md:items-stretch"
          }`}
        >
          <div
            ref={timeCardRef}
            role="button"
            tabIndex={0}
            onClick={() => setShowTimePicker(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowTimePicker(true);
            }}
            className={`flex items-center gap-4 flex-1 min-w-0 cursor-pointer bg-[#FAF7F2] hover:bg-white/80 rounded-[4px] transition-colors ${
              embedded ? "px-5 py-4" : "px-8 py-5"
            }`}
          >
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="w-10 h-10 bg-white border border-[#B37D56]/20 flex items-center justify-center text-[#B37D56] shrink-0 rounded-[2px]">
                <CalendarDays size={18} />
              </div>
              <div className="flex items-center gap-4 flex-nowrap whitespace-nowrap overflow-hidden">
                {bazi.calendarType === "fourPillars" ? (
                  <div className="flex gap-3 items-center">
                    {[
                      { s: bazi.yearStem, b: bazi.yearBranch },
                      { s: bazi.monthStem, b: bazi.monthBranch },
                      { s: bazi.dayStem, b: bazi.dayBranch },
                      { s: bazi.hourStem, b: bazi.hourBranch },
                    ].map((p, i) => (
                      <span
                        key={i}
                        className={`font-bold text-[#2F2F2F] chinese-font ${embedded ? "text-lg" : "text-xl"}`}
                      >
                        {p.s}
                        {p.b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={`${embedded ? "flex flex-col gap-1" : "flex items-center gap-4"}`}>
                    <span
                      className={`font-bold text-[#2F2F2F] chinese-font tracking-tight shrink-0 ${
                        embedded ? "text-xl" : "text-2xl"
                      }`}
                    >
                      {dateParts.date}
                    </span>
                    <span className="text-base font-bold text-[#B37D56] chinese-font opacity-60 shrink-0">
                      {dateParts.time}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

	          <div
	            className={`grid grid-cols-2 gap-3 items-center ${
	              embedded ? "" : "md:w-[260px] md:shrink-0"
	            }`}
	          >
	            <button
	              type="button"
	              onClick={() => setBazi({ ...bazi, isDst: !bazi.isDst })}
	              className="w-full flex items-center gap-2 text-[10px] font-bold chinese-font tracking-widest text-[#2F2F2F]/40 hover:text-[#2F2F2F] transition-colors"
	            >
              <div
                className={`w-4 h-4 rounded-[1px] border flex items-center justify-center transition-all ${
                  bazi.isDst ? "bg-[#B37D56] border-[#B37D56]" : "border-[#B37D56]/20"
                }`}
              >
                {bazi.isDst ? <Check size={10} className="text-white" /> : null}
              </div>
              夏令时
            </button>
            <button
              type="button"
              onClick={() => setBazi({ ...bazi, isTrueSolarTime: !bazi.isTrueSolarTime })}
              className="w-full flex items-center gap-2 text-[10px] font-bold chinese-font tracking-widest text-[#2F2F2F]/40 hover:text-[#2F2F2F] transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-[1px] border flex items-center justify-center transition-all ${
                  bazi.isTrueSolarTime ? "bg-[#B37D56] border-[#B37D56]" : "border-[#B37D56]/20"
                }`}
              >
                {bazi.isTrueSolarTime ? <Check size={10} className="text-white" /> : null}
              </div>
	              真太阳时
	            </button>
	          </div>
	        </div>

        <div
          ref={locationRowRef}
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setShowLocPicker(true)}
        >
          <MapPin
            size={16}
            className="text-[#B37D56]/40 group-hover:text-[#B37D56] transition-colors shrink-0"
          />
          <span
            className={`flex-1 border-b border-[#B37D56]/10 py-2 text-xs chinese-font transition-all ${
              location === "请选择地区" ? "text-[#2F2F2F]/20" : "text-[#2F2F2F]"
            }`}
          >
            {location === "请选择地区" ? "请选择出生地" : location}
          </span>
        </div>

        <div className={`pt-6 ${embedded ? "mt-2" : "pt-8"} border-t border-[#B37D56]/10`}>
          <div
            className={`grid grid-cols-1 gap-4 items-start ${
              embedded ? "" : "md:grid-cols-2"
            }`}
          >
            <div className={`grid gap-3 ${id ? "grid-cols-1" : "grid-cols-2"} items-center`}>
              <div className="relative w-full">
                <select
                  value={customerId}
                  disabled={!id && createCustomerAlso}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const cust = customers.find((c) => c.id === nextId);
                    if (cust) {
                      setCustomerId(cust.id);
                      setSubject(cust.name);
                      setGender(cust.gender === "female" ? "female" : "male");
                      setCreateCustomerAlso(false);
                    } else {
                      setCustomerId("");
                    }
                  }}
                  className={`w-full border border-[#B37D56]/10 px-4 py-3 rounded-[2px] outline-none text-xs chinese-font appearance-none transition-colors ${
                    !id && createCustomerAlso
                      ? "bg-[#FAF7F2]/40 text-[#2F2F2F]/30 cursor-not-allowed"
                      : "bg-[#FAF7F2] cursor-pointer hover:bg-[#FAF7F2]/80"
                  }`}
                >
                  <option value="">-- 关联已有档案 --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B37D56]/30 rotate-90 pointer-events-none"
                  size={14}
                />
              </div>

              {!id ? (
                <button
                  type="button"
                  onClick={() => {
                    if (customerId) return;
                    setCreateCustomerAlso((v) => {
                      const next = !v;
                      if (next) setCustomerId("");
                      return next;
                    });
                  }}
                  className={`w-full h-[44px] border px-3 rounded-[2px] flex items-center gap-2 text-[10px] font-bold chinese-font tracking-widest transition-colors ${
                    customerId
                      ? "bg-[#FAF7F2]/40 border-[#B37D56]/10 text-[#2F2F2F]/20 cursor-not-allowed"
                      : "bg-white border-[#B37D56]/20 text-[#2F2F2F]/40 hover:border-[#A62121] hover:text-[#2F2F2F]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-[1px] border flex items-center justify-center transition-all ${
                      createCustomerAlso
                        ? "bg-[#B37D56] border-[#B37D56]"
                        : customerId
                          ? "border-[#B37D56]/10"
                          : "border-[#B37D56]/20"
                    }`}
                  >
                    {createCustomerAlso ? <Check size={10} className="text-white" /> : null}
                  </div>
                  同时创建缘主档案
                </button>
              ) : null}
            </div>

            <button
              onClick={() => void handleSave()}
              className="w-full h-12 md:h-[52px] bg-[#2F2F2F] text-white rounded-[2px] text-lg font-bold chinese-font tracking-[0.6em] hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center shadow-none"
            >
              {id ? "保存" : "立即排盘"}
            </button>
          </div>
        </div>
      </div>

      <BaziTimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimePickerConfirm}
      />
      <LocationPickerModal
        isOpen={showLocPicker}
        onClose={() => setShowLocPicker(false)}
        onConfirm={setLocation}
        initialLocation={location}
      />
    </div>
  );
}
