import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const challengesController = new Elysia({ prefix: "/challenges" })
    .use(authPlugin)
    .get("/", async ({ error }) => {
        try {
            const challenges = await db.challenges.findMany({
                where: {
                    is_active: true
                },
                orderBy: [
                    {
                        challenge_type: 'asc'  // Daily challenges first
                    },
                    {
                        end_date: 'asc'  // Sort by end date (soonest first)
                    }
                ]
            });

            return challenges.map(challenge => ({
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                points: challenge.points,
                xp: challenge.xp,
                start_date: challenge.start_date.toISOString(),
                end_date: challenge.end_date ? challenge.end_date.toISOString() : null,
                completion_criteria: challenge.completion_criteria,
                difficulty: challenge.difficulty,
                is_active: challenge.is_active
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/active", async ({ error }) => {
        try {
            const now = new Date();

            const challenges = await db.challenges.findMany({
                where: {
                    is_active: true,
                    start_date: {
                        lte: now
                    },
                    OR: [
                        {
                            end_date: null
                        },
                        {
                            end_date: {
                                gte: now
                            }
                        }
                    ]
                },
                orderBy: [
                    {
                        challenge_type: 'asc'  // Daily challenges first
                    },
                    {
                        end_date: 'asc'  // Sort by end date (soonest first)
                    }
                ]
            });

            return challenges.map(challenge => ({
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                points: challenge.points,
                xp: challenge.xp,
                start_date: challenge.start_date.toISOString(),
                end_date: challenge.end_date ? challenge.end_date.toISOString() : null,
                completion_criteria: challenge.completion_criteria,
                difficulty: challenge.difficulty,
                is_active: challenge.is_active
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/:id", async ({ params: { id }, error }) => {
        try {
            const challengeId = parseInt(id);

            if (isNaN(challengeId)) {
                return error(400, { message: "Invalid challenge ID" });
            }

            const challenge = await db.challenges.findUnique({
                where: {
                    id: challengeId
                }
            });

            if (!challenge) {
                return error(404, { message: "Challenge not found" });
            }

            return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                points: challenge.points,
                xp: challenge.xp,
                start_date: challenge.start_date.toISOString(),
                end_date: challenge.end_date ? challenge.end_date.toISOString() : null,
                completion_criteria: challenge.completion_criteria,
                difficulty: challenge.difficulty,
                is_active: challenge.is_active,
                created_at: challenge.created_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/", async ({ body, role, error }) => {
        try {
            // Only admins can create challenges
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const { title, description, challenge_type, points, xp, start_date, end_date, completion_criteria, difficulty } = body;

            // Validate challenge_type
            if (challenge_type !== 'daily' && challenge_type !== 'global') {
                return error(400, { message: "Challenge type must be 'daily' or 'global'" });
            }

            // Validate difficulty
            if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
                return error(400, { message: "Difficulty must be 'easy', 'medium', or 'hard'" });
            }

            const challenge = await db.challenges.create({
                data: {
                    title,
                    description,
                    challenge_type,
                    points,
                    xp,
                    start_date: new Date(start_date),
                    end_date: end_date ? new Date(end_date) : null,
                    completion_criteria,
                    difficulty,
                    is_active: true,
                    created_at: new Date()
                }
            });

            return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                points: challenge.points,
                xp: challenge.xp,
                start_date: challenge.start_date.toISOString(),
                end_date: challenge.end_date ? challenge.end_date.toISOString() : null,
                completion_criteria: challenge.completion_criteria,
                difficulty: challenge.difficulty,
                is_active: challenge.is_active,
                created_at: challenge.created_at.toISOString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid challenge data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            title: t.String(),
            description: t.String(),
            challenge_type: t.String(),
            points: t.Number(),
            xp: t.Number(),
            start_date: t.String(),
            end_date: t.Optional(t.String()),
            completion_criteria: t.String(),
            difficulty: t.String()
        })
    })
    .put("/:id", async ({ params: { id }, body, role, error }) => {
        try {
            // Only admins can update challenges
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const challengeId = parseInt(id);

            if (isNaN(challengeId)) {
                return error(400, { message: "Invalid challenge ID" });
            }

            // Check if challenge exists
            const existingChallenge = await db.challenges.findUnique({
                where: {
                    id: challengeId
                }
            });

            if (!existingChallenge) {
                return error(404, { message: "Challenge not found" });
            }

            const { title, description, challenge_type, points, xp, start_date, end_date, completion_criteria, difficulty, is_active } = body;

            // Validate challenge_type
            if (challenge_type !== 'daily' && challenge_type !== 'global') {
                return error(400, { message: "Challenge type must be 'daily' or 'global'" });
            }

            // Validate difficulty
            if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
                return error(400, { message: "Difficulty must be 'easy', 'medium', or 'hard'" });
            }

            const challenge = await db.challenges.update({
                where: {
                    id: challengeId
                },
                data: {
                    title,
                    description,
                    challenge_type,
                    points,
                    xp,
                    start_date: new Date(start_date),
                    end_date: end_date ? new Date(end_date) : null,
                    completion_criteria,
                    difficulty,
                    is_active
                }
            });

            return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                points: challenge.points,
                xp: challenge.xp,
                start_date: challenge.start_date.toISOString(),
                end_date: challenge.end_date ? challenge.end_date.toISOString() : null,
                completion_criteria: challenge.completion_criteria,
                difficulty: challenge.difficulty,
                is_active: challenge.is_active,
                created_at: challenge.created_at.toISOString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid challenge data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            title: t.String(),
            description: t.String(),
            challenge_type: t.String(),
            points: t.Number(),
            xp: t.Number(),
            start_date: t.String(),
            end_date: t.Optional(t.String()),
            completion_criteria: t.String(),
            difficulty: t.String(),
            is_active: t.Boolean()
        })
    })
    .delete("/:id", async ({ params: { id }, role, error }) => {
        try {
            // Only admins can delete challenges
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const challengeId = parseInt(id);

            if (isNaN(challengeId)) {
                return error(400, { message: "Invalid challenge ID" });
            }

            // Check if challenge exists
            const existingChallenge = await db.challenges.findUnique({
                where: {
                    id: challengeId
                }
            });

            if (!existingChallenge) {
                return error(404, { message: "Challenge not found" });
            }

            // Delete user challenges first
            await db.user_challenges.deleteMany({
                where: {
                    challenge_id: challengeId
                }
            });

            // Then delete the challenge
            await db.challenges.delete({
                where: {
                    id: challengeId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default challengesController;