import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import authController from "backend/controller/auth";
import swagger from "@elysiajs/swagger";
import userController from "backend/controller/user";
import { careerRouter } from "./routes/career";
import questionsController from "backend/controller/questions";
import jobsController from "backend/controller/jobs";
import logsController from "backend/controller/logs";
import { shareStoryRoutes } from './routes/shareStory.route';

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(swagger())
  .get("/ping", async () => {
    return "pong";
  })
  .use(authController)
  .use(userController)
  .use(careerRouter)
  .use(questionsController)
  .use(jobsController)
  .use(logsController)
  .use(shareStoryRoutes);
  .listen(8080);

export type app = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
