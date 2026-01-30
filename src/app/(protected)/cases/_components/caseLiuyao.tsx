"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, FileText } from "lucide-react";

import { ContextMenu } from "@/components/ContextMenu";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useToastStore } from "@/stores/useToastStore";
import { newCaseHref, recordAnalysisHref, recordEditHref } from "@/lib/caseLinks";
import { CaseArchiveLayout } from "./CaseArchiveLayout";

export function CaseLiuyao() {
  const router = useRouter();
  const allRecords = useCaseStore((state) => state.records);
  const deleteRecord = useCaseStore((state) => state.deleteRecord);
  const updateRecord = useCaseStore((state) => state.updateRecord);
  const customers = useCustomerStore((state) => state.customers);
  const toast = useToastStore((s) => s.show);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    recordId: string;
    subject: string;
    editHref: string;
    pinnedAt: number | null;
  } | null>(null);

  const records = useMemo(() => allRecords.filter((r) => r.module === "liuyao"), [allRecords]);

  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const record of records) {
      for (const tag of record.tags ?? []) {
        const normalized = tag.trim();
        if (!normalized) continue;
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(tagCounts.entries()).sort(([aTag, aCount], [bTag, bCount]) => {
      if (bCount !== aCount) return bCount - aCount;
      return aTag.localeCompare(bTag);
    }).map(([tag, count]) => ({ tag, count }));
  }, [records]);

  const filteredRecords = records.filter((record) => {
    const customer = customers.find((c) => c.id === record.customerId);
    const customerName = record.customerName ?? customer?.name ?? "";
    const q = search.trim().toLowerCase();
    const matchesTag = activeTag == null || (record.tags ?? []).includes(activeTag);
    const matchesSearch =
      q.length === 0 ||
      record.subject.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const aPinned = a.pinnedAt != null;
      const bPinned = b.pinnedAt != null;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      if (aPinned && bPinned) return (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
      return b.createdAt - a.createdAt;
    });
  }, [filteredRecords]);

  const gridClassName = useMemo(() => {
    const count = filteredRecords.length;
    if (count === 1) return "grid grid-cols-1 gap-px";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-px";
    return "grid grid-cols-1 md:grid-cols-2 gap-px lg:grid-cols-4 xl:grid-cols-3";
  }, [filteredRecords.length]);

  return (
    <CaseArchiveLayout
      title="六爻卦例库"
      subtitle="Liuyao Archives"
      resultCount={filteredRecords.length}
      actionHref={newCaseHref("liuyao")}
      actionLabel="新建卦例"
      actionClassName="flex items-center gap-2 px-6 py-2 bg-[#A62121] text-white font-bold text-sm tracking-widest hover:bg-[#8B1A1A] transition-all rounded-[2px]"
      actionIcon={<Plus size={16} />}
      searchIcon={<Search size={16} />}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="搜索卦例主题或客户姓名..."
      tagOptions={availableTags}
      activeTag={activeTag}
      onActiveTagChange={setActiveTag}
    >
      {filteredRecords.length > 0 ? (
        <div className={gridClassName}>
          {sortedRecords.map((record) => {
              const customer = customers.find((c) => c.id === record.customerId);
              const displayCustomerName = record.customerName ?? customer?.name ?? "未知客户";
              const editHref = recordEditHref(record.module, record.id);
              const analysisHref = recordAnalysisHref("liuyao", record.id);
              return (
                <div
                  key={record.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(analysisHref)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      recordId: record.id,
                      subject: record.subject,
                      editHref,
                      pinnedAt: record.pinnedAt ?? null,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(analysisHref);
                  }}
                  className="bg-white flex items-start gap-4 group hover:bg-[#FAF7F2] transition-all p-6"
                >
                  <div className="w-12 h-12 bg-[#B37D56]/5 flex items-center justify-center shrink-0">
                    <FileText
                      size={20}
                      className="text-[#B37D56]/30 group-hover:text-[#A62121] transition-colors"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#2F2F2F] chinese-font group-hover:text-[#A62121] transition-colors truncate">
                          {record.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#B37D56] uppercase tracking-widest">
                            {displayCustomerName}
                          </span>
                          <span className="text-[10px] text-[#2F2F2F]/20">|</span>
                          <span className="text-[10px] text-[#2F2F2F]/30">文王六爻</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#2F2F2F]/40 font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
                        <Calendar size={12} />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {record.tags.length > 0 ? (
                          <>
                            {record.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-2 py-0.5 border border-[#B37D56]/10 bg-[#FAF7F2] text-[#2F2F2F]/60 font-bold tracking-widest rounded-[2px]"
                              >
                                {tag}
                              </span>
                            ))}
                            {record.tags.length > 3 ? (
                              <span className="text-[9px] px-2 py-0.5 border border-[#B37D56]/10 bg-white text-[#2F2F2F]/30 font-bold tracking-widest rounded-[2px]">
                                +{record.tags.length - 3}
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={editHref}
                          className="text-[9px] px-2 py-0.5 border border-[#B37D56]/20 text-[#2F2F2F]/30 font-bold hover:border-[#A62121]/30 hover:text-[#A62121] rounded-[2px]"
                          onClick={(e) => e.stopPropagation()}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          编辑
                        </Link>
                        <ChevronRight
                          size={16}
                          className="text-[#2F2F2F]/10 group-hover:text-[#A62121] transition-all transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-[#2F2F2F]/20 chinese-font italic">未找到匹配的六爻卦例</p>
        </div>
      )}

      <ContextMenu
        open={contextMenu != null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
        items={[
          {
            key: "edit",
            label: "编辑",
            onSelect: () => {
              if (!contextMenu) return;
              router.push(contextMenu.editHref);
            },
          },
          {
            key: "pin",
            label: contextMenu?.pinnedAt != null ? "取消置顶" : "置顶",
            onSelect: async () => {
              if (!contextMenu) return;
              const nextPinnedAt = contextMenu.pinnedAt != null ? null : Date.now();
              try {
                await updateRecord(contextMenu.recordId, { pinnedAt: nextPinnedAt });
                setContextMenu((prev) => (prev ? { ...prev, pinnedAt: nextPinnedAt } : prev));
                toast(nextPinnedAt == null ? "已取消置顶" : "已置顶", "info");
              } catch (e) {
                toast(e instanceof Error ? e.message : "置顶失败，请稍后重试", "error");
              }
            },
          },
          {
            key: "delete",
            label: "删除",
            destructive: true,
            onSelect: () => {
              if (!contextMenu) return;
              toast(`确认删除「${contextMenu.subject}」？`, "warning", {
                actionLabel: "删除",
                durationMs: 8000,
                onAction: async () => {
                  try {
                    await deleteRecord(contextMenu.recordId);
                    toast("已删除", "success");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "删除失败，请稍后重试", "error");
                  }
                },
              });
            },
          },
        ]}
      />
    </CaseArchiveLayout>
  );
}
