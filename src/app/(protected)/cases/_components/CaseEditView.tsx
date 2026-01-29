"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Save, 
  Trash2, 
  Sparkles, 
  Plus, 
  UserPlus, 
  X,
  Layers,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import { useCaseStore } from '@/stores/useCaseStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useToastStore } from '@/stores/useToastStore';
import { LineType, LiuYaoData, BaZiData } from '@/lib/types';
import { LINE_SYMBOLS, BRANCHES, STEMS } from '@/lib/constants';
import { extractLiuYaoData } from '@/lib/geminiService';
import { ChineseDatePicker } from '@/components/ChineseDatePicker';
import { ChineseTimePicker } from '@/components/ChineseTimePicker';

const PROVINCES = ['北京市', '上海市', '天津市', '广东省', '江苏省', '浙江省', '四川省'];
const CITIES: Record<string, string[]> = {
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '天津市': ['天津市'],
  '广东省': ['广州市', '深圳市', '珠海市', '佛山市'],
  '江苏省': ['南京市', '苏州市', '无锡市'],
  '浙江省': ['杭州市', '宁波市', '温州市'],
  '四川省': ['成都市', '绵阳市', '德阳市'],
};
const DISTRICTS: Record<string, string[]> = {
  '广州市': ['越秀区', '荔湾区', '海珠区', '天河区', '白云区'],
  '深圳市': ['罗湖区', '福田区', '南山区', '宝安区'],
  '杭州市': ['西湖区', '上城区', '拱墅区'],
  '南京市': ['玄武区', '鼓楼区', '秦淮区'],
  '成都市': ['锦江区', '青羊区', '武侯区'],
};

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
  const [prov, setProv] = useState('北京市');
  const [city, setCity] = useState('北京市');
  const [dist, setDist] = useState('--');

  useEffect(() => {
    if (!open) return;
    const [p, c, d] = (initial || '').split(' ').filter(Boolean);
    if (p && PROVINCES.includes(p)) setProv(p);
    if (c) setCity(c);
    if (d) setDist(d);
  }, [open, initial]);

  useEffect(() => {
    const cities = CITIES[prov] || ['--'];
    if (!cities.includes(city)) setCity(cities[0] || '--');
  }, [prov, city]);

  useEffect(() => {
    const dists = DISTRICTS[city] || ['--'];
    if (!dists.includes(dist)) setDist(dists[0] || '--');
  }, [city, dist]);

  if (!open) return null;

  const availableCities = CITIES[prov] || ['--'];
  const availableDists = DISTRICTS[city] || ['--'];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[4px] border border-[#B37D56]/20 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#B37D56]/10 flex justify-between items-center">
          <p className="text-xs font-bold tracking-widest chinese-font text-[#2F2F2F]">选择地区</p>
          <button onClick={onClose} className="text-[#2F2F2F]/20 hover:text-[#A62121]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-3 gap-3 border-b border-[#B37D56]/10">
          <div className="space-y-2">
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">省份</p>
            <select
              value={prov}
              onChange={(e) => setProv(e.target.value)}
              className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px]"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">城市</p>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px]"
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">区县</p>
            <select
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              className="w-full bg-white border border-[#B37D56]/10 px-3 py-2 text-xs font-bold rounded-[2px]"
            >
              {availableDists.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6">
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

export const CaseEditView: React.FC<{ id?: string }> = ({ id }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastStore();
  const records = useCaseStore(state => state.records);
  const addRecord = useCaseStore(state => state.addRecord);
  const updateRecord = useCaseStore(state => state.updateRecord);
  const { customers, addCustomer } = useCustomerStore();
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

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickGender, setQuickGender] = useState<'male' | 'female'>('male');

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
