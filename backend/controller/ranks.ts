import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const ranksController = new Elysia({ prefix: "/ranks" })
  .use(authPlugin)
  .get("/", async ({ error }) => {
    try {
      const ranks = await db.ranks.findMany({
        include: {
          season: true
        },
        orderBy: [
          {
            season: {
              is_active: 'desc'
            }
          },
          {
            min_points: 'asc'
          }
        ]
      });
      
      return ranks.map(rank => ({
        id: rank.id,
        name: rank.name,
        min_points: rank.min_points,
        season_id: rank.season_id,
        season_name: rank.season.name,
        season_is_active: rank.season.is_active
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/season/:id", async ({ params: { id }, error }) => {
    try {
      const seasonId = parseInt(id);
      
      if (isNaN(seasonId)) {
        return error(400, { message: "Invalid season ID" });
      }
      
      // Check if season exists
      const season = await db.rank_seasons.findUnique({
        where: {
          id: seasonId
        }
      });
      
      if (!season) {
        return error(404, { message: "Season not found" });
      }
      
      const ranks = await db.ranks.findMany({
        where: {
          season_id: seasonId
        },
        orderBy: {
          min_points: 'asc'
        }
      });
      
      return {
        season: {
          id: season.id,
          name: season.name,
          is_active: season.is_active
        },
        ranks: ranks.map(rank => ({
          id: rank.id,
          name: rank.name,
          min_points: rank.min_points
        }))
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/active", async ({ error }) => {
    try {
      const activeSeason = await db.rank_seasons.findFirst({
        where: {
          is_active: true
        }
      });
      
      if (!activeSeason) {
        return error(404, { message: "No active rank season found" });
      }
      
      const ranks = await db.ranks.findMany({
        where: {
          season_id: activeSeason.id
        },
        orderBy: {
          min_points: 'asc'
        }
      });
      
      return {
        season: {
          id: activeSeason.id,
          name: activeSeason.name
        },
        ranks: ranks.map(rank => ({
          id: rank.id,
          name: rank.name,
          min_points: rank.min_points
        }))
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, role, error }) => {
    try {
      // Only admins can create ranks
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { name, min_points, season_id } = body;
      
      // Check if season exists
      const season = await db.rank_seasons.findUnique({
        where: {
          id: season_id
        }
      });
      
      if (!season) {
        return error(404, { message: "Season not found" });
      }
      
      // Check if rank with same min_points already exists for this season
      const existingRankWithPoints = await db.ranks.findFirst({
        where: {
          season_id,
          min_points
        }
      });
      
      if (existingRankWithPoints) {
        return error(400, { 
          message: "A rank with these minimum points already exists for this season" 
        });
      }
      
      // Check if rank with same name already exists for this season
      const existingRankWithName = await db.ranks.findFirst({
        where: {
          season_id,
          name
        }
      });
      
      if (existingRankWithName) {
        return error(400, { 
          message: "A rank with this name already exists for this season" 
        });
      }
      
      const rank = await db.ranks.create({
        data: {
          name,
          min_points,
          season_id
        }
      });
      
      return {
        id: rank.id,
        name: rank.name,
        min_points: rank.min_points,
        season_id: rank.season_id
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid rank data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      min_points: t.Number(),
      season_id: t.Number()
    })
  })
  .put("/:id", async ({ params: { id }, body, role, error }) => {
    try {
      // Only admins can update ranks
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const rankId = parseInt(id);
      
      if (isNaN(rankId)) {
        return error(400, { message: "Invalid rank ID" });
      }
      
      // Check if rank exists
      const existingRank = await db.ranks.findUnique({
        where: {
          id: rankId
        }
      });
      
      if (!existingRank) {
        return error(404, { message: "Rank not found" });
      }
      
      const { name, min_points } = body;
      
      // Check if rank with same min_points already exists for this season (excluding this one)
      const existingRankWithPoints = await db.ranks.findFirst({
        where: {
          id: {
            not: rankId
          },
          season_id: existingRank.season_id,
          min_points
        }
      });
      
      if (existingRankWithPoints) {
        return error(400, { 
          message: "Another rank with these minimum points already exists for this season" 
        });
      }
      
      // Check if rank with same name already exists for this season (excluding this one)
      const existingRankWithName = await db.ranks.findFirst({
        where: {
          id: {
            not: rankId
          },
          season_id: existingRank.season_id,
          name
        }
      });
      
      if (existingRankWithName) {
        return error(400, { 
          message: "Another rank with this name already exists for this season" 
        });
      }
      
      const rank = await db.ranks.update({
        where: {
          id: rankId
        },
        data: {
          name,
          min_points
        }
      });
      
      return {
        id: rank.id,
        name: rank.name,
        min_points: rank.min_points,
        season_id: rank.season_id
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid rank data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      min_points: t.Number()
    })
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete ranks
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const rankId = parseInt(id);
      
      if (isNaN(rankId)) {
        return error(400, { message: "Invalid rank ID" });
      }
      
      // Check if rank exists
      const existingRank = await db.ranks.findUnique({
        where: {
          id: rankId
        }
      });
      
      if (!existingRank) {
        return error(404, { message: "Rank not found" });
      }
      
      // Check if any users are using this rank
      const userRanksCount = await db.user_rank.count({
        where: {
          rank_id: rankId
        }
      });
      
      if (userRanksCount > 0) {
        return error(400, { 
          message: "Cannot delete rank: Users are currently assigned to this rank" 
        });
      }
      
      await db.ranks.delete({
        where: {
          id: rankId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default ranksController;