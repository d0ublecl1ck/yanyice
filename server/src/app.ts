import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyReply, FastifyRequest } from "fastify";

import { getCorsOrigin, getJwtSecret } from "./config";
import { createPrismaBundle } from "./prisma";
import { authRoutes } from "./routes/auth";

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

  app.register(cors, { origin: getCorsOrigin() });

  app.register(jwt, { secret: getJwtSecret() });

  app.decorate("authenticate", async (request) => {
    await request.jwtVerify();
  });

  app.register(swagger, {
    openapi: {
      info: { title: "Auth API", version: "0.1.0" },
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

  return app;
}
