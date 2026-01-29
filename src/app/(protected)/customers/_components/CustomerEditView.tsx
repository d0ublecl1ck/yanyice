"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Plus, History } from 'lucide-react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useToastStore } from '@/stores/useToastStore';
import { ChineseDatePicker } from '@/components/ChineseDatePicker';
import { ChineseTimePicker } from '@/components/ChineseTimePicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiError } from '@/lib/apiClient';
import type { CustomerGender } from '@/lib/types';
import { buildCreateCustomerPayload, buildUpdateCustomerPayload } from './customerFormPayload';

export const CustomerEditView: React.FC<{ id?: string }> = ({ id }) => {
  const router = useRouter();
  const toast = useToastStore();
  const {
    customers,
    events,
    refreshEvents,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addEvent,
    deleteEvent,
  } = useCustomerStore();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	  const [isSaving, setIsSaving] = useState(false);

	  const [name, setName] = useState('');
	  const [gender, setGender] = useState<CustomerGender>('male');
	  const [birthDate, setBirthDate] = useState('');
	  const [birthTime, setBirthTime] = useState('');
	  const [phone, setPhone] = useState('');
	  const [notes, setNotes] = useState('');
	  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  useEffect(() => {
    if (id) {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        setName(customer.name);
        setGender(customer.gender);
        setBirthDate(customer.birthDate || '');
        setBirthTime(customer.birthTime || '');
        setPhone(customer.phone || '');
        setNotes(customer.notes);
        setTags(customer.tags);
      }
    }
  }, [id, customers]);

  useEffect(() => {
    if (!id) return;
    void refreshEvents(id);
  }, [id, refreshEvents]);

	  const handleSave = async () => {
	    if (!name) {
	      toast.show('请填写客户姓名', 'error');
	      return;
	    }
	    const formState = { name, gender, birthDate, birthTime, phone, notes, tags };
	    setIsSaving(true);
	    try {
	      if (id) {
	        await updateCustomer(id, buildUpdateCustomerPayload(formState));
	        toast.show('客户资料已更新', 'success');
	      } else {
	        await addCustomer(buildCreateCustomerPayload(formState));
	        toast.show('新客户已成功建档', 'success');
	      }
	      router.push('/customers');
	    } catch (e) {
	      if (e instanceof ApiError) {
	        toast.show(e.message, 'error');
	        return;
	      }
	      toast.show('保存失败：接口不可用或网络异常（请确认服务已启动）', 'error');
	    } finally {
	      setIsSaving(false);
	    }
	  };

  const handleAddEvent = async () => {
    if (!id || !eventDate || !eventDesc) {
      toast.show('请填写完整的事件日期与描述', 'warning');
      return;
    }
    const displayDate = new Date(eventDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    try {
      await addEvent({
        customerId: id,
        time: displayDate,
        timestamp: new Date(eventDate).getTime(),
        description: eventDesc,
        tags: [],
      });
      setEventDate('');
      setEventDesc('');
      toast.show('大事记已记录', 'info');
    } catch {
      toast.show('记录失败，请稍后重试', 'error');
    }
  };

  const customerEvents = events.filter(e => e.customerId === id);

  return (
    <div className="space-y-10 relative">
      <header className="flex justify-between items-center border-b border-[#B37D56]/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2F2F2F] chinese-font tracking-widest">{id ? '编辑客户资料' : '新客户登记'}</h2>
          <p className="text-xs text-[#B37D56] font-bold mt-1 uppercase tracking-widest">Registry ID: {id || 'NEW'}</p>
        </div>
        <div className="flex gap-4">
          {id && (
            <Link 
              href={`/customers/history/${id}`}
              className="flex items-center gap-2 px-6 py-2 border border-[#B37D56]/20 text-[#B37D56] font-bold text-sm tracking-widest hover:bg-[#FAF7F2] transition-all rounded-[2px]"
            >
              <History size={16} />
              历程纪
            </Link>
          )}
          {id && (
            <button 
              onClick={() => setIsDeleteOpen(true)}
              className="px-4 py-2 text-[#A62121]/60 hover:text-[#A62121] transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={isDeleteOpen}
        title="确认删除客户？"
        description="此操作会移除客户资料及其关联记录，且不可撤销。"
        confirmText="删除"
        cancelText="取消"
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (!id) return;
          void (async () => {
            try {
              await deleteCustomer(id);
              toast.show('客户资料已移除', 'info');
              router.push('/customers');
            } catch {
              toast.show('删除失败，请稍后重试', 'error');
            }
          })();
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Basic Info */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
            <h3 className="text-sm font-bold text-[#2F2F2F] tracking-[0.3em] uppercase border-l-4 border-[#A62121] pl-4">基本属性</h3>
            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">姓名</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1 outline-none focus:border-[#A62121] transition-colors chinese-font font-bold"
                />
	              </div>
	              {id && (
	                <>
	                  <div className="group">
	                    <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">性别/造化</label>
	                    <div className="flex gap-4 mt-2">
	                      {(['male', 'female'] as const).map((g) => (
	                        <button 
	                          key={g} 
	                          onClick={() => setGender(g)}
	                          className={`px-4 py-1 text-xs border transition-all ${gender === g ? 'bg-[#2F2F2F] text-white border-[#2F2F2F]' : 'border-[#B37D56]/20 text-[#2F2F2F]/40'}`}
	                        >
	                          {g === 'male' ? '乾造' : '坤造'}
	                        </button>
	                      ))}
	                    </div>
	                  </div>
	                  
	                  <div className="grid grid-cols-1 gap-6">
	                    <ChineseDatePicker 
	                      label="出生日期"
	                      value={birthDate}
	                      onChange={setBirthDate}
	                      placeholder="选择出生日期"
	                    />
	                    <ChineseTimePicker 
	                      label="出生时间"
	                      value={birthTime}
	                      onChange={setBirthTime}
	                    />
	                  </div>
	                </>
	              )}

	              <div className="group">
	                <label className="text-[10px] text-[#B37D56] font-bold uppercase tracking-widest">联系方式</label>
	                <input 
                  type="text" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1 outline-none focus:border-[#A62121] transition-colors"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 border border-[#B37D56]/10 space-y-6">
            <h3 className="text-sm font-bold text-[#2F2F2F] tracking-[0.3em] uppercase border-l-4 border-[#8DA399] pl-4">标签备注</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(t => (
                <span key={t} className="text-[10px] bg-[#FAF7F2] text-[#2F2F2F] px-2 py-1 border border-[#B37D56]/10 flex items-center gap-1">
                  {t} <button onClick={() => setTags(tags.filter(tag => tag !== t))} className="text-[#A62121] hover:font-bold">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (setTags([...tags, newTag]), setNewTag(''))}
                placeholder="新增标签"
                className="flex-1 bg-transparent border-b border-[#2F2F2F]/10 py-1 text-xs outline-none focus:border-[#8DA399]"
              />
              <button onClick={() => { if(newTag) { setTags([...tags, newTag]); setNewTag(''); } }} className="text-[#8DA399]"><Plus size={18}/></button>
            </div>
            <textarea 
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="补充说明..."
              className="w-full bg-[#FAF7F2]/50 p-4 border border-[#B37D56]/5 text-xs outline-none focus:border-[#8DA399] italic"
            />
          </section>
        </div>

        {/* Right: Timeline Events */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 border border-[#B37D56]/10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-bold text-[#2F2F2F] tracking-[0.3em] uppercase border-l-4 border-[#B37D56] pl-4">大运大事记</h3>
              {!id && <p className="text-[10px] text-[#B37D56] italic">登记保存客户后即可记录大事记</p>}
            </div>

            {id && (
              <div className="space-y-10">
                {/* Add Event Form - Precise Date */}
                <div className="flex flex-col md:flex-row gap-6 items-end bg-[#FAF7F2]/50 p-6 border border-[#B37D56]/5">
                  <div className="w-full md:w-48 shrink-0">
                    <ChineseDatePicker 
                      label="发生日期"
                      value={eventDate}
                      onChange={setEventDate}
                      placeholder="选择日期"
                    />
                  </div>
                  <div className="flex-1 w-full group">
                    <label className="text-[9px] text-[#B37D56] font-bold uppercase block mb-1">事件描述</label>
                    <input 
                      type="text" 
                      value={eventDesc}
                      onChange={e => setEventDesc(e.target.value)}
                      placeholder="记录关键事件 (如：升职、动婚...)"
                      className="w-full bg-transparent border-b border-[#2F2F2F]/10 py-1.5 text-xs outline-none focus:border-[#A62121]"
                    />
                  </div>
                  <button 
                    onClick={handleAddEvent}
                    className="bg-[#2F2F2F] text-white px-6 py-2 text-xs font-bold tracking-widest hover:bg-black transition-all rounded-none w-full md:w-auto"
                  >
                    记录事件
                  </button>
                </div>

	                {/* Timeline Display */}
	                <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-0 before:w-[0.5px] before:h-full before:bg-[#B37D56]/20">
	                  {customerEvents.length > 0 ? (
	                    customerEvents.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).map(event => (
	                      <div key={event.id} className="relative group">
	                        <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-[#B37D56] border-2 border-[#FAF7F2] z-10 group-hover:scale-150 transition-transform"></div>
	                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-[#A62121] uppercase tracking-[0.2em]">{event.time}</span>
                            <p className="mt-1 text-sm text-[#2F2F2F] chinese-font leading-relaxed">{event.description}</p>
                          </div>
                          <button 
                            onClick={() => {
                              void (async () => {
                                try {
                                  if (!id) return;
                                  await deleteEvent(id, event.id);
                                  toast.show('事件已删除', 'info');
                                } catch {
                                  toast.show('删除失败，请稍后重试', 'error');
                                }
                              })();
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#A62121]/30 hover:text-[#A62121] transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-xs text-[#2F2F2F]/20 italic">暂无历史大事记录</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-10 right-28 z-40">
        <button 
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="flex items-center gap-3 px-8 py-4 bg-[#2F2F2F] text-white font-bold tracking-[0.3em] hover:bg-black transition-all shadow-[0_12px_32px_rgba(0,0,0,0.15)] rounded-none group"
        >
          <Save size={18} className="group-hover:scale-110 transition-transform" />
          <span className="chinese-font">{isSaving ? "保存中…" : "保存资料"}</span>
        </button>
      </div>
    </div>
  );
};
