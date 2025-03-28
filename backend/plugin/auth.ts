import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";

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
        return { username: payload.username.toString() };

      } catch (e) {
        console.error("JWT Verification Error:", e);
        set.status = 401;
        throw new Error("Invalid JWT");
      }
    });

export { authPlugin };
