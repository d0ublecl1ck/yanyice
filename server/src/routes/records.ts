import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import { ErrorResponse, safeJsonParse, toJsonString } from "./shared";

const ModuleType = Type.Union([Type.Literal("liuyao"), Type.Literal("bazi")]);
const VerifiedStatus = Type.Union([
  Type.Literal("unverified"),
  Type.Literal("accurate"),
  Type.Literal("inaccurate"),
  Type.Literal("partial"),
]);

const BaZiData = Type.Object({
  yearStem: Type.String(),
  yearBranch: Type.String(),
  monthStem: Type.String(),
  monthBranch: Type.String(),
  dayStem: Type.String(),
  dayBranch: Type.String(),
  hourStem: Type.String(),
  hourBranch: Type.String(),
  birthDate: Type.String(),
  calendarType: Type.Optional(Type.Union([Type.Literal("solar"), Type.Literal("lunar"), Type.Literal("fourPillars")])),
  location: Type.Optional(Type.String()),
  isDst: Type.Optional(Type.Boolean()),
  isTrueSolarTime: Type.Optional(Type.Boolean()),
  isEarlyLateZi: Type.Optional(Type.Boolean()),
  category: Type.Optional(Type.String()),
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
  createdAt: Type.Number(),
});

type RecordBodyType = Static<typeof RecordBody>;
type RecordPatchBodyType = Static<typeof RecordPatchBody>;

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
  createdAt: Date;
}) {
  return {
    id: r.id,
    customerId: r.customerId ?? "",
    customerName: r.customerName ?? undefined,
    module: r.module,
    subject: r.subject,
    notes: r.notes,
    tags: safeJsonParse<string[]>(r.tagsJson, []),
    liuyaoData: r.liuyaoDataJson ? safeJsonParse<Static<typeof LiuYaoData> | undefined>(r.liuyaoDataJson, undefined) : undefined,
    baziData: r.baziDataJson ? safeJsonParse<Static<typeof BaZiData> | undefined>(r.baziDataJson, undefined) : undefined,
    verifiedStatus: r.verifiedStatus,
    verifiedNotes: r.verifiedNotes ?? "",
    createdAt: r.createdAt.getTime(),
  };
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
        orderBy: { createdAt: "asc" },
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
      if (customerId) {
        const customer = await app.prisma.customer.findFirst({ where: { id: customerId, userId } });
        if (customer) customerName = customer.name;
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
          baziDataJson: body.baziData ? toJsonString(body.baziData) : null,
          verifiedStatus: body.verifiedStatus ?? "unverified",
          verifiedNotes: body.verifiedNotes ?? "",
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
      if (typeof customerId === "string" && customerId.trim()) {
        const customer = await app.prisma.customer.findFirst({ where: { id: customerId, userId } });
        if (customer) customerName = customer.name;
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
          baziDataJson: body.baziData === undefined ? undefined : body.baziData ? toJsonString(body.baziData) : null,
          verifiedStatus: body.verifiedStatus ?? undefined,
          verifiedNotes: body.verifiedNotes,
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

