import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const userRankController = new Elysia({ prefix: "/user-rank" })
    .use(authPlugin)
    .get("/my", async ({ userId, error }) => {
        try {
            // Get the active season
            const activeSeason = await db.rank_seasons.findFirst({
                where: {
                    is_active: true
                }
            });

            if (!activeSeason) {
                return error(404, { message: "No active rank season found" });
            }

            // Get user's rank for the active season
            const userRank = await db.user_rank.findUnique({
                where: {
                    user_id_season_id: {
                        user_id: userId,
                        season_id: activeSeason.id
                    }
                },
                include: {
                    rank: true,
                    season: true
                }
            });

            if (!userRank) {
                // User doesn't have a rank yet, get the lowest rank for the season
                const lowestRank = await db.ranks.findFirst({
                    where: {
                        season_id: activeSeason.id
                    },
                    orderBy: {
                        min_points: 'asc'
                    }
                });

                if (!lowestRank) {
                    return error(404, { message: "No ranks defined for the active season" });
                }

                // Create a user rank entry with 0 points
                const newUserRank = await db.user_rank.create({
                    data: {
                        user_id: userId,
                        rank_id: lowestRank.id,
                        season_id: activeSeason.id,
                        points: 0
                    },
                    include: {
                        rank: true,
                        season: true
                    }
                });

                return {
                    season: {
                        id: newUserRank.season.id,
                        name: newUserRank.season.name
                    },
                    rank: {
                        id: newUserRank.rank.id,
                        name: newUserRank.rank.name,
                        min_points: newUserRank.rank.min_points
                    },
                    points: newUserRank.points,
                    updated_at: newUserRank.updated_at.toISOString()
                };
            }

            return {
                season: {
                    id: userRank.season.id,
                    name: userRank.season.name
                },
                rank: {
                    id: userRank.rank.id,
                    name: userRank.rank.name,
                    min_points: userRank.rank.min_points
                },
                points: userRank.points,
                updated_at: userRank.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/my/all", async ({ userId, error }) => {
        try {
            // Get all of the user's ranks across all seasons
            const userRanks = await db.user_rank.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    rank: true,
                    season: true
                },
                orderBy: {
                    season: {
                        start_date: 'desc'
                    }
                }
            });

            return userRanks.map(userRank => ({
                season: {
                    id: userRank.season.id,
                    name: userRank.season.name,
                    is_active: userRank.season.is_active
                },
                rank: {
                    id: userRank.rank.id,
                    name: userRank.rank.name,
                    min_points: userRank.rank.min_points
                },
                points: userRank.points,
                updated_at: userRank.updated_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/user/:id", async ({ params: { id }, role, error }) => {
        try {
            // Only instructors and admins can view other users' ranks
            if (role !== UserRole.INSTRUCTOR && role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Instructor or Admin access required" });
            }

            const targetUserId = parseInt(id);

            if (isNaN(targetUserId)) {
                return error(400, { message: "Invalid user ID" });
            }

            // Check if user exists
            const user = await db.users.findUnique({
                where: {
                    id: targetUserId
                },
                select: {
                    username: true,
                    firstname: true,
                    lastname: true
                }
            });

            if (!user) {
                return error(404, { message: "User not found" });
            }

            // Get the active season
            const activeSeason = await db.rank_seasons.findFirst({
                where: {
                    is_active: true
                }
            });

            if (!activeSeason) {
                return error(404, { message: "No active rank season found" });
            }

            // Get user's rank for the active season
            const userRank = await db.user_rank.findUnique({
                where: {
                    user_id_season_id: {
                        user_id: targetUserId,
                        season_id: activeSeason.id
                    }
                },
                include: {
                    rank: true
                }
            });

            if (!userRank) {
                return {
                    user: {
                        id: targetUserId,
                        username: user.username,
                        name: `${user.firstname} ${user.lastname}`
                    },
                    season: {
                        id: activeSeason.id,
                        name: activeSeason.name
                    },
                    rank: null,
                    points: 0
                };
            }

            return {
                user: {
                    id: targetUserId,
                    username: user.username,
                    name: `${user.firstname} ${user.lastname}`
                },
                season: {
                    id: activeSeason.id,
                    name: activeSeason.name
                },
                rank: {
                    id: userRank.rank.id,
                    name: userRank.rank.name,
                    min_points: userRank.rank.min_points
                },
                points: userRank.points,
                updated_at: userRank.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/add-points", async ({ body, userId, role, error }) => {
        try {
            let targetUserId = userId;
            let pointsAmount = body.points;

            // If admin is granting points to another user
            if (role === UserRole.ADMIN && body.user_id) {
                targetUserId = body.user_id;
            }

            // Validate points amount
            if (pointsAmount <= 0) {
                return error(400, { message: "Points amount must be greater than 0" });
            }

            // Check if user exists
            const user = await db.users.findUnique({
                where: {
                    id: targetUserId
                }
            });

            if (!user) {
                return error(404, { message: "User not found" });
            }

            // Get the active season
            const activeSeason = await db.rank_seasons.findFirst({
                where: {
                    is_active: true
                }
            });

            if (!activeSeason) {
                return error(404, { message: "No active rank season found" });
            }

            // Get all ranks for the active season, ordered by min_points ascending
            const ranks = await db.ranks.findMany({
                where: {
                    season_id: activeSeason.id
                },
                orderBy: {
                    min_points: 'asc'
                }
            });

            if (ranks.length === 0) {
                return error(404, { message: "No ranks defined for the active season" });
            }

            // Get user's current rank for the active season
            let userRank = await db.user_rank.findUnique({
                where: {
                    user_id_season_id: {
                        user_id: targetUserId,
                        season_id: activeSeason.id
                    }
                },
                include: {
                    rank: true
                }
            });

            // If user doesn't have a rank yet, create one with the lowest rank
            if (!userRank) {
                userRank = await db.user_rank.create({
                    data: {
                        user_id: targetUserId,
                        rank_id: ranks[0].id,
                        season_id: activeSeason.id,
                        points: 0
                    },
                    include: {
                        rank: true
                    }
                });
            }

            // Calculate new points
            const newPoints = userRank.points + pointsAmount;

            // Determine if user should be promoted to a higher rank
            let newRankId = userRank.rank_id;
            let didRankUp = false;
            let oldRankName = userRank.rank.name;
            let newRankName = oldRankName;

            // Find the highest rank the user qualifies for with their new points
            for (let i = ranks.length - 1; i >= 0; i--) {
                if (newPoints >= ranks[i].min_points) {
                    if (ranks[i].id !== userRank.rank_id) {
                        newRankId = ranks[i].id;
                        didRankUp = true;
                        newRankName = ranks[i].name;
                    }
                    break;
                }
            }

            // Update user rank
            const updatedUserRank = await db.user_rank.update({
                where: {
                    user_id_season_id: {
                        user_id: targetUserId,
                        season_id: activeSeason.id
                    }
                },
                data: {
                    rank_id: newRankId,
                    points: newPoints
                },
                include: {
                    rank: true,
                    season: true
                }
            });

            return {
                user_id: targetUserId,
                season: {
                    id: updatedUserRank.season.id,
                    name: updatedUserRank.season.name
                },
                rank: {
                    id: updatedUserRank.rank.id,
                    name: updatedUserRank.rank.name,
                    min_points: updatedUserRank.rank.min_points
                },
                points: updatedUserRank.points,
                points_added: pointsAmount,
                rank_up: didRankUp,
                previous_rank: didRankUp ? oldRankName : null,
                updated_at: updatedUserRank.updated_at.toISOString()
            };
        } catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            points: t.Number(),
            user_id: t.Optional(t.Number()) // Optional, only used by admins
        })
    })
    .put("/", async ({ body, role, error }) => {
        try {
            // Only admins can directly set user ranks
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const { user_id, rank_id, season_id, points } = body;

            // Check if user exists
            const user = await db.users.findUnique({
                where: {
                    id: user_id
                }
            });

            if (!user) {
                return error(404, { message: "User not found" });
            }

            // Check if rank exists
            const rank = await db.ranks.findUnique({
                where: {
                    id: rank_id
                }
            });

            if (!rank) {
                return error(404, { message: "Rank not found" });
            }

            // Check if season exists
            const season = await db.rank_seasons.findUnique({
                where: {
                    id: season_id
                }
            });

            if (!season) {
                return error(404, { message: "Season not found" });
            }

            // Check if rank belongs to the specified season
            if (rank.season_id !== season_id) {
                return error(400, {
                    message: "Rank does not belong to the specified season"
                });
            }

            // Validate points (must be at least the minimum for the rank)
            if (points < rank.min_points) {
                return error(400, {
                    message: `Points must be at least ${rank.min_points} for rank ${rank.name}`
                });
            }

            // Check if user rank exists for this season
            const existingUserRank = await db.user_rank.findUnique({
                where: {
                    user_id_season_id: {
                        user_id,
                        season_id
                    }
                }
            });

            let userRank;

            if (existingUserRank) {
                // Update existing user rank
                userRank = await db.user_rank.update({
                    where: {
                        user_id_season_id: {
                            user_id,
                            season_id
                        }
                    },
                    data: {
                        rank_id,
                        points
                    },
                    include: {
                        rank: true,
                        season: true
                    }
                });
            } else {
                // Create new user rank
                userRank = await db.user_rank.create({
                    data: {
                        user_id,
                        rank_id,
                        season_id,
                        points
                    },
                    include: {
                        rank: true,
                        season: true
                    }
                });
            }

            return {
                user_id,
                season: {
                    id: userRank.season.id,
                    name: userRank.season.name
                },
                rank: {
                    id: userRank.rank.id,
                    name: userRank.rank.name,
                    min_points: userRank.rank.min_points
                },
                points: userRank.points,
                updated_at: userRank.updated_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            user_id: t.Number(),
            rank_id: t.Number(),
            season_id: t.Number(),
            points: t.Number()
        })
    })
    .delete("/:userId/:seasonId", async ({ params: { userId, seasonId }, role, error }) => {
        try {
            // Only admins can delete user ranks
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const targetUserId = parseInt(userId);
            const targetSeasonId = parseInt(seasonId);

            if (isNaN(targetUserId) || isNaN(targetSeasonId)) {
                return error(400, { message: "Invalid user ID or season ID" });
            }

            // Check if user rank exists
            const existingUserRank = await db.user_rank.findUnique({
                where: {
                    user_id_season_id: {
                        user_id: targetUserId,
                        season_id: targetSeasonId
                    }
                }
            });

            if (!existingUserRank) {
                return error(404, { message: "User rank not found" });
            }

            await db.user_rank.delete({
                where: {
                    user_id_season_id: {
                        user_id: targetUserId,
                        season_id: targetSeasonId
                    }
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default userRankController;