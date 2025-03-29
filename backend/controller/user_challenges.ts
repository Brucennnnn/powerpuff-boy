import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const userChallengesController = new Elysia({ prefix: "/user-challenges" })
    .use(authPlugin)
    .get("/my", async ({ userId, error }) => {
        try {
            const userChallenges = await db.user_challenges.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    challenge: true
                },
                orderBy: [
                    {
                        completed: 'asc' // Not completed first
                    },
                    {
                        created_at: 'desc' // Most recent first
                    }
                ]
            });

            return userChallenges.map(userChallenge => ({
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                title: userChallenge.challenge.title,
                description: userChallenge.challenge.description,
                challenge_type: userChallenge.challenge.challenge_type,
                difficulty: userChallenge.challenge.difficulty,
                progress: userChallenge.progress,
                completed: userChallenge.completed,
                completed_at: userChallenge.completed_at ? userChallenge.completed_at.toISOString() : null,
                points_earned: userChallenge.points_earned || 0,
                xp_earned: userChallenge.xp_earned || 0,
                created_at: userChallenge.created_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/my/active", async ({ userId, error }) => {
        try {
            const now = new Date();

            const userChallenges = await db.user_challenges.findMany({
                where: {
                    user_id: userId,
                    completed: false,
                    challenge: {
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
                    }
                },
                include: {
                    challenge: true
                },
                orderBy: [
                    {
                        challenge: {
                            challenge_type: 'asc' // Daily challenges first
                        }
                    },
                    {
                        progress: 'desc' // Most progress first
                    }
                ]
            });

            return userChallenges.map(userChallenge => ({
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                title: userChallenge.challenge.title,
                description: userChallenge.challenge.description,
                challenge_type: userChallenge.challenge.challenge_type,
                difficulty: userChallenge.challenge.difficulty,
                progress: userChallenge.progress,
                completion_criteria: userChallenge.challenge.completion_criteria,
                created_at: userChallenge.created_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/my/completed", async ({ userId, error }) => {
        try {
            const userChallenges = await db.user_challenges.findMany({
                where: {
                    user_id: userId,
                    completed: true
                },
                include: {
                    challenge: true
                },
                orderBy: {
                    completed_at: 'desc' // Most recently completed first
                }
            });

            return userChallenges.map(userChallenge => ({
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                title: userChallenge.challenge.title,
                description: userChallenge.challenge.description,
                challenge_type: userChallenge.challenge.challenge_type,
                difficulty: userChallenge.challenge.difficulty,
                completed_at: userChallenge.completed_at ? userChallenge.completed_at.toISOString() : null,
                points_earned: userChallenge.points_earned || 0,
                xp_earned: userChallenge.xp_earned || 0
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/start/:id", async ({ params: { id }, userId, error }) => {
        try {
            const challengeId = parseInt(id);

            if (isNaN(challengeId)) {
                return error(400, { message: "Invalid challenge ID" });
            }

            // Check if challenge exists and is active
            const challenge = await db.challenges.findUnique({
                where: {
                    id: challengeId,
                    is_active: true
                }
            });

            if (!challenge) {
                return error(404, { message: "Challenge not found or not active" });
            }

            // Check if challenge is within valid date range
            const now = new Date();
            if (challenge.start_date > now) {
                return error(400, { message: "This challenge hasn't started yet" });
            }
            if (challenge.end_date && challenge.end_date < now) {
                return error(400, { message: "This challenge has already ended" });
            }

            // Check if user has already started this challenge
            const existingUserChallenge = await db.user_challenges.findFirst({
                where: {
                    user_id: userId,
                    challenge_id: challengeId
                }
            });

            if (existingUserChallenge) {
                return error(400, { message: "You have already started this challenge" });
            }

            const userChallenge = await db.user_challenges.create({
                data: {
                    user_id: userId,
                    challenge_id: challengeId,
                    progress: 0,
                    completed: false,
                    created_at: new Date()
                }
            });

            return {
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                progress: userChallenge.progress,
                completed: userChallenge.completed,
                created_at: userChallenge.created_at.toISOString(),
                message: "Challenge started successfully"
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .put("/progress/:id", async ({ params: { id }, body, userId, error }) => {
        try {
            const userChallengeId = parseInt(id);

            if (isNaN(userChallengeId)) {
                return error(400, { message: "Invalid user challenge ID" });
            }

            const { progress } = body;

            // Validate progress
            if (progress < 0 || progress > 100) {
                return error(400, { message: "Progress must be between 0 and 100" });
            }

            // Check if user challenge exists and belongs to the user
            const existingUserChallenge = await db.user_challenges.findFirst({
                where: {
                    id: userChallengeId,
                    user_id: userId
                },
                include: {
                    challenge: true
                }
            });

            if (!existingUserChallenge) {
                return error(404, { message: "User challenge not found" });
            }

            // If challenge is already completed, don't update progress
            if (existingUserChallenge.completed) {
                return error(400, { message: "This challenge is already completed" });
            }

            // Check if challenge is still active and within valid date range
            const challenge = existingUserChallenge.challenge;
            const now = new Date();

            if (!challenge.is_active) {
                return error(400, { message: "This challenge is no longer active" });
            }

            if (challenge.end_date && challenge.end_date < now) {
                return error(400, { message: "This challenge has already ended" });
            }

            // Update user challenge progress
            const updatedData: any = {
                progress
            };

            // If progress is 100%, mark as completed
            if (progress === 100) {
                updatedData.completed = true;
                updatedData.completed_at = now;
                updatedData.points_earned = challenge.points;
                updatedData.xp_earned = challenge.xp;
            }

            const userChallenge = await db.user_challenges.update({
                where: {
                    id: userChallengeId
                },
                data: updatedData
            });

            // If challenge was completed, update user's XP and level
            if (progress === 100) {
                // Get user's current level
                const userLevel = await db.user_level.findUnique({
                    where: {
                        user_id: userId
                    },
                    include: {
                        level: true
                    }
                });

                if (userLevel) {
                    // Update XP
                    const newXP = userLevel.current_xp + challenge.xp;

                    // Check if user should level up
                    if (newXP > userLevel.level.max_xp) {
                        // Find the next level
                        const nextLevel = await db.levels.findFirst({
                            where: {
                                level_number: userLevel.level.level_number + 1
                            }
                        });

                        if (nextLevel) {
                            // Update to next level
                            await db.user_level.update({
                                where: {
                                    user_id: userId
                                },
                                data: {
                                    level_id: nextLevel.id,
                                    current_xp: newXP - userLevel.level.max_xp // Carry over excess XP
                                }
                            });
                        } else {
                            // No next level, just update XP
                            await db.user_level.update({
                                where: {
                                    user_id: userId
                                },
                                data: {
                                    current_xp: newXP
                                }
                            });
                        }
                    } else {
                        // Just update XP, no level up
                        await db.user_level.update({
                            where: {
                                user_id: userId
                            },
                            data: {
                                current_xp: newXP
                            }
                        });
                    }
                } else {
                    // User doesn't have a level yet, create one
                    const firstLevel = await db.levels.findFirst({
                        where: {
                            level_number: 1
                        }
                    });

                    if (firstLevel) {
                        await db.user_level.create({
                            data: {
                                user_id: userId,
                                level_id: firstLevel.id,
                                current_xp: challenge.xp
                            }
                        });
                    }
                }
            }

            return {
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                progress: userChallenge.progress,
                completed: userChallenge.completed,
                completed_at: userChallenge.completed_at ? userChallenge.completed_at.toISOString() : null,
                points_earned: userChallenge.points_earned || 0,
                xp_earned: userChallenge.xp_earned || 0,
                message: progress === 100 ? "Challenge completed! You earned points and XP." : "Progress updated successfully."
            };
        } catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            progress: t.Number()
        })
    })
    .delete("/:id", async ({ params: { id }, userId, role, error }) => {
        try {
            const userChallengeId = parseInt(id);

            if (isNaN(userChallengeId)) {
                return error(400, { message: "Invalid user challenge ID" });
            }

            // Check if user challenge exists
            const existingUserChallenge = await db.user_challenges.findUnique({
                where: {
                    id: userChallengeId
                }
            });

            if (!existingUserChallenge) {
                return error(404, { message: "User challenge not found" });
            }

            // Check if user owns the challenge or is an admin
            if (existingUserChallenge.user_id !== userId && role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: You can only delete your own challenges" });
            }

            await db.user_challenges.delete({
                where: {
                    id: userChallengeId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default userChallengesController;