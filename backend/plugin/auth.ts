import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";
import db from "backend/db/db";

const authPlugin = (app: Elysia) =>
  app
    .use(
      jwt({
        name: "jwt",
        secret: process.env.JWT_SECRET_KEY ?? "",
      }),
    )
    .derive(async ({ jwt, headers, set }) => {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401; // Unauthorized
        throw new Error("Invalid JWT");
      }

      const token = authHeader.substring(7);

      try {
        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          throw new Error("Invalid JWT");
        }

        const username = payload.username.toString();

        // Get user ID and role from database
        const user = await db.users.findUnique({
          where: { username }
        });

        if (!user) {
          set.status = 401;
          throw new Error("User not found");
        }

        return {
          username,
          userId: user.id,
          role: user.role
        };
      } catch (e) {
        console.error("JWT Verification Error:", e);
        set.status = 401;
        throw new Error("Invalid JWT");
      }
    });

export { authPlugin };