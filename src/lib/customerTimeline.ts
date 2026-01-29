import type { ConsultationRecord, TimelineEvent } from "./types";

export type CustomerTimelineItem =
  | {
      kind: "life-event";
      id: string;
      sortKey: number;
      timeLabel: string;
      description: string;
      tags: string[];
    }
  | {
      kind: "consultation";
      id: string;
      sortKey: number;
      timeLabel: string;
      subject: string;
      notes: string;
      module: ConsultationRecord["module"];
    };

function sortKeyFromEvent(event: TimelineEvent): number {
  if (typeof event.timestamp === "number") return event.timestamp;

  const yearMatch = event.time.match(/(\d{4})/);
  if (yearMatch) return new Date(`${yearMatch[1]}-01-01T00:00:00.000Z`).getTime();

  return 0;
}

export function buildCustomerTimeline(args: {
  customerId: string;
  events: TimelineEvent[];
  records: ConsultationRecord[];
  locale?: string;
}): CustomerTimelineItem[] {
  const { customerId, events, records, locale = "zh-CN" } = args;

  const lifeEvents: CustomerTimelineItem[] = events
    .filter((e) => e.customerId === customerId)
    .map((e) => ({
      kind: "life-event",
      id: e.id,
      sortKey: sortKeyFromEvent(e),
      timeLabel: e.time,
      description: e.description,
      tags: e.tags,
    }));

  const consultations: CustomerTimelineItem[] = records
    .filter((r) => r.customerId === customerId)
    .map((r) => ({
      kind: "consultation",
      id: r.id,
      sortKey: r.createdAt,
      timeLabel: new Date(r.createdAt).toLocaleDateString(locale),
      subject: r.subject,
      notes: r.notes,
      module: r.module,
    }));

  return [...lifeEvents, ...consultations].sort((a, b) => b.sortKey - a.sortKey);
}

