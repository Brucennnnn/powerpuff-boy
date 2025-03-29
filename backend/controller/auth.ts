import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import "dotenv/config";
import db from "backend/db/db";
import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const authController = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET_KEY ?? "",
    }),
  )
  .post(
    "/register",
    async ({ body: { username, password, firstname, lastname, role }, error }) => {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Convert role string to enum value or use default STUDENT
        let userRole: UserRole = UserRole.STUDENT;
        if (role) {
          const upperRole = role.toUpperCase();
          if (upperRole === 'INSTRUCTOR') {
            userRole = UserRole.INSTRUCTOR;
          } else if (upperRole === 'ADMIN') {
            userRole = UserRole.ADMIN;
          }
        }

        const user = await db.users.create({
          data: {
            username,
            password: hashedPassword,
            firstname,
            lastname,
            role: userRole,
            created_at: new Date(),
          },
        });

        return {
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          bio: user.bio || undefined,
          skills: user.skills || undefined,
          profile_picture: user.profile_picture || undefined,
          created_at: user.created_at.toISOString(),
        };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            return error(400, {
              message: "Username already exists"
            });
          }
        }
        return error(500, { message: "Internal Server Error" });
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        firstname: t.String(),
        lastname: t.String(),
        role: t.Optional(t.String()),
      }),
    },
  ).post(
    "/login",
    async ({ jwt, body: { username, password }, error }) => {
      try {
        const user = await db.users.findUnique({
          where: {
            username: username,
          },
        });

        if (!user) {
          return error(404, {
            message: "User not found or invalid credentials"
          });
        }

        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return error(404, {
            message: "User not found or invalid credentials"
          });
        }

        const token = await jwt.sign({
          id: user.id,
          username: user.username,
          role: user.role
        });

        return { token };
      } catch (err) {
        return error(500, { message: "Internal Server Error" });
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    });

export default authController;