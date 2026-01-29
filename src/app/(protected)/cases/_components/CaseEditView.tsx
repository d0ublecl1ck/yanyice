"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Save, 
  Sparkles, 
  Plus, 
  X,
  Search,
  RefreshCw
} from 'lucide-react';
import { useCaseStore } from '@/stores/useCaseStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useToastStore } from '@/stores/useToastStore';
import { LineType, LiuYaoData, BaZiData } from '@/lib/types';
import { LINE_SYMBOLS, BRANCHES, STEMS } from '@/lib/constants';
import { loadLocationPickerSchema, findSelectionByNames, formatSelection } from '@/lib/locationData';
import { filterCities, filterDistricts, filterProvinces, type LocationNode } from '@/lib/locationSearch';
import { ChineseDatePicker } from '@/components/ChineseDatePicker';
import { ChineseTimePicker } from '@/components/ChineseTimePicker';

const pad2 = (n: number) => n.toString().padStart(2, '0');

const isoTimeToHHmm = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const setIsoTime = (iso: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map((v) => Number(v));
  const d = new Date(iso);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
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
  open,
  initial,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initial?: string;
  onClose: () => void;
  onConfirm: (loc: string) => void;
}) => {
  const [regionType, setRegionType] = useState<"domestic" | "overseas">("domestic");
  const [schema, setSchema] = useState<Awaited<ReturnType<typeof loadLocationPickerSchema>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [level1Id, setLevel1Id] = useState<string>("");
  const [level2Id, setLevel2Id] = useState<string>("");
  const [level3Id, setLevel3Id] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    loadLocationPickerSchema(regionType)
      .then((s) => setSchema(s))
      .finally(() => setIsLoading(false));
  }, [open, regionType]);

  useEffect(() => {
    if (!open || !schema) return;
    const [a, b, c] = (initial || "").split(" ").filter(Boolean);
    const found = findSelectionByNames(schema, { level1: a, level2: b, level3: c });
    if (found.level1Id) setLevel1Id(found.level1Id);
    if (found.level2Id) setLevel2Id(found.level2Id);
    if (found.level3Id) setLevel3Id(found.level3Id);
  }, [open, initial, schema]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open, regionType]);

  const filteredLevel1 = useMemo(
    () => (schema ? filterProvinces(schema.hierarchy, query) : []),
    [schema, query],
  );

  const filteredLevel2 = useMemo(
    () => (schema && level1Id ? filterCities(schema.hierarchy, level1Id, query) : []),
    [schema, level1Id, query],
  );

  const filteredLevel3 = useMemo(
    () => (schema && level2Id ? filterDistricts(schema.hierarchy, level2Id, query) : []),
    [schema, level2Id, query],
  );

  useEffect(() => {
    if (!open) return;
    if (filteredLevel1.length === 0) return;
    if (!filteredLevel1.some((n) => n.id === level1Id)) setLevel1Id(filteredLevel1[0].id);
  }, [filteredLevel1, level1Id, open]);

  useEffect(() => {
    if (!open) return;
    if (filteredLevel2.length === 0) return;
    if (!filteredLevel2.some((n) => n.id === level2Id)) setLevel2Id(filteredLevel2[0].id);
  }, [filteredLevel2, level2Id, open]);

  useEffect(() => {
    if (!open) return;
    if (filteredLevel3.length === 0) return;
    if (!filteredLevel3.some((n) => n.id === level3Id)) setLevel3Id(filteredLevel3[0].id);
  }, [filteredLevel3, level3Id, open]);

  const highlight = useMemo(() => {
    const q = query.trim();
    if (!q) return undefined;

    const qLower = q.toLowerCase();
    function renderHighlightedText(labelText: string) {
      const lower = labelText.toLowerCase();
      const idx = lower.indexOf(qLower);
      if (idx < 0) return labelText;

      const before = labelText.slice(0, idx);
      const match = labelText.slice(idx, idx + q.length);
      const after = labelText.slice(idx + q.length);
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

  if (!open) return null;

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
                items={filteredLevel1}
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
                items={filteredLevel2}
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
                items={filteredLevel3}
                value={level3Id}
                onChange={(v) => setLevel3Id(String(v))}
                showDivider={false}
                renderItem={highlight}
              />
            </>
          )}
        </div>

        <div className="p-6 pt-0">
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

export const CaseEditView: React.FC<{ id?: string }> = ({ id }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastStore();
  const records = useCaseStore(state => state.records);
  const addRecord = useCaseStore(state => state.addRecord);
  const updateRecord = useCaseStore(state => state.updateRecord);
  const { customers } = useCustomerStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [module, setModule] = useState<'liuyao' | 'bazi'>('liuyao');
  const [subject, setSubject] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString());
  const [notes, setNotes] = useState('');
  
  // 六爻专有状态
  const [lines, setLines] = useState<LineType[]>([0, 0, 0, 0, 0, 0]);
  const [monthBranch, setMonthBranch] = useState('子');
  const [dayBranch, setDayBranch] = useState('子');

  // 八字专有状态
  const [bazi, setBazi] = useState<Partial<BaZiData>>({
    yearStem: '甲', yearBranch: '子',
    monthStem: '甲', monthBranch: '子',
    dayStem: '甲', dayBranch: '子',
    hourStem: '甲', hourBranch: '子',
    calendarType: 'solar',
    birthDate: new Date().toISOString(),
    location: '请选择地区',
    isDst: false,
    isTrueSolarTime: true,
    isEarlyLateZi: false,
  });
  const [baziBirthTime, setBaziBirthTime] = useState(() => isoTimeToHHmm(new Date().toISOString()));
  const [showLocPicker, setShowLocPicker] = useState(false);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');

  useEffect(() => {
    if (id) return;
    const moduleParam = searchParams.get('module');
    const customerParam = searchParams.get('customerId');

    if (moduleParam === 'bazi') {
      setIsRedirecting(true);
      const qs = new URLSearchParams();
      if (customerParam) qs.set('customerId', customerParam);
      router.replace(qs.size ? `/bazi/new?${qs.toString()}` : '/bazi/new');
      return;
    }

    if (moduleParam === 'liuyao' || moduleParam === 'bazi') setModule(moduleParam);
    if (customerParam) setCustomerId(customerParam);
  }, [id, router, searchParams]);

  useEffect(() => {
    if (id) {
      const record = records.find(r => r.id === id);
      if (record) {
        if (record.module === 'bazi') {
          setIsRedirecting(true);
          router.replace(`/bazi/edit/${id}`);
          return;
        }
        setModule(record.module);
        setSubject(record.subject);
        setCustomerId(record.customerId);
        setNotes(record.notes);
        if (record.liuyaoData) {
          setLines([...record.liuyaoData.lines]);
          setMonthBranch(record.liuyaoData.monthBranch);
          setDayBranch(record.liuyaoData.dayBranch);
          setRecordDate(record.liuyaoData.date);
        }
        if (record.baziData) {
          setBazi(record.baziData);
          setBaziBirthTime(isoTimeToHHmm(record.baziData.birthDate));
        }
      }
    }
  }, [id, records, router]);

  if (isRedirecting) return null;

  const handleLineToggle = (index: number) => {
    const newLines = [...lines];
    newLines[index] = (newLines[index] + 1) % 4;
    setLines(newLines);
  };

  const handleBaziChange = (field: keyof BaZiData, val: string) => {
    setBazi(prev => ({ ...prev, [field]: val }));
  };

  const handleBaziBirthDateChange = (iso: string) => {
    setBazi((prev) => ({ ...prev, birthDate: iso, calendarType: prev.calendarType ?? 'solar' }));
    setBaziBirthTime(isoTimeToHHmm(iso));
  };

  const handleBaziBirthTimeChange = (hhmm: string) => {
    setBaziBirthTime(hhmm);
    setBazi((prev) => {
      const base = prev.birthDate || new Date().toISOString();
      return { ...prev, birthDate: setIsoTime(base, hhmm), calendarType: prev.calendarType ?? 'solar' };
    });
  };

  const importFromCustomer = () => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      toast.show('请先选择客户', 'warning');
      return;
    }
    if (!customer.birthDate) {
      toast.show('该客户未录入出生日期', 'warning');
      return;
    }

    const rawDate = customer.birthDate;
    const rawTime = customer.birthTime || '00:00';
    const iso = rawDate.includes('T')
      ? rawDate
      : new Date(`${rawDate}T${rawTime}:00`).toISOString();

    setBazi((prev) => ({
      ...prev,
      birthDate: iso,
      calendarType: prev.calendarType ?? 'solar',
    }));
    setBaziBirthTime(isoTimeToHHmm(iso) || rawTime);
    toast.show(`已导入客户 ${customer.name} 生辰信息`, 'success');
  };

  const handleSave = () => {
    if (!customerId) {
      toast.show('请选择关联客户', 'error');
      return;
    }
    if (!subject) {
      toast.show('请填写咨询主题', 'error');
      return;
    }

    const liuyaoData: LiuYaoData | undefined = module === 'liuyao' ? {
      lines,
      date: recordDate,
      subject,
      monthBranch,
      dayBranch
    } : undefined;

    const baziData: BaZiData | undefined = module === 'bazi' ? bazi as BaZiData : undefined;

    if (id) {
      updateRecord(id, { subject, customerId, notes, module, liuyaoData, baziData });
      toast.show('卷宗已成功更新', 'success');
    } else {
      addRecord({
        customerId,
        module,
        subject,
        notes,
        tags: [],
        liuyaoData,
        baziData,
        verifiedStatus: 'unverified',
        verifiedNotes: ''
      });
      toast.show('新咨询已归档入册', 'success');
    }
    router.push('/cases');
  };

  return (
    <div className="space-y-10">
      <LocationPickerModal
        open={showLocPicker}
        initial={bazi.location as string}
        onClose={() => setShowLocPicker(false)}
        onConfirm={(loc) => setBazi((prev) => ({ ...prev, location: loc }))}
      />
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#B37D56]/10 flex justify-between items-center">
              <p className="text-xs font-bold tracking-widest chinese-font text-[#2F2F2F] flex items-center gap-2">
                <UserPlus size={16} />
                快速创建客户
              </p>
              <button
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-[#2F2F2F]/20 hover:text-[#A62121]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">姓名</label>
                <input
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="请输入客户姓名"
                  className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px] outline-none focus:border-[#A62121] transition-colors chinese-font"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">性别/造化</label>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setQuickGender(g)}
                      className={`px-4 py-2 text-xs border font-bold transition-all rounded-[2px] ${
                        quickGender === g
                          ? 'bg-[#2F2F2F] text-white border-[#2F2F2F]'
                          : 'border-[#B37D56]/20 text-[#2F2F2F]/50 hover:border-[#A62121]'
                      }`}
                    >
                      {g === 'male' ? '乾造' : '坤造'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const name = quickName.trim();
                  if (!name) {
                    toast.show('请先填写客户姓名', 'warning');
                    return;
                  }
                  const newId = addCustomer({
                    id: `cust-${Math.random().toString(36).slice(2, 9)}`,
                    name,
                    gender: quickGender,
                    tags: [],
                    notes: '',
                    customFields: {},
                  });
                  setCustomerId(newId);
                  setQuickName('');
                  setQuickGender('male');
                  setShowQuickCustomerModal(false);
                  toast.show('客户已创建并已自动选择', 'success');
                }}
                className="w-full h-12 bg-[#2F2F2F] text-white font-bold chinese-font tracking-[0.4em] rounded-[2px] hover:bg-black transition-all"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header & Module Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#B37D56]/10 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">
            {id ? '编辑卷宗' : '录入新咨询'}
          </h2>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setModule('liuyao')}
              className={`px-6 py-2 text-xs font-bold tracking-widest transition-all rounded-none border ${module === 'liuyao' ? 'bg-[#A62121] text-white border-[#A62121]' : 'bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]'}`}
            >
              六爻模式
            </button>
            <button 
              onClick={() => setModule('bazi')}
              className={`px-6 py-2 text-xs font-bold tracking-widest transition-all rounded-none border ${module === 'bazi' ? 'bg-[#A62121] text-white border-[#A62121]' : 'bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]'}`}
            >
              八字模式
            </button>
          </div>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-[#8DA399]/5 text-[#8DA399] border border-[#8DA399]/20 font-bold hover:bg-[#8DA399]/10 transition-all chinese-font rounded-[2px]"
          >
            <Sparkles size={16} />
            AI 提取
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-10">
          <section className="bg-white p-10 border border-[#B37D56]/10 space-y-8 rounded-none shadow-sm">
            <h3 className="text-sm font-bold text-[#2F2F2F] tracking-[0.3em] uppercase border-l-4 border-[#A62121] pl-4">基本信息</h3>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2 group">
                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest flex justify-between">
                  关联客户
                  <button onClick={() => setShowQuickCustomerModal(true)} className="text-[#A62121] hover:underline flex items-center gap-1">
                    <Plus size={10} /> 快速创建
                  </button>
                </label>
                <select 
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
                >
                  <option value="">-- 请选择客户 --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">咨询主题</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="如：问来年财运..."
                  className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-2 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold rounded-none"
                />
              </div>
            </div>

            {module === 'liuyao' ? (
              <div className="grid grid-cols-2 gap-8 items-end animate-in fade-in duration-300">
                <ChineseDatePicker label="起卦日期" value={recordDate} onChange={setRecordDate} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">月建</label>
                    <select value={monthBranch} onChange={e => setMonthBranch(e.target.value)} className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1.5 outline-none font-bold">
                      {BRANCHES.map(b => <option key={b} value={b}>{b}月</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">日辰</label>
                    <select value={dayBranch} onChange={e => setDayBranch(e.target.value)} className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1.5 outline-none font-bold">
                      {BRANCHES.map(b => <option key={b} value={b}>{b}日</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF7F2] p-6 border border-[#B37D56]/5 space-y-6 animate-in fade-in duration-300 rounded-[4px]">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">排盘设置</p>
                  <button
                    onClick={importFromCustomer}
                    className="text-[10px] flex items-center gap-1 text-[#A62121] font-bold uppercase hover:underline"
                  >
                    <RefreshCw size={10} /> 从客户生辰导入
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <ChineseDatePicker
                    label="出生日期"
                    value={(bazi.birthDate as string) || ""}
                    onChange={handleBaziBirthDateChange}
                    placeholder="选择日期"
                  />
                  <ChineseTimePicker
                    label="出生时间"
                    value={baziBirthTime}
                    onChange={handleBaziBirthTimeChange}
                  />
                  <div className="group">
                    <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest mb-1 block">
                      出生地点
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLocPicker(true)}
                      className="w-full bg-white border border-[#B37D56]/10 px-4 py-2 text-left text-xs font-bold rounded-[4px] hover:border-[#A62121] transition-all"
                    >
                      {(bazi.location as string) || "请选择地区"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {(['solar', 'lunar', 'fourPillars'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleBaziChange('calendarType', t)}
                      className={`px-4 py-1.5 text-[10px] font-bold tracking-widest border transition-all rounded-[2px] ${
                        (bazi.calendarType || 'solar') === t
                          ? 'bg-[#2F2F2F] text-white border-[#2F2F2F]'
                          : 'bg-white text-[#2F2F2F]/40 border-[#B37D56]/10 hover:border-[#A62121]'
                      }`}
                    >
                      {t === 'solar' ? '公历' : t === 'lunar' ? '农历' : '四柱'}
                    </button>
                  ))}

                  <div className="h-4 w-[0.5px] bg-[#B37D56]/20 mx-2" />

                  {(
                    [
                      { key: 'isTrueSolarTime', label: '真太阳时', defaultValue: true },
                      { key: 'isDst', label: '夏令时', defaultValue: false },
                      { key: 'isEarlyLateZi', label: '早晚子', defaultValue: false },
                    ] as const
                  ).map((opt) => {
                    const current = bazi[opt.key];
                    const on = typeof current === 'boolean' ? current : opt.defaultValue;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setBazi((prev) => ({ ...prev, [opt.key]: !on }))}
                        className={`px-3 py-1.5 text-[10px] font-bold tracking-widest border transition-all rounded-[2px] ${
                          on
                            ? 'bg-[#8DA399]/10 text-[#8DA399] border-[#8DA399]/20'
                            : 'bg-white text-[#2F2F2F]/30 border-[#B37D56]/10 hover:border-[#A62121]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {(['year', 'month', 'day', 'hour'] as const).map((p) => (
                    <div key={p} className="space-y-3">
                      <p className="text-center text-[10px] text-[#2F2F2F]/40 font-bold uppercase">
                        {p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱'}
                      </p>
                      <div className="flex flex-col gap-2">
                        <select
                          value={bazi[`${p}Stem` as keyof BaZiData] as string}
                          onChange={(e) => handleBaziChange(`${p}Stem` as keyof BaZiData, e.target.value)}
                          className="w-full text-center bg-white border border-[#B37D56]/10 py-1.5 font-bold text-[#A62121] rounded-[2px]"
                        >
                          {STEMS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <select
                          value={bazi[`${p}Branch` as keyof BaZiData] as string}
                          onChange={(e) => handleBaziChange(`${p}Branch` as keyof BaZiData, e.target.value)}
                          className="w-full text-center bg-white border border-[#B37D56]/10 py-1.5 font-bold text-[#2F2F2F] rounded-[2px]"
                        >
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-10 border border-[#B37D56]/10 space-y-6 rounded-none shadow-sm">
            <h3 className="text-sm font-bold text-[#2F2F2F] tracking-[0.3em] uppercase border-l-4 border-[#8DA399] pl-4">推演笔记</h3>
            <textarea 
              rows={10}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录断语与解析思路..."
              className="w-full bg-[#FAF7F2]/50 p-6 border border-[#B37D56]/5 outline-none focus:border-[#8DA399] transition-all chinese-font italic"
            />
          </section>
        </div>

        {/* Right Sidebar Visuals */}
        <div className="lg:col-span-2 space-y-10">
          {module === 'liuyao' ? (
            <section className="bg-white p-12 border border-[#B37D56]/20 rounded-none relative shadow-md animate-in slide-in-from-right-4">
              <h3 className="text-center text-[10px] text-[#B37D56] mb-12 tracking-[0.5em] font-bold uppercase">六爻排盘 (自下而上)</h3>
              <div className="flex flex-col-reverse gap-8 items-center relative z-10">
                {lines.map((line, idx) => {
                  const info = LINE_SYMBOLS[line];
                  return (
                    <button 
                      key={idx}
                      onClick={() => handleLineToggle(idx)}
                      className="group relative flex items-center justify-center py-2 px-12 transition-all hover:bg-black/[0.01]"
                    >
                      <span className="absolute left-[-2rem] text-[9px] font-bold text-[#2F2F2F]/20 chinese-font">爻{idx+1}</span>
                      <div className="text-4xl font-light tracking-[-0.1em] text-[#2F2F2F] select-none">
                        {info.base.replace(/—/g, '━').replace(/ /g, '　')}
                      </div>
                      {info.isMoving && (
                        <span className="absolute right-[-1rem] text-xl font-bold text-[#A62121]">
                          {info.mark === 'O' ? '●' : '×'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-white p-12 border border-[#B37D56]/20 rounded-none relative shadow-md animate-in slide-in-from-right-4">
              <h3 className="text-center text-[10px] text-[#B37D56] mb-12 tracking-[0.5em] font-bold uppercase">八字四柱预览</h3>
              <div className="flex justify-center gap-6">
                 {(['hour', 'day', 'month', 'year'] as const).map(p => (
                   <div key={p} className="flex flex-col items-center gap-4">
                      <div className="text-sm font-bold text-[#B37D56]/40 chinese-font">
                        {p === 'year' ? '年' : p === 'month' ? '月' : p === 'day' ? '日' : '时'}
                      </div>
                      <div className="w-12 py-6 bg-[#FAF7F2] border border-[#B37D56]/10 flex flex-col items-center gap-2">
                        <span className="text-2xl font-bold text-[#A62121] chinese-font">{bazi[`${p}Stem` as keyof BaZiData]}</span>
                        <span className="text-2xl font-bold text-[#2F2F2F] chinese-font">{bazi[`${p}Branch` as keyof BaZiData]}</span>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-12 p-4 border-t border-[#B37D56]/5 text-center">
                 <p className="text-[10px] text-[#2F2F2F]/30 leading-loose italic chinese-font">
                   “先看提纲，次看日元，究其造化之变。”
                 </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-10 right-28 z-40">
        <button 
          onClick={handleSave}
          className="flex items-center gap-3 px-8 py-4 bg-[#2F2F2F] text-white font-bold tracking-[0.3em] hover:bg-black transition-all shadow-[0_12px_32px_rgba(0,0,0,0.15)] rounded-none group"
        >
          <Save size={18} className="group-hover:scale-110 transition-transform" />
          <span className="chinese-font">保存入册</span>
        </button>
      </div>

      {/* Shared Modals: AI & Quick Customer (Simplified version) */}
      {showAiModal && (
        <div className="fixed inset-0 bg-[#2F2F2F]/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#FAF7F2] w-full max-w-xl shadow-2xl border border-[#B37D56]/20 overflow-hidden">
             <div className="p-8 bg-white flex justify-between items-center border-b border-[#B37D56]/10">
                <h3 className="font-bold text-xl chinese-font">AI 解析提取</h3>
                <button onClick={() => setShowAiModal(false)}><X size={20}/></button>
             </div>
             <div className="p-10">
                <textarea 
                  rows={8}
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder={module === 'liuyao' ? "输入六爻卦例文字..." : "输入八字命例文字..."}
                  className="w-full p-4 border border-[#B37D56]/10 focus:border-[#A62121] outline-none chinese-font"
                />
             </div>
             <div className="p-8 bg-white flex justify-end">
                <button 
                  onClick={() => { toast.show('正在处理中...', 'info'); setShowAiModal(false); }}
                  className="px-8 py-2 bg-[#2F2F2F] text-white font-bold tracking-widest hover:bg-black"
                >
                  开始提取
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
