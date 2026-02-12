import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";

const CustomerGender = Type.Union([
  Type.Literal("male"),
  Type.Literal("female"),
  Type.Literal("other"),
]);

const CustomerDto = Type.Object({
  id: Type.String(),
  name: Type.String(),
  gender: CustomerGender,
  birthDate: Type.Optional(Type.String()),
  birthTime: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  tags: Type.Array(Type.String()),
  notes: Type.String(),
  customFields: Type.Record(Type.String(), Type.String()),
  createdAt: Type.Number(),
});

const TimelineEventDto = Type.Object({
  id: Type.String(),
  customerId: Type.String(),
  time: Type.String(),
  timestamp: Type.Number(),
  description: Type.String(),
  tags: Type.Array(Type.String()),
});

const ErrorResponse = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const CreateCustomerBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 128 }),
  gender: CustomerGender,
  birthDate: Type.Optional(Type.String()),
  birthTime: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  notes: Type.Optional(Type.String()),
  customFields: Type.Optional(Type.Record(Type.String(), Type.String())),
});

const UpdateCustomerBody = Type.Partial(CreateCustomerBody);

const CreateEventBody = Type.Object({
  occurredAt: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1, maxLength: 1000 }),
  tags: Type.Optional(Type.Array(Type.String())),
});

type CreateCustomerBodyType = Static<typeof CreateCustomerBody>;
type UpdateCustomerBodyType = Static<typeof UpdateCustomerBody>;
type CreateEventBodyType = Static<typeof CreateEventBody>;

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string") out[key] = raw;
  }
  return out;
}

export async function customerRoutes(app: FastifyInstance) {
  app.get(
    "/customers",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          q: Type.Optional(Type.String()),
        }),
        response: { 200: Type.Object({ customers: Type.Array(CustomerDto) }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request) => {
      const userId = request.user.sub;
      const { q } = request.query as { q?: string };

      const where = q
        ? {
            userId,
            OR: [{ name: { contains: q } }, { phone: { contains: q } }],
          }
        : { userId };

      const customers = await app.prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      });

      return {
        customers: customers.map((c) => ({
          id: c.id,
          name: c.name,
          gender: (c.gender as "male" | "female" | "other") ?? "other",
          birthDate: c.birthDate ?? undefined,
          birthTime: c.birthTime ?? undefined,
          phone: c.phone ?? undefined,
          tags: normalizeStringArray(c.tags),
          notes: c.notes,
          customFields: normalizeStringRecord(c.customFields),
          createdAt: c.createdAt.getTime(),
        })),
      };
    },
  );

  app.post(
    "/customers",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        body: CreateCustomerBody,
        response: { 201: Type.Object({ customer: CustomerDto }), 401: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const body = request.body as CreateCustomerBodyType;

      const customer = await app.prisma.customer.create({
        data: {
          userId,
          name: body.name,
          gender: body.gender,
          birthDate: body.birthDate ?? null,
          birthTime: body.birthTime ?? null,
          phone: body.phone ?? null,
          tags: body.tags ?? [],
          notes: body.notes ?? "",
          customFields: body.customFields ?? {},
        },
      });

      return reply.status(201).send({
        customer: {
          id: customer.id,
          name: customer.name,
          gender: customer.gender as "male" | "female" | "other",
          birthDate: customer.birthDate ?? undefined,
          birthTime: customer.birthTime ?? undefined,
          phone: customer.phone ?? undefined,
          tags: normalizeStringArray(customer.tags),
          notes: customer.notes,
          customFields: normalizeStringRecord(customer.customFields),
          createdAt: customer.createdAt.getTime(),
        },
      });
    },
  );

  app.get(
    "/customers/:id",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: { 200: Type.Object({ customer: CustomerDto }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const customer = await app.prisma.customer.findUnique({ where: { id } });
      if (!customer || customer.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该客户" });
      }

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          gender: customer.gender as "male" | "female" | "other",
          birthDate: customer.birthDate ?? undefined,
          birthTime: customer.birthTime ?? undefined,
          phone: customer.phone ?? undefined,
          tags: normalizeStringArray(customer.tags),
          notes: customer.notes,
          customFields: normalizeStringRecord(customer.customFields),
          createdAt: customer.createdAt.getTime(),
        },
      };
    },
  );

  app.put(
    "/customers/:id",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        body: UpdateCustomerBody,
        response: { 200: Type.Object({ customer: CustomerDto }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateCustomerBodyType;

      const existing = await app.prisma.customer.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该客户" });
      }

      const customer = await app.prisma.customer.update({
        where: { id },
        data: {
          name: body.name ?? undefined,
          gender: body.gender ?? undefined,
          birthDate: body.birthDate !== undefined ? body.birthDate : undefined,
          birthTime: body.birthTime !== undefined ? body.birthTime : undefined,
          phone: body.phone !== undefined ? body.phone : undefined,
          tags: body.tags ?? undefined,
          notes: body.notes ?? undefined,
          customFields: body.customFields ?? undefined,
        },
      });

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          gender: customer.gender as "male" | "female" | "other",
          birthDate: customer.birthDate ?? undefined,
          birthTime: customer.birthTime ?? undefined,
          phone: customer.phone ?? undefined,
          tags: normalizeStringArray(customer.tags),
          notes: customer.notes,
          customFields: normalizeStringRecord(customer.customFields),
          createdAt: customer.createdAt.getTime(),
        },
      };
    },
  );

  app.delete(
    "/customers/:id",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: { 204: Type.Null(), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const existing = await app.prisma.customer.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该客户" });
      }

      await app.prisma.customer.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  app.get(
    "/customers/:id/events",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        response: { 200: Type.Object({ events: Type.Array(TimelineEventDto) }), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const customer = await app.prisma.customer.findUnique({ where: { id } });
      if (!customer || customer.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该客户" });
      }

      const events = await app.prisma.customerEvent.findMany({
        where: { customerId: id, userId },
        orderBy: { occurredAt: "desc" },
      });

      return {
        events: events.map((e) => ({
          id: e.id,
          customerId: e.customerId,
          time: e.occurredAt.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          timestamp: e.occurredAt.getTime(),
          description: e.description,
          tags: normalizeStringArray(e.tags),
        })),
      };
    },
  );

  app.post(
    "/customers/:id/events",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ id: Type.String() }),
        body: CreateEventBody,
        response: {
          201: Type.Object({ event: TimelineEventDto }),
          401: ErrorResponse,
          404: ErrorResponse,
          422: ErrorResponse,
        },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as CreateEventBodyType;

      const customer = await app.prisma.customer.findUnique({ where: { id } });
      if (!customer || customer.userId !== userId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该客户" });
      }

      const occurredAt = new Date(body.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        return reply.status(422).send({ code: "INVALID_DATE", message: "事件日期格式不正确" });
      }

      const event = await app.prisma.customerEvent.create({
        data: {
          userId,
          customerId: id,
          occurredAt,
          description: body.description,
          tags: body.tags ?? [],
        },
      });

      return reply.status(201).send({
        event: {
          id: event.id,
          customerId: event.customerId,
          time: event.occurredAt.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          timestamp: event.occurredAt.getTime(),
          description: event.description,
          tags: normalizeStringArray(event.tags),
        },
      });
    },
  );

  app.delete(
    "/customers/:customerId/events/:eventId",
    {
      schema: {
        tags: ["customers"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({ customerId: Type.String(), eventId: Type.String() }),
        response: { 204: Type.Null(), 401: ErrorResponse, 404: ErrorResponse },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const { customerId, eventId } = request.params as { customerId: string; eventId: string };

      const existing = await app.prisma.customerEvent.findUnique({ where: { id: eventId } });
      if (!existing || existing.userId !== userId || existing.customerId !== customerId) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "未找到该事件" });
      }

      await app.prisma.customerEvent.delete({ where: { id: eventId } });
      return reply.status(204).send();
    },
  );
}
