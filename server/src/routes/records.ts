import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import { HeavenStem, type HideHeavenStem, SixtyCycleYear, SolarTerm } from "tyme4ts";

import { ErrorResponse, safeJsonParse, toJsonString } from "./shared";
import { computeBaziFromBirthDate } from "../bazi/computeBazi";

const ModuleType = Type.Union([Type.Literal("liuyao"), Type.Literal("bazi")]);
const VerifiedStatus = Type.Union([
  Type.Literal("unverified"),
  Type.Literal("accurate"),
  Type.Literal("inaccurate"),
  Type.Literal("partial"),
]);

const BaZiData = Type.Object({
  birthDate: Type.String(),
  yearStem: Type.Optional(Type.String()),
  yearBranch: Type.Optional(Type.String()),
  monthStem: Type.Optional(Type.String()),
  monthBranch: Type.Optional(Type.String()),
  dayStem: Type.Optional(Type.String()),
  dayBranch: Type.Optional(Type.String()),
  hourStem: Type.Optional(Type.String()),
  hourBranch: Type.Optional(Type.String()),
  calendarType: Type.Optional(Type.Union([Type.Literal("solar"), Type.Literal("lunar"), Type.Literal("fourPillars")])),
  location: Type.Optional(Type.String()),
  isDst: Type.Optional(Type.Boolean()),
  isTrueSolarTime: Type.Optional(Type.Boolean()),
  isEarlyLateZi: Type.Optional(Type.Boolean()),
  category: Type.Optional(Type.String()),
  derived: Type.Optional(Type.Any()),
});

const LiuYaoData = Type.Object({
  lines: Type.Array(Type.Number(), { minItems: 6, maxItems: 6 }),
  date: Type.String(),
  subject: Type.String(),
  monthBranch: Type.String(),
  dayBranch: Type.String(),
});

const RecordBody = Type.Object({
  customerId: Type.Optional(Type.String()),
  customerName: Type.Optional(Type.String()),
  module: ModuleType,
  subject: Type.String({ minLength: 1, maxLength: 200 }),
  notes: Type.Optional(Type.String({ maxLength: 200_000 })),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 32 }), { maxItems: 50 })),
  liuyaoData: Type.Optional(LiuYaoData),
  baziData: Type.Optional(BaZiData),
  verifiedStatus: Type.Optional(VerifiedStatus),
  verifiedNotes: Type.Optional(Type.String({ maxLength: 20_000 })),
  pinnedAt: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

const RecordPatchBody = Type.Partial(RecordBody);

const RecordPublic = Type.Object({
  id: Type.String(),
  customerId: Type.String(),
  customerName: Type.Optional(Type.String()),
  module: ModuleType,
  subject: Type.String(),
  notes: Type.String(),
  tags: Type.Array(Type.String()),
  liuyaoData: Type.Optional(LiuYaoData),
  baziData: Type.Optional(BaZiData),
  verifiedStatus: VerifiedStatus,
  verifiedNotes: Type.String(),
  pinnedAt: Type.Union([Type.Number(), Type.Null()]),
  createdAt: Type.Number(),
});

type RecordBodyType = Static<typeof RecordBody>;
type RecordPatchBodyType = Static<typeof RecordPatchBody>;

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function backfillBaziFortunesIfMissing(baziData: unknown) {
  if (!baziData || typeof baziData !== "object") return baziData;
  const bd = baziData as Record<string, unknown>;
  const derived = bd.derived;
  if (!derived || typeof derived !== "object") return baziData;
  const d = derived as Record<string, unknown>;
  const decadeFortune = d.decadeFortune;
  if (!decadeFortune || typeof decadeFortune !== "object") return baziData;
  const df = decadeFortune as Record<string, unknown>;
  const list = df.list;
  if (!Array.isArray(list) || list.length === 0) return baziData;

  const anyHasYears = list.some((item) => {
    if (!item || typeof item !== "object") return false;
    const years = (item as Record<string, unknown>).years;
    return Array.isArray(years) && years.length > 0;
  });
  if (anyHasYears) return baziData;

  const monthTermNames = [
    "立春",
    "惊蛰",
    "清明",
    "立夏",
    "芒种",
    "小暑",
    "立秋",
    "白露",
    "寒露",
    "立冬",
    "大雪",
    "小寒",
  ];

  const dayMaster = safeString(d.dayMaster);
  let me: HeavenStem | null = null;
  try {
    me = dayMaster ? HeavenStem.fromName(dayMaster) : null;
  } catch {
    me = null;
  }

  const buildTenGodsFromHiddenStems = (hiddenStems: HideHeavenStem[]) => {
    if (!me) return { tenGods: [] as string[], stems: hiddenStems.map((hs) => hs.toString()) };
    return {
      tenGods: hiddenStems.map((hs) => me!.getTenStar(hs.getHeavenStem()).getName()),
      stems: hiddenStems.map((hs) => hs.toString()),
    };
  };

  const buildYearFortune = (year: number) => {
    const yearCycle = SixtyCycleYear.fromYear(year).getSixtyCycle();
    const heavenStem = yearCycle.getHeavenStem();
    const earthBranch = yearCycle.getEarthBranch();
    const hidden = buildTenGodsFromHiddenStems(earthBranch.getHideHeavenStems());

    const months = SixtyCycleYear.fromYear(year)
      .getMonths()
      .slice(0, 12)
      .map((m, idx) => {
        const monthCycle = m.getSixtyCycle();
        const hs = monthCycle.getHeavenStem();
        const eb = monthCycle.getEarthBranch();
        const monthHidden = buildTenGodsFromHiddenStems(eb.getHideHeavenStems());

        const termName = monthTermNames[idx] ?? "";
        const term = termName ? SolarTerm.fromName(year, termName) : null;
        const termDay = term?.getSolarDay();
        const termDate = termDay ? `${termDay.getMonth()}/${termDay.getDay()}` : "";

        return {
          index: idx + 1,
          gz: monthCycle.toString(),
          termName,
          termDate,
          stemTenGod: me ? me.getTenStar(hs).getName() : "",
          branchTenGods: monthHidden.tenGods,
          branchHiddenStems: monthHidden.stems,
        };
      });

    return {
      year,
      gz: yearCycle.toString(),
      xun: yearCycle.getTen().toString(),
      kongWang: yearCycle.getExtraEarthBranches().join(""),
      nayin: yearCycle.getSound().toString(),
      stemTenGod: me ? me.getTenStar(heavenStem).getName() : "",
      branchTenGods: hidden.tenGods,
      branchHiddenStems: hidden.stems,
      months,
    };
  };

  df.list = list.map((item) => {
    if (!item || typeof item !== "object") return item;
    const decade = item as Record<string, unknown>;
    const startYear = safeNumber(decade.startYear);
    if (startYear == null) return item;
    const years = Array.from({ length: 10 }, (_, idx) => buildYearFortune(startYear + idx));
    return { ...decade, years, endYear: startYear + 9 };
  });

  bd.derived = { ...d, decadeFortune: { ...df } };
  return bd;
}

function serializeRecord(r: {
  id: string;
  customerId: string | null;
  customerName: string | null;
  module: "liuyao" | "bazi";
  subject: string;
  notes: string;
  tagsJson: string;
  liuyaoDataJson: string | null;
  baziDataJson: string | null;
  verifiedStatus: "unverified" | "accurate" | "inaccurate" | "partial";
  verifiedNotes: string;
  pinnedAt: Date | null;
  createdAt: Date;
}) {
  const rawBazi = r.baziDataJson ? safeJsonParse<Record<string, unknown> | undefined>(r.baziDataJson, undefined) : undefined;
  const baziData = rawBazi ? (backfillBaziFortunesIfMissing(rawBazi) as unknown) : undefined;
  return {
    id: r.id,
    customerId: r.customerId ?? "",
    customerName: r.customerName ?? undefined,
    module: r.module,
    subject: r.subject,
    notes: r.notes,
    tags: safeJsonParse<string[]>(r.tagsJson, []),
    liuyaoData: r.liuyaoDataJson ? safeJsonParse<Static<typeof LiuYaoData> | undefined>(r.liuyaoDataJson, undefined) : undefined,
    baziData: baziData as Static<typeof BaZiData> | undefined,
    verifiedStatus: r.verifiedStatus,
    verifiedNotes: r.verifiedNotes ?? "",
    pinnedAt: r.pinnedAt ? r.pinnedAt.getTime() : null,
    createdAt: r.createdAt.getTime(),
  };
}

function parsePinnedAtInput(value: number | null) {
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function recordRoutes(app: FastifyInstance) {
  app.get(
    "/records",
    {
      schema: {
        tags: ["records"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Partial(
          Type.Object({
            module: ModuleType,
            customerId: Type.String(),
          }),
        ),
        response: { 200: Type.Object({ records: Type.Array(RecordPublic) }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;
      const query = request.query as { module?: "liuyao" | "bazi"; customerId?: string };

      const records = await app.prisma.consultationRecord.findMany({
        where: {
          userId,
          module: query.module ?? undefined,
          customerId: query.customerId ?? undefined,
        },
        orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
      });
      return { records: records.map(serializeRecord) };
    },
  );

  app.post(
    "/records",
    {
      schema: {
        tags: ["records"],
        security: [{ bearerAuth: [] }],
        body: RecordBody,
        response: { 201: Type.Object({ record: RecordPublic }), 400: ErrorResponse, 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as RecordBodyType;

      const customerId = body.customerId?.trim() ? body.customerId : null;
      let customerName = body.customerName?.trim() ? body.customerName.trim() : null;
      let customerGender: "male" | "female" | "other" | null = null;
      if (customerId) {
        const customer = await app.prisma.customer.findFirst({ where: { id: customerId, userId } });
        if (customer) {
          customerName = customer.name;
          customerGender = (customer.gender as "male" | "female" | "other") ?? null;
        }
      }

      let baziDataJson = body.baziData ? toJsonString(body.baziData) : null;
      if (body.module === "bazi") {
        const birthDate = body.baziData?.birthDate?.trim();
        if (!birthDate) {
          return reply.status(400).send({ code: "INVALID_INPUT", message: "缺少出生公历时间 birthDate" });
        }

        const gender: 0 | 1 = customerGender === "female" ? 0 : 1;
        const eightCharProviderSect: 1 | 2 = body.baziData?.isEarlyLateZi ? 1 : 2;

        const computed = computeBaziFromBirthDate({
          birthDate,
          gender,
          eightCharProviderSect,
          location: body.baziData?.location,
          isDst: body.baziData?.isDst,
          isTrueSolarTime: body.baziData?.isTrueSolarTime,
          isEarlyLateZi: body.baziData?.isEarlyLateZi,
          category: body.baziData?.category,
        });

        baziDataJson = toJsonString(computed);
      }

      const pinnedAt = body.pinnedAt === undefined ? undefined : body.pinnedAt === null ? null : parsePinnedAtInput(body.pinnedAt);
      if (body.pinnedAt !== undefined && body.pinnedAt !== null && pinnedAt == null) {
        return reply.status(400).send({ code: "INVALID_INPUT", message: "无效 pinnedAt" });
      }

      const record = await app.prisma.consultationRecord.create({
        data: {
          userId,
          customerId,
          customerName,
          module: body.module,
          subject: body.subject,
          notes: body.notes ?? "",
          tagsJson: toJsonString(body.tags ?? []),
          liuyaoDataJson: body.liuyaoData ? toJsonString(body.liuyaoData) : null,
          baziDataJson,
          verifiedStatus: body.verifiedStatus ?? "unverified",
          verifiedNotes: body.verifiedNotes ?? "",
          pinnedAt: pinnedAt === undefined ? undefined : pinnedAt,
        },
      });

      return reply.status(201).send({ record: serializeRecord(record) });
    },
  );

  app.get(
    "/records/:id",
    {
      schema: {
        tags: ["records"],
        security: [{ bearerAuth: [] }],
        response: { 200: Type.Object({ record: RecordPublic }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const record = await app.prisma.consultationRecord.findFirst({ where: { id, userId } });
      if (!record) return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });
      return { record: serializeRecord(record) };
    },
  );

  app.put(
    "/records/:id",
    {
      schema: {
        tags: ["records"],
        security: [{ bearerAuth: [] }],
        body: RecordPatchBody,
        response: { 200: Type.Object({ record: RecordPublic }), 400: ErrorResponse, 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as RecordPatchBodyType;

      const existing = await app.prisma.consultationRecord.findFirst({ where: { id, userId } });
      if (!existing) return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });

      const customerId = body.customerId === undefined ? undefined : body.customerId?.trim() ? body.customerId : null;
      let customerName =
        body.customerName === undefined ? undefined : body.customerName?.trim() ? body.customerName.trim() : null;
      let customerGender: "male" | "female" | "other" | null = null;
      if (typeof customerId === "string" && customerId.trim()) {
        const customer = await app.prisma.customer.findFirst({ where: { id: customerId, userId } });
        if (customer) {
          customerName = customer.name;
          customerGender = (customer.gender as "male" | "female" | "other") ?? null;
        }
      }

      let baziDataJson: string | null | undefined = undefined;
      if (body.baziData !== undefined) {
        baziDataJson = body.baziData ? toJsonString(body.baziData) : null;

        const nextModule = body.module ?? existing.module;
        if (nextModule === "bazi") {
          const birthDate = body.baziData?.birthDate?.trim();
          if (!birthDate) {
            return reply.status(400).send({ code: "INVALID_INPUT", message: "缺少出生公历时间 birthDate" });
          }

          const gender: 0 | 1 = customerGender === "female" ? 0 : 1;
          const eightCharProviderSect: 1 | 2 = body.baziData?.isEarlyLateZi ? 1 : 2;

          const computed = computeBaziFromBirthDate({
            birthDate,
            gender,
            eightCharProviderSect,
            location: body.baziData?.location,
            isDst: body.baziData?.isDst,
            isTrueSolarTime: body.baziData?.isTrueSolarTime,
            isEarlyLateZi: body.baziData?.isEarlyLateZi,
            category: body.baziData?.category,
          });

          baziDataJson = toJsonString(computed);
        }
      }

      const pinnedAt =
        body.pinnedAt === undefined ? undefined : body.pinnedAt === null ? null : parsePinnedAtInput(body.pinnedAt);
      if (body.pinnedAt !== undefined && body.pinnedAt !== null && pinnedAt == null) {
        return reply.status(400).send({ code: "INVALID_INPUT", message: "无效 pinnedAt" });
      }

      const updated = await app.prisma.consultationRecord.update({
        where: { id },
        data: {
          customerId,
          customerName,
          module: body.module ?? undefined,
          subject: body.subject,
          notes: body.notes,
          tagsJson: body.tags ? toJsonString(body.tags) : undefined,
          liuyaoDataJson: body.liuyaoData === undefined ? undefined : body.liuyaoData ? toJsonString(body.liuyaoData) : null,
          baziDataJson,
          verifiedStatus: body.verifiedStatus ?? undefined,
          verifiedNotes: body.verifiedNotes,
          pinnedAt,
        },
      });

      return { record: serializeRecord(updated) };
    },
  );

  app.delete(
    "/records/:id",
    {
      schema: {
        tags: ["records"],
        security: [{ bearerAuth: [] }],
        response: { 204: Type.Null(), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const deleted = await app.prisma.consultationRecord.deleteMany({ where: { id, userId } });
      if (deleted.count === 0) return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });
      return reply.status(204).send();
    },
  );
}
