import { Elysia } from "elysia";
import { plugin } from "@backend/module";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .get("/hi", async () => {
    return "Hello World";
  })
  .listen(8080);

export type app = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
