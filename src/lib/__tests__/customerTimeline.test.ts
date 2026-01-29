import { describe, expect, test } from "bun:test";
import { buildCustomerTimeline } from "../customerTimeline";
import type { ConsultationRecord, TimelineEvent } from "../types";

describe("buildCustomerTimeline", () => {
  test("merges and sorts by numeric sortKey desc", () => {
    const customerId = "c1";

    const events: TimelineEvent[] = [
      {
        id: "e1",
        customerId,
        time: "2010年",
        timestamp: 1000,
        description: "event",
        tags: [],
      },
    ];

    const records: ConsultationRecord[] = [
      {
        id: "r1",
        customerId,
        module: "bazi",
        subject: "record",
        notes: "",
        tags: [],
        verifiedStatus: "unverified",
        verifiedNotes: "",
        createdAt: 500,
      },
    ];

    const timeline = buildCustomerTimeline({ customerId, events, records });
    expect(timeline.map((i) => i.id)).toEqual(["e1", "r1"]);
  });

  test("derives event sortKey from year when timestamp missing", () => {
    const customerId = "c1";

    const events: TimelineEvent[] = [
      {
        id: "e2015",
        customerId,
        time: "2015年",
        description: "event",
        tags: [],
      },
    ];

    const records: ConsultationRecord[] = [];

    const timeline = buildCustomerTimeline({ customerId, events, records });
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.kind).toBe("life-event");
    expect(timeline[0]?.sortKey).toBe(new Date("2015-01-01T00:00:00.000Z").getTime());
  });
});

