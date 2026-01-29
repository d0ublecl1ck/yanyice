"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Hash,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useToastStore } from "@/stores/useToastStore";
import type { BaZiData } from "@/lib/types";
import { BRANCHES, STEMS } from "@/lib/constants";

const PROVINCES = ["北京市", "上海市", "天津市", "广东省", "江苏省", "浙江省", "四川省"];
const CITIES: Record<string, string[]> = {
  北京市: ["北京市"],
  上海市: ["上海市"],
  天津市: ["天津市"],
  广东省: ["广州市", "深圳市", "珠海市", "佛山市"],
  浙江省: ["杭州市", "宁波市", "温州市"],
  江苏省: ["南京市", "苏州市", "无锡市"],
  四川省: ["成都市", "绵阳市", "德阳市"],
};
const DISTRICTS: Record<string, string[]> = {
  广州市: ["越秀区", "荔湾区", "海珠区", "天河区", "白云区"],
  深圳市: ["罗湖区", "福田区", "南山区", "宝安区"],
  杭州市: ["西湖区", "上城区", "拱墅区"],
  南京市: ["玄武区", "鼓楼区", "秦淮区"],
  成都市: ["锦江区", "青羊区", "武侯区"],
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

const PickerColumn = ({
  items,
  value,
  onChange,
  label,
  showDivider = true,
}: {
  items: string[] | number[];
  value: string | number;
  onChange: (val: string | number) => void;
  label: string;
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
                key={item}
                onClick={() => onChange(item)}
                data-picker-item="1"
                data-picker-value={String(item)}
                className={`w-full py-2 text-center transition-all duration-300 snap-center chinese-font outline-none ${
                  item.toString() === value.toString()
                    ? "text-[#2F2F2F] font-bold text-base"
                    : "text-[#2F2F2F]/10 text-xs hover:text-[#2F2F2F]/30"
                }`}
              >
                {item}
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (loc: string) => void;
}) => {
  const [regionType, setRegionType] = useState<"domestic" | "overseas">("domestic");
  const [prov, setProv] = useState("北京市");
  const [city, setCity] = useState("北京市");
  const [dist, setDist] = useState("--");

  const availableCities = CITIES[prov] || ["--"];
  const availableDists = DISTRICTS[city] || ["--"];

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
              placeholder="搜索全国城市及地区"
              className="w-full bg-[#FAF7F2] border border-[#B37D56]/10 pl-9 pr-4 py-2 text-xs rounded-[4px] outline-none focus:border-[#B37D56] transition-all"
            />
          </div>
        </div>

        <div className="p-8 flex justify-between min-h-[240px]">
          <PickerColumn
            label="省份"
            items={PROVINCES}
            value={prov}
            onChange={(v) => {
              const p = String(v);
              setProv(p);
              setCity(CITIES[p]?.[0] || "--");
            }}
          />
          <PickerColumn
            label="城市"
            items={availableCities}
            value={city}
            onChange={(v) => {
              const c = String(v);
              setCity(c);
              setDist(DISTRICTS[c]?.[0] || "--");
            }}
          />
          <PickerColumn
            label="区县"
            items={availableDists}
            value={dist}
            onChange={(v) => setDist(String(v))}
            showDivider={false}
          />
        </div>

        <div className="p-8 pt-0">
          <button
            onClick={() => {
              onConfirm(`${prov} ${city} ${dist}`);
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

  const handleNow = () => {
    const now = new Date();
    onConfirm({
      tab: "solar",
      solar: {
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
        h: now.getHours(),
        min: now.getMinutes(),
      },
      lunar,
      fourPillars,
    });
    onClose();
  };

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
          {tab === "solar" && (
            <div className="flex justify-between">
              <PickerColumn
                label="年"
                items={Array.from({ length: 121 }, (_, i) => 1900 + i)}
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
                items={Array.from({ length: 121 }, (_, i) => 1900 + i)}
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
            </div>
          )}
        </div>
        <div className="p-8 pt-0">
          <button
            onClick={() => {
              onConfirm({ tab, solar, lunar, fourPillars } as BaziTimePickerConfirmData);
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

export function BaziEditView({ id }: { id?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastStore();

  const records = useCaseStore((state) => state.records);
  const addRecord = useCaseStore((state) => state.addRecord);
  const updateRecord = useCaseStore((state) => state.updateRecord);
  const customers = useCustomerStore((state) => state.customers);

  const [subject, setSubject] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString());
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

  useEffect(() => {
    if (id) return;
    const fromQuery = searchParams.get("customerId");
    if (!fromQuery) return;
    const cust = customers.find((c) => c.id === fromQuery);
    if (!cust) return;
    setCustomerId(cust.id);
    setSubject(cust.name);
    setGender(cust.gender === "female" ? "female" : "male");
  }, [id, searchParams, customers]);

  useEffect(() => {
    if (!id) return;
    const record = records.find((r) => r.id === id);
    if (record && record.module === "bazi" && record.baziData) {
      setSubject(record.subject);
      setCustomerId(record.customerId || "");
      setBazi(record.baziData);
      setRecordDate(record.baziData.birthDate);
      setLocation(record.baziData.location || "请选择地区");
      const cust = customers.find((c) => c.id === record.customerId);
      if (cust) setGender(cust.gender === "female" ? "female" : "male");
    }
  }, [id, records, customers]);

  const handleTimePickerConfirm = (data: BaziTimePickerConfirmData) => {
    if (data.tab === "fourPillars") {
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
        calendarType: "fourPillars",
      }));
    } else {
      const dateStr = `${data.solar.y}-${pad2(data.solar.m)}-${pad2(data.solar.d)}T${pad2(data.solar.h)}:${pad2(data.solar.min)}:00`;
      setRecordDate(new Date(dateStr).toISOString());
      setBazi((prev) => ({ ...prev, calendarType: data.tab }));
    }
    toast.show("时间已更新", "info");
  };

  const handleSave = () => {
    const baziData = { ...(bazi as BaZiData), birthDate: recordDate, location };
    if (id) {
      updateRecord(id, { module: "bazi", subject, customerId, baziData });
      toast.show("已保存", "success");
    } else {
      const fallbackTitle = customerId
        ? `${customers.find((c) => c.id === customerId)?.name || "客户"}的命例`
        : "未命名命例";
      addRecord({
        customerId,
        module: "bazi",
        subject: subject || fallbackTitle,
        notes: "",
        tags: [],
        baziData,
        verifiedStatus: "unverified",
        verifiedNotes: "",
      });
      toast.show("录入成功", "success");
    }
    router.push("/bazi");
  };

  const dateParts = useMemo(() => {
    const d = new Date(recordDate);
    const date = `${d.getFullYear()} / ${pad2(d.getMonth() + 1)} / ${pad2(d.getDate())}`;
    const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return { date, time };
  }, [recordDate]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
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

      <div className="bg-white p-10 rounded-[4px] border border-[#B37D56]/20 shadow-none space-y-12 relative">
        <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-[#B37D56]/10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-[#B37D56]/10 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-end">
          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest ml-1">
              命主姓名 / 卷首语
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="输入姓名或事由"
              className="w-full bg-transparent border-b border-[#B37D56]/10 py-2 outline-none focus:border-[#B37D56] transition-all chinese-font font-bold text-lg"
            />
          </div>
          <div className="md:col-span-2 relative">
            <select
              value={customerId}
              onChange={(e) => {
                const cust = customers.find((c) => c.id === e.target.value);
                if (cust) {
                  setCustomerId(cust.id);
                  setSubject(cust.name);
                  setGender(cust.gender === "female" ? "female" : "male");
                } else {
                  setCustomerId("");
                }
              }}
              className="w-full bg-[#FAF7F2] border border-[#B37D56]/10 px-4 py-3 rounded-[2px] outline-none text-xs chinese-font appearance-none cursor-pointer hover:bg-[#FAF7F2]/80 transition-colors"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex gap-4">
            {(
              [
                { id: "male", l: "乾造" },
                { id: "female", l: "坤造" },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                onClick={() => setGender(g.id)}
                className={`px-8 py-2.5 rounded-[2px] text-xs chinese-font border transition-all ${
                  gender === g.id
                    ? "bg-[#2F2F2F] text-white border-[#2F2F2F]"
                    : "border-[#B37D56]/20 text-[#2F2F2F]/40 hover:border-[#B37D56]/40"
                }`}
              >
                {g.l}
              </button>
            ))}
          </div>
          <div
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
        </div>

        <div
          onClick={() => setShowTimePicker(true)}
          className="w-full bg-[#FAF7F2] hover:bg-white border border-[#B37D56]/15 py-5 px-8 rounded-[4px] cursor-pointer group transition-all flex items-center justify-between gap-4"
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
                    <span key={i} className="text-xl font-bold text-[#2F2F2F] chinese-font">
                      {p.s}
                      {p.b}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-[#2F2F2F] chinese-font tracking-tight shrink-0">
                    {dateParts.date}
                  </span>
                  <span className="text-base font-bold text-[#B37D56] chinese-font opacity-60 shrink-0">
                    {dateParts.time}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0 border-l border-[#B37D56]/10 pl-5 h-8">
            <div className="text-[#B37D56]/30 group-hover:text-[#B37D56] group-hover:rotate-180 transition-all duration-700">
              <RefreshCw size={14} />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-10 pt-2">
          <button
            type="button"
            onClick={() => setBazi({ ...bazi, isDst: !bazi.isDst })}
            className="flex items-center gap-2 text-[10px] font-bold chinese-font tracking-widest text-[#2F2F2F]/40 hover:text-[#2F2F2F] transition-colors"
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
            className="flex items-center gap-2 text-[10px] font-bold chinese-font tracking-widest text-[#2F2F2F]/40 hover:text-[#2F2F2F] transition-colors"
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

      <button
        onClick={handleSave}
        className="w-full h-16 bg-[#2F2F2F] text-white rounded-[2px] text-xl font-bold chinese-font tracking-[0.6em] hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center shadow-lg"
      >
        立即排盘
      </button>

      <BaziTimePickerModal
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimePickerConfirm}
      />
      <LocationPickerModal
        isOpen={showLocPicker}
        onClose={() => setShowLocPicker(false)}
        onConfirm={setLocation}
      />
    </div>
  );
}
