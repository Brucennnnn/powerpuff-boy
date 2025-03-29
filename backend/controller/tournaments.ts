import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const tournamentsController = new Elysia({ prefix: "/tournaments" })
    .use(authPlugin)
    .get("/", async ({ error }) => {
        try {
            const tournaments = await db.tournaments.findMany({
                orderBy: {
                    date: 'desc'
                }
            });

            return tournaments.map(tournament => ({
                id: tournament.id,
                name: tournament.name,
                game: tournament.game,
                date: tournament.date.toISOString(),
                organizer: tournament.organizer,
                prize_pool: tournament.prize_pool.toString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/:id", async ({ params: { id }, error }) => {
        try {
            const tournamentId = parseInt(id);

            if (isNaN(tournamentId)) {
                return error(400, { message: "Invalid tournament ID" });
            }

            const tournament = await db.tournaments.findUnique({
                where: {
                    id: tournamentId
                },
                include: {
                    tournament_results: {
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
                    }
                }
            });

            if (!tournament) {
                return error(404, { message: "Tournament not found" });
            }

            return {
                id: tournament.id,
                name: tournament.name,
                game: tournament.game,
                date: tournament.date.toISOString(),
                organizer: tournament.organizer,
                prize_pool: tournament.prize_pool.toString(),
                results: tournament.tournament_results.map(result => ({
                    id: result.id,
                    user_id: result.user_id,
                    username: result.user.username,
                    firstname: result.user.firstname,
                    lastname: result.user.lastname,
                    placement: result.placement,
                    team_name: result.team_name || undefined,
                    prize_earned: result.prize_earned.toString()
                }))
            };
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

            const { name, game, date, organizer, prize_pool } = body;

            const tournament = await db.tournaments.create({
                data: {
                    name,
                    game,
                    date: new Date(date),
                    organizer,
                    prize_pool
                }
            });

            return {
                id: tournament.id,
                name: tournament.name,
                game: tournament.game,
                date: tournament.date.toISOString(),
                organizer: tournament.organizer,
                prize_pool: tournament.prize_pool.toString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid tournament data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            name: t.String(),
            game: t.String(),
            date: t.String(),
            organizer: t.String(),
            prize_pool: t.Number()
        })
    })
    .put("/:id", async ({ params: { id }, body, role, error }) => {
        try {
            // Check if user is admin or instructor
            if (role !== UserRole.ADMIN && role !== UserRole.INSTRUCTOR) {
                return error(403, { message: "Forbidden: Admin or Instructor access required" });
            }

            const tournamentId = parseInt(id);

            if (isNaN(tournamentId)) {
                return error(400, { message: "Invalid tournament ID" });
            }

            const { name, game, date, organizer, prize_pool } = body;

            // Check if tournament exists
            const existingTournament = await db.tournaments.findUnique({
                where: {
                    id: tournamentId
                }
            });

            if (!existingTournament) {
                return error(404, { message: "Tournament not found" });
            }

            const tournament = await db.tournaments.update({
                where: {
                    id: tournamentId
                },
                data: {
                    name,
                    game,
                    date: new Date(date),
                    organizer,
                    prize_pool
                }
            });

            return {
                id: tournament.id,
                name: tournament.name,
                game: tournament.game,
                date: tournament.date.toISOString(),
                organizer: tournament.organizer,
                prize_pool: tournament.prize_pool.toString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid tournament data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            name: t.String(),
            game: t.String(),
            date: t.String(),
            organizer: t.String(),
            prize_pool: t.Number()
        })
    })
    .delete("/:id", async ({ params: { id }, role, error }) => {
        try {
            // Check if user is admin
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const tournamentId = parseInt(id);

            if (isNaN(tournamentId)) {
                return error(400, { message: "Invalid tournament ID" });
            }

            // Check if tournament exists
            const existingTournament = await db.tournaments.findUnique({
                where: {
                    id: tournamentId
                }
            });

            if (!existingTournament) {
                return error(404, { message: "Tournament not found" });
            }

            // Delete all tournament results first (to avoid foreign key constraints)
            await db.tournament_results.deleteMany({
                where: {
                    tournament_id: tournamentId
                }
            });

            // Then delete the tournament
            await db.tournaments.delete({
                where: {
                    id: tournamentId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default tournamentsController;