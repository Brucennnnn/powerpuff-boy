import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import "dotenv/config";
import db from "backend/db/db";
import { Prisma } from "@prisma/client";

const authController = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET_KEY ?? "",
    }),
  )
  .post(
    "/register",
    async ({ body: { username, password, firstname, lastname, role }, error }) => {
      try {
        const user = await db.user.create({
          data: {
            username,
            password,
            firstname, 
            lastname,
            role: role || "student",
          },
        });
        return {
          ...user,
          bio: user.bio ?? undefined,
          skills: user.skills ?? undefined,
          profilePicture: user.profilePicture ?? undefined,
          createdAt: user.createdAt.toISOString(),
        };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            return error(400, {
              message: "Username already exists"
            });
          }
        }
        return error(500, { message: "Internal Server Error" });
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        firstname: t.String(),
        lastname: t.String(),
        role: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          id: t.Number(),
          username: t.String(),
          password: t.String(),
          firstname: t.String(),
          lastname: t.String(),
          role: t.String(),
          bio: t.Optional(t.String()),
          skills: t.Optional(t.String()),
          profilePicture: t.Optional(t.String()),
          createdAt: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        500: t.Object({
          message: t.String(),
        }),
      }
    },
  ).post(
    "/login",
    async ({ jwt, body: { username, password }, error }) => {
      try {
        const user = await db.user.findUnique({
          where: {
            username: username,
          },
        });
        if (!user || user.password !== password) {
          return error(404, {
            message: "User not found or invalid credentials"
          });
        }
        const token = await jwt.sign({ 
          id: user.id,
          username: user.username,
          role: user.role
        });
        return { token };
      } catch (err) {
        return error(500, { message: "Internal Server Error" });
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      response: {
        200: t.Object({
          token: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
        500: t.Object({
          message: t.String(),
        }),
      }
    });

export default authController;