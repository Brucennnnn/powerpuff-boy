import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const tournamentResultsController = new Elysia({ prefix: "/tournament-results" })
    .use(authPlugin)
    .get("/my-results", async ({ userId, error }) => {
        try {
            const results = await db.tournament_results.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    tournament: true
                },
                orderBy: {
                    tournament: {
                        date: 'desc'
                    }
                }
            });

            return results.map(result => ({
                id: result.id,
                tournament_id: result.tournament_id,
                tournament_name: result.tournament.name,
                tournament_date: result.tournament.date.toISOString(),
                game: result.tournament.game,
                placement: result.placement,
                team_name: result.team_name || undefined,
                prize_earned: result.prize_earned.toString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/tournament/:id", async ({ params: { id }, error }) => {
        try {
            const tournamentId = parseInt(id);

            if (isNaN(tournamentId)) {
                return error(400, { message: "Invalid tournament ID" });
            }

            const results = await db.tournament_results.findMany({
                where: {
                    tournament_id: tournamentId
                },
                include: {
                    user: {
                        select: {
                            username: true,
                            firstname: true,
                            lastname: true
                        }
                    }
                },
                orderBy: {
                    placement: 'asc'
                }
            });

            return results.map(result => ({
                id: result.id,
                user_id: result.user_id,
                username: result.user.username,
                firstname: result.user.firstname,
                lastname: result.user.lastname,
                placement: result.placement,
                team_name: result.team_name || undefined,
                prize_earned: result.prize_earned.toString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/", async ({ body, role, error }) => {
        try {
            // Check if user is admin or instructor
            if (role !== UserRole.ADMIN && role !== UserRole.INSTRUCTOR) {
                return error(403, { message: "Forbidden: Admin or Instructor access required" });
            }

            const { user_id, tournament_id, placement, team_name, prize_earned } = body;

            // Check if user exists
            const user = await db.users.findUnique({
                where: {
                    id: user_id
                }
            });

            if (!user) {
                return error(404, { message: "User not found" });
            }

            // Check if tournament exists
            const tournament = await db.tournaments.findUnique({
                where: {
                    id: tournament_id
                }
            });

            if (!tournament) {
                return error(404, { message: "Tournament not found" });
            }

            // Check if result already exists
            const existingResult = await db.tournament_results.findFirst({
                where: {
                    user_id,
                    tournament_id
                }
            });

            if (existingResult) {
                return error(400, { message: "Result already exists for this user in this tournament" });
            }

            const result = await db.tournament_results.create({
                data: {
                    user_id,
                    tournament_id,
                    placement,
                    team_name,
                    prize_earned
                }
            });

            return {
                id: result.id,
                user_id: result.user_id,
                tournament_id: result.tournament_id,
                placement: result.placement,
                team_name: result.team_name || undefined,
                prize_earned: result.prize_earned.toString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid tournament result data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            user_id: t.Number(),
            tournament_id: t.Number(),
            placement: t.Number(),
            team_name: t.Optional(t.String()),
            prize_earned: t.Number()
        })
    })
    .put("/:id", async ({ params: { id }, body, role, error }) => {
        try {
            // Check if user is admin or instructor
            if (role !== UserRole.ADMIN && role !== UserRole.INSTRUCTOR) {
                return error(403, { message: "Forbidden: Admin or Instructor access required" });
            }

            const resultId = parseInt(id);

            if (isNaN(resultId)) {
                return error(400, { message: "Invalid result ID" });
            }

            const { placement, team_name, prize_earned } = body;

            // Check if result exists
            const existingResult = await db.tournament_results.findUnique({
                where: {
                    id: resultId
                }
            });

            if (!existingResult) {
                return error(404, { message: "Tournament result not found" });
            }

            const result = await db.tournament_results.update({
                where: {
                    id: resultId
                },
                data: {
                    placement,
                    team_name,
                    prize_earned
                }
            });

            return {
                id: result.id,
                user_id: result.user_id,
                tournament_id: result.tournament_id,
                placement: result.placement,
                team_name: result.team_name || undefined,
                prize_earned: result.prize_earned.toString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid tournament result data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            placement: t.Number(),
            team_name: t.Optional(t.String()),
            prize_earned: t.Number()
        })
    })
    .delete("/:id", async ({ params: { id }, role, error }) => {
        try {
            // Check if user is admin
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const resultId = parseInt(id);

            if (isNaN(resultId)) {
                return error(400, { message: "Invalid result ID" });
            }

            // Check if result exists
            const existingResult = await db.tournament_results.findUnique({
                where: {
                    id: resultId
                }
            });

            if (!existingResult) {
                return error(404, { message: "Tournament result not found" });
            }

            await db.tournament_results.delete({
                where: {
                    id: resultId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default tournamentResultsController;