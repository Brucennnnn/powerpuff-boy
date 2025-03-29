import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import authController from "backend/controller/auth";
import swagger from "@elysiajs/swagger";
import userController from "backend/controller/user";
import streakController from "backend/controller/streak";
import tournamentsController from "backend/controller/tournaments";
import tournamentResultsController from "backend/controller/tournament_results";
import coursesController from "backend/controller/courses";
import lessonsController from "backend/controller/lessons";
import enrollmentsController from "backend/controller/enrollments";
import instructorApplicationsController from "backend/controller/instructor_applications";
import paymentsController from "backend/controller/payments";
import reviewsController from "backend/controller/reviews";
import challengesController from "backend/controller/challenges";
import userChallengesController from "backend/controller/user_challenges";

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(swagger())
  .get("/ping", async () => {
    return "pong";
  })
  .use(authController)
  .use(userController)
  .use(streakController)
  .use(tournamentsController)
  .use(tournamentResultsController)
  .use(coursesController)
  .use(lessonsController)
  .use(enrollmentsController)
  .use(instructorApplicationsController)
  .use(paymentsController)
  .use(reviewsController)
  .use(challengesController)
  .use(userChallengesController)
  .listen(8080);

export type app = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
