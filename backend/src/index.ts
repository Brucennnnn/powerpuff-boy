import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import authController from "backend/controller/auth";
import swagger from "@elysiajs/swagger";
import userController from "backend/controller/user";

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(swagger())
  .use(authController)
  .use(userController)
  .get("/hi", async () => {
    return "Hello World";
  })
  .listen(8080);

export type app = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
