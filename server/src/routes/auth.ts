import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { Type, type Static } from "@sinclair/typebox";

const RegisterBody = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6, maxLength: 128 }),
});

const LoginBody = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6, maxLength: 128 }),
});

const PublicUser = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
});

type RegisterBodyType = Static<typeof RegisterBody>;
type LoginBodyType = Static<typeof LoginBody>;

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    {
      schema: {
        tags: ["auth"],
        body: RegisterBody,
        response: {
          201: Type.Object({ user: PublicUser, accessToken: Type.String() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as RegisterBodyType;

      const existing = await app.prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({ code: "EMAIL_TAKEN", message: "该邮箱已注册" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await app.prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      });
      const accessToken = await reply.jwtSign({ sub: user.id });
      return reply.status(201).send({ user, accessToken });
    },
  );

  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["auth"],
        body: LoginBody,
        response: {
          200: Type.Object({ user: PublicUser, accessToken: Type.String() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as LoginBodyType;

      const user = await app.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ code: "INVALID_CREDENTIALS", message: "账号或密码错误" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return reply.status(401).send({ code: "INVALID_CREDENTIALS", message: "账号或密码错误" });
      }

      const accessToken = await reply.jwtSign({ sub: user.id });
      return reply.send({ user: { id: user.id, email: user.email }, accessToken });
    },
  );

  app.get(
    "/auth/me",
    {
      schema: {
        tags: ["auth"],
        security: [{ bearerAuth: [] }],
        response: { 200: Type.Object({ user: PublicUser }) },
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });
      if (!user) {
        return reply.status(401).send({ code: "UNAUTHORIZED", message: "登录已失效" });
      }
      return { user };
    },
  );
}
