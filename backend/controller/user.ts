import { Prisma } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";
const userController = new Elysia({ prefix: "/user" })
  .use(authPlugin)
  .get("/me", async ({ username, error }) => {
    try {
      const user = await db.users.findUnique({
        where: {
          username: username,
        },
      });
      if (!user) {
        return error(404, {
          message: "User not found"
        })
      }
      return {
        ...user,
        bio: user.bio ?? undefined, // Map null to undefined for bio
        skills: user.skills ?? undefined, // Map null to undefined for skills
        profile_picture: user.profile_picture ?? undefined, // Map null to undefined for profile_picture  
      }
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
        role: t.String(),
        bio: t.Optional(t.String()),
        skill: t.Optional(t.String()),
        profile_picture: t.Optional(t.String())
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
