import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import "dotenv/config";
const authController = new Elysia()
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
  });

export default authController;
