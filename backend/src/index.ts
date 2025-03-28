import { Elysia } from "elysia";
import { plugin } from "@backend/module";
import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(
    jwt({
      name: "jwt",
      secret: "Fischl von Luftschloss Narfidort",
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
  .get("/hi", async () => {
    return "Hello World";
  })
  .listen(8080);

export type app = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
