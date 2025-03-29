import { Prisma } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";
const userController = new Elysia({ prefix: "/user" })
  .use(authPlugin)
  .get("/me", async ({ username, error }) => {
    try {
      const user = await db.user.findUnique({
        where: {
          username: username,
        },
      });
      if (!user) {
        return error(404, {
          message: "User not found"
        })
      }
      return user
    } catch (err) {
      return error(500, { message: "Internal Server Error" })
    }
  }, {
    response: {
      200: t.Object({
        id: t.Number(),
        username: t.String(),
        firstname: t.String(),
        lastname: t.String(),
      }),
      404: t.Object({
        message: t.String(),
      }),
      500: t.Object({
        message: t.String(),
      }),
    }
  })

export default userController;
