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
    async ({ body: { username, password }, error }) => {
      try {
        const user = await db.user.create({
          data: {
            username: username,
            password: password,
          },
        });
        return user
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            return error(400, {
              message: "Username already exists"
            })
          }
        }
        return error(500, { message: "Internal Server Error" })
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      response: {
        200: t.Object({
          id: t.Number(),
          username: t.String(),
          password: t.String(),
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
            message: "User not found"
          })
        }
        const token = await jwt.sign({ username: user.username })
        return { token }
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            return error(400, {
              message: "Username already exists"
            })
          }
        }
        return error(500, { message: "Internal Server Error" })
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
        400: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
        500: t.Object({
          message: t.String(),
        }),
      }
    })

export default authController;
