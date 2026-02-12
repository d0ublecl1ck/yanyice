import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

import type { Prisma } from "@prisma/client";

const LineType = Type.Integer({ minimum: 0, maximum: 3 });

const LiuyaoGender = Type.Union([Type.Literal("male"), Type.Literal("female"), Type.Literal("unknown")]);

const LiuyaoData = Type.Object({
  lines: Type.Array(LineType, { minItems: 6, maxItems: 6 }),
  date: Type.String(),
  subject: Type.String(),
  gender: Type.Optional(LiuyaoGender),
  monthBranch: Type.String(),
  dayBranch: Type.String(),
});

const VerifiedStatus = Type.Union([
  Type.Literal("unverified"),
  Type.Literal("accurate"),
  Type.Literal("inaccurate"),
  Type.Literal("partial"),
]);

const RecordResponse = Type.Object({
  id: Type.String(),
  customerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customerName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  module: Type.Literal("liuyao"),
  subject: Type.String(),
  notes: Type.String(),
  tags: Type.Array(Type.String()),
  liuyaoData: LiuyaoData,
  verifiedStatus: VerifiedStatus,
  verifiedNotes: Type.String(),
  pinnedAt: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  createdAt: Type.Number(),
});

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const CreateRecordBody = Type.Object({
  customerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customerName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  subject: Type.String({ minLength: 1, maxLength: 200 }),
  notes: Type.String({ maxLength: 20_000 }),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 50 }), { maxItems: 50 })),
  liuyaoData: LiuyaoData,
  verifiedStatus: Type.Optional(VerifiedStatus),
  verifiedNotes: Type.Optional(Type.String({ maxLength: 20_000 })),
});

const UpdateRecordBody = Type.Partial(CreateRecordBody);

type CreateRecordBodyType = Static<typeof CreateRecordBody>;
type UpdateRecordBodyType = Static<typeof UpdateRecordBody>;

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function toRecordResponse(row: {
  id: string;
  customerId: string | null;
  customerName: string | null;
  module: "liuyao";
  subject: string;
  notes: string;
  tagsJson: string;
  liuyaoDataJson: string | null;
  verifiedStatus: "unverified" | "accurate" | "inaccurate" | "partial";
  verifiedNotes: string;
  pinnedAt: Date | null;
  createdAt: Date;
}): Static<typeof RecordResponse> {
  const tags = safeJsonParse<string[]>(row.tagsJson, []);
  const liuyaoData = safeJsonParse<Static<typeof LiuyaoData>>(row.liuyaoDataJson ?? "null", {
    lines: [0, 0, 0, 0, 0, 0],
    date: "",
    subject: "",
    gender: "unknown",
    monthBranch: "",
    dayBranch: "",
  });

  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    module: "liuyao",
    subject: row.subject,
    notes: row.notes,
    tags,
    liuyaoData,
    verifiedStatus: row.verifiedStatus,
    verifiedNotes: row.verifiedNotes,
    pinnedAt: row.pinnedAt ? row.pinnedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
  };
}

function normalizeCreateBody(body: CreateRecordBodyType) {
  return {
    customerId: body.customerId ?? null,
    customerName: body.customerName ?? null,
    subject: body.subject.trim(),
    notes: body.notes ?? "",
    tags: body.tags ?? [],
    liuyaoData: body.liuyaoData,
    verifiedStatus: body.verifiedStatus ?? "unverified",
    verifiedNotes: body.verifiedNotes ?? "",
  };
}

function normalizeUpdateBody(body: UpdateRecordBodyType) {
  return {
    customerId: body.customerId === undefined ? undefined : body.customerId ?? null,
    customerName: body.customerName === undefined ? undefined : body.customerName ?? null,
    subject: body.subject === undefined ? undefined : body.subject.trim(),
    notes: body.notes === undefined ? undefined : body.notes,
    tags: body.tags === undefined ? undefined : body.tags,
    liuyaoData: body.liuyaoData === undefined ? undefined : body.liuyaoData,
    verifiedStatus: body.verifiedStatus === undefined ? undefined : body.verifiedStatus,
    verifiedNotes: body.verifiedNotes === undefined ? undefined : body.verifiedNotes,
  };
}

export async function liuyaoRoutes(app: FastifyInstance) {
  app.get(
    "/liuyao/records",
    {
      schema: {
        tags: ["liuyao"],
        security: [{ bearerAuth: [] }],
        response: { 200: Type.Object({ records: Type.Array(RecordResponse) }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;
      const rows = await app.prisma.consultationRecord.findMany({
        where: { userId, module: "liuyao" },
        orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          customerId: true,
          customerName: true,
          module: true,
          subject: true,
          notes: true,
          tagsJson: true,
          liuyaoDataJson: true,
          verifiedStatus: true,
          verifiedNotes: true,
          pinnedAt: true,
          createdAt: true,
        },
      });

      return { records: rows.map((r) => toRecordResponse({ ...r, module: "liuyao" })) };
    },
  );

  app.post(
    "/liuyao/records",
    {
      schema: {
        tags: ["liuyao"],
        security: [{ bearerAuth: [] }],
        body: CreateRecordBody,
        response: { 201: Type.Object({ record: RecordResponse }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = normalizeCreateBody(request.body as CreateRecordBodyType);
      const created = await app.prisma.consultationRecord.create({
        data: {
          userId,
          module: "liuyao",
          customerId: body.customerId,
          customerName: body.customerName,
          subject: body.subject,
          notes: body.notes,
          tagsJson: JSON.stringify(body.tags),
          liuyaoDataJson: JSON.stringify(body.liuyaoData),
          verifiedStatus: body.verifiedStatus,
          verifiedNotes: body.verifiedNotes,
        },
        select: {
          id: true,
          customerId: true,
          customerName: true,
          module: true,
          subject: true,
          notes: true,
          tagsJson: true,
          liuyaoDataJson: true,
          verifiedStatus: true,
          verifiedNotes: true,
          pinnedAt: true,
          createdAt: true,
        },
      });

      return reply.status(201).send({ record: toRecordResponse({ ...created, module: "liuyao" }) });
    },
  );

  app.get(
    "/liuyao/records/:id",
    {
      schema: {
        tags: ["liuyao"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: {
          200: Type.Object({ record: RecordResponse }),
          401: ErrorResponse,
          404: ErrorResponse,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const row = await app.prisma.consultationRecord.findFirst({
        where: { id, userId, module: "liuyao" },
        select: {
          id: true,
          customerId: true,
          customerName: true,
          module: true,
          subject: true,
          notes: true,
          tagsJson: true,
          liuyaoDataJson: true,
          verifiedStatus: true,
          verifiedNotes: true,
          pinnedAt: true,
          createdAt: true,
        },
      });
      if (!row) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });
      }
      return { record: toRecordResponse({ ...row, module: "liuyao" }) };
    },
  );

  app.put(
    "/liuyao/records/:id",
    {
      schema: {
        tags: ["liuyao"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        body: UpdateRecordBody,
        response: {
          200: Type.Object({ record: RecordResponse }),
          401: ErrorResponse,
          404: ErrorResponse,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const updates = normalizeUpdateBody(request.body as UpdateRecordBodyType);

      const data: Prisma.ConsultationRecordUpdateInput = {};
      if (updates.customerId !== undefined) data.customerId = updates.customerId;
      if (updates.customerName !== undefined) data.customerName = updates.customerName;
      if (updates.subject !== undefined) data.subject = updates.subject;
      if (updates.notes !== undefined) data.notes = updates.notes;
      if (updates.tags !== undefined) data.tagsJson = JSON.stringify(updates.tags);
      if (updates.liuyaoData !== undefined) data.liuyaoDataJson = JSON.stringify(updates.liuyaoData);
      if (updates.verifiedStatus !== undefined) data.verifiedStatus = updates.verifiedStatus;
      if (updates.verifiedNotes !== undefined) data.verifiedNotes = updates.verifiedNotes;

      const existing = await app.prisma.consultationRecord.findFirst({
        where: { id, userId, module: "liuyao" },
        select: { id: true },
      });
      if (!existing) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });
      }

      const saved = await app.prisma.consultationRecord.update({
        where: { id },
        data,
        select: {
          id: true,
          customerId: true,
          customerName: true,
          module: true,
          subject: true,
          notes: true,
          tagsJson: true,
          liuyaoDataJson: true,
          verifiedStatus: true,
          verifiedNotes: true,
          pinnedAt: true,
          createdAt: true,
        },
      });

      return { record: toRecordResponse({ ...saved, module: "liuyao" }) };
    },
  );

  app.delete(
    "/liuyao/records/:id",
    {
      schema: {
        tags: ["liuyao"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: {
          200: Type.Object({ ok: Type.Boolean() }),
          401: ErrorResponse,
          404: ErrorResponse,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const existing = await app.prisma.consultationRecord.findFirst({
        where: { id, userId, module: "liuyao" },
        select: { id: true },
      });
      if (!existing) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "记录不存在" });
      }

      await app.prisma.consultationRecord.delete({ where: { id } });
      return { ok: true };
    },
  );
}
