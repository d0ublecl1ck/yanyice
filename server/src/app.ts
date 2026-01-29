import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyReply, FastifyRequest } from "fastify";

import { getCorsOrigin, getJwtSecret } from "./config";
import { createPrismaBundle } from "./prisma";
import { authRoutes } from "./routes/auth";
import { customerRoutes } from "./routes/customers";
import { liuyaoRoutes } from "./routes/liuyao";
import { recordRoutes } from "./routes/records";
import { ruleRoutes } from "./routes/rules";

declare module "fastify" {
  interface FastifyInstance {
    prisma: ReturnType<typeof createPrismaBundle>["prisma"];
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      sub: string;
    };
  }
}

export function buildApp(options?: { databaseUrl?: string; logger?: boolean }) {
  const app = Fastify({ logger: options?.logger ?? true });

  const prismaBundle = createPrismaBundle(options?.databaseUrl);
  app.decorate("prisma", prismaBundle.prisma);
  app.addHook("onClose", async () => {
    await prismaBundle.close();
  });

  app.register(cors, {
    origin: getCorsOrigin(),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
  });

  app.register(jwt, { secret: getJwtSecret() });

  app.decorate("authenticate", async (request) => {
    await request.jwtVerify();
  });

  app.register(swagger, {
    openapi: {
      info: { title: "Yanyice API", version: "0.1.0" },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
  });

  app.register(swaggerUi, { routePrefix: "/docs" });

  app.get("/openapi.json", async () => app.swagger());

  app.get("/health", async () => ({ ok: true }));

  app.register(authRoutes, { prefix: "/api" });
  app.register(customerRoutes, { prefix: "/api" });
  app.register(liuyaoRoutes, { prefix: "/api" });
  app.register(recordRoutes, { prefix: "/api" });
  app.register(ruleRoutes, { prefix: "/api" });

  return app;
}
