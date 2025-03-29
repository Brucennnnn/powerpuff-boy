import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const streakController = new Elysia({ prefix: "/streak" })
    .use(authPlugin)
    .get("/all", async ({ error, role }) => {
        try {
            // Check if user is admin
            if (String(role) !== String(UserRole.ADMIN)) {
                return error(403, {
                    message: "Forbidden: Admin access required"
                });
            }

            const streaks = await db.streak.findMany({
                include: {
                    user: {
                        select: {
                            username: true,
                            firstname: true,
                            lastname: true
                        }
                    }
                }
            });

            return streaks.map(streak => ({
                id: streak.id,
                user_id: streak.user_id,
                username: streak.user.username,
                firstname: streak.user.firstname,
                lastname: streak.user.lastname,
                count: streak.count,
                streak_start_at: streak.streak_start_at.toISOString(),
                streak_reset_at: streak.streak_reset_at ? streak.streak_reset_at.toISOString() : undefined,
                updated_at: streak.updated_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/", async ({ userId, error }) => {
        try {
            const streak = await db.streak.findUnique({
                where: {
                    user_id: userId,
                },
            });

            if (!streak) {
                return error(404, {
                    message: "Streak not found"
                });
            }

            return {
                id: streak.id,
                user_id: streak.user_id,
                count: streak.count,
                streak_start_at: streak.streak_start_at.toISOString(),
                streak_reset_at: streak.streak_reset_at ? streak.streak_reset_at.toISOString() : undefined,
                updated_at: streak.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/", async ({ userId, error }) => {
        try {
            // Check if streak already exists
            const existingStreak = await db.streak.findUnique({
                where: {
                    user_id: userId,
                },
            });

            if (existingStreak) {
                return error(400, {
                    message: "Streak already exists for this user"
                });
            }

            const streak = await db.streak.create({
                data: {
                    user_id: userId,
                    count: 1,
                    streak_start_at: new Date(),
                },
            });

            return {
                id: streak.id,
                user_id: streak.user_id,
                count: streak.count,
                streak_start_at: streak.streak_start_at.toISOString(),
                streak_reset_at: streak.streak_reset_at ? streak.streak_reset_at.toISOString() : undefined,
                updated_at: streak.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .put("/increment", async ({ userId, error }) => {
        try {
            const streak = await db.streak.findUnique({
                where: {
                    user_id: userId,
                },
            });

            if (!streak) {
                return error(404, {
                    message: "Streak not found"
                });
            }

            const updatedStreak = await db.streak.update({
                where: {
                    user_id: userId,
                },
                data: {
                    count: streak.count + 1,
                },
            });

            return {
                id: updatedStreak.id,
                user_id: updatedStreak.user_id,
                count: updatedStreak.count,
                streak_start_at: updatedStreak.streak_start_at.toISOString(),
                streak_reset_at: updatedStreak.streak_reset_at ? updatedStreak.streak_reset_at.toISOString() : undefined,
                updated_at: updatedStreak.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .put("/reset", async ({ userId, error }) => {
        try {
            const streak = await db.streak.findUnique({
                where: {
                    user_id: userId,
                },
            });

            if (!streak) {
                return error(404, {
                    message: "Streak not found"
                });
            }

            const updatedStreak = await db.streak.update({
                where: {
                    user_id: userId,
                },
                data: {
                    count: 0,
                    streak_reset_at: new Date(),
                },
            });

            return {
                id: updatedStreak.id,
                user_id: updatedStreak.user_id,
                count: updatedStreak.count,
                streak_start_at: updatedStreak.streak_start_at.toISOString(),
                streak_reset_at: updatedStreak.streak_reset_at ? updatedStreak.streak_reset_at.toISOString() : undefined,
                updated_at: updatedStreak.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .delete("/", async ({ userId, error }) => {
        try {
            const streak = await db.streak.findUnique({
                where: {
                    user_id: userId,
                },
            });

            if (!streak) {
                return error(404, {
                    message: "Streak not found"
                });
            }

            await db.streak.delete({
                where: {
                    user_id: userId,
                },
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default streakController;