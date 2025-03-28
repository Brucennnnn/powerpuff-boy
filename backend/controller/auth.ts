import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import "dotenv/config";
import db from "backend/db/db";
const authController = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET_KEY ?? "",
    }),
  )
  .get("/sign/:name", ({ jwt, params: { name } }) => {
    return jwt.sign({ name });
  })
  .get("/profile", async ({ jwt, error, headers: { authorization } }) => {
    const profile = await jwt.verify(authorization);

    if (!profile) return error(401, "Unauthorized");

    return `Hello ${profile.name}`;
  })
  .post(
    "/signin",
    async ({ body: { username, password } }) => {
      db.user.create({
        data: {
          username: username,
          password: password,
        },
      });
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  );
export default authController;
