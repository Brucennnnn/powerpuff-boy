import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: 'bee7c802db4def7a6da2cb5c67a8f59524d207505015acf1f3e3f685bd79e4d6'
    })
  )
  .get('/sign/:name', async ({ jwt, params: { name }, cookie: { auth } }) => {
    const value = await jwt.sign({ name })

    auth.set({
      value,
      httpOnly: true,
      maxAge: 7 * 86400,
      path: '/profile',
    })

    return `Sign in as ${value}`
  })
  .get('/profile', async ({ jwt, error, cookie: { auth } }) => {
    const profile = await jwt.verify(auth.value)

    if (!profile)
      return error(401, 'Unauthorized')

    return `Hello ${profile.name}`
  })
  .listen(8080)

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
