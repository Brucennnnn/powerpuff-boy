import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const rankSeasonsController = new Elysia({ prefix: "/rank-seasons" })
  .use(authPlugin)
  .get("/", async ({ error }) => {
    try {
      const seasons = await db.rank_seasons.findMany({
        orderBy: {
          start_date: 'desc'
        }
      });
      
      return seasons.map(season => ({
        id: season.id,
        name: season.name,
        start_date: season.start_date.toISOString(),
        end_date: season.end_date.toISOString(),
        is_active: season.is_active
      }));
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
      
      return {
        id: activeSeason.id,
        name: activeSeason.name,
        start_date: activeSeason.start_date.toISOString(),
        end_date: activeSeason.end_date.toISOString(),
        is_active: activeSeason.is_active
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/:id", async ({ params: { id }, error }) => {
    try {
      const seasonId = parseInt(id);
      
      if (isNaN(seasonId)) {
        return error(400, { message: "Invalid season ID" });
      }
      
      const season = await db.rank_seasons.findUnique({
        where: {
          id: seasonId
        }
      });
      
      if (!season) {
        return error(404, { message: "Season not found" });
      }
      
      return {
        id: season.id,
        name: season.name,
        start_date: season.start_date.toISOString(),
        end_date: season.end_date.toISOString(),
        is_active: season.is_active
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, role, error }) => {
    try {
      // Only admins can create seasons
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { name, start_date, end_date, is_active } = body;
      
      // Check date validity
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        return error(400, { message: "End date must be after start date" });
      }
      
      // If setting this season as active, deactivate all other seasons
      if (is_active) {
        await db.rank_seasons.updateMany({
          data: {
            is_active: false
          }
        });
      }
      
      const season = await db.rank_seasons.create({
        data: {
          name,
          start_date: startDate,
          end_date: endDate,
          is_active
        }
      });
      
      return {
        id: season.id,
        name: season.name,
        start_date: season.start_date.toISOString(),
        end_date: season.end_date.toISOString(),
        is_active: season.is_active
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid season data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      start_date: t.String(),
      end_date: t.String(),
      is_active: t.Boolean()
    })
  })
  .put("/:id", async ({ params: { id }, body, role, error }) => {
    try {
      // Only admins can update seasons
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const seasonId = parseInt(id);
      
      if (isNaN(seasonId)) {
        return error(400, { message: "Invalid season ID" });
      }
      
      // Check if season exists
      const existingSeason = await db.rank_seasons.findUnique({
        where: {
          id: seasonId
        }
      });
      
      if (!existingSeason) {
        return error(404, { message: "Season not found" });
      }
      
      const { name, start_date, end_date, is_active } = body;
      
      // Check date validity
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        return error(400, { message: "End date must be after start date" });
      }
      
      // If setting this season as active, deactivate all other seasons
      if (is_active && !existingSeason.is_active) {
        await db.rank_seasons.updateMany({
          where: {
            id: {
              not: seasonId
            }
          },
          data: {
            is_active: false
          }
        });
      }
      
      const season = await db.rank_seasons.update({
        where: {
          id: seasonId
        },
        data: {
          name,
          start_date: startDate,
          end_date: endDate,
          is_active
        }
      });
      
      return {
        id: season.id,
        name: season.name,
        start_date: season.start_date.toISOString(),
        end_date: season.end_date.toISOString(),
        is_active: season.is_active
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid season data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      start_date: t.String(),
      end_date: t.String(),
      is_active: t.Boolean()
    })
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete seasons
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const seasonId = parseInt(id);
      
      if (isNaN(seasonId)) {
        return error(400, { message: "Invalid season ID" });
      }
      
      // Check if season exists
      const existingSeason = await db.rank_seasons.findUnique({
        where: {
          id: seasonId
        }
      });
      
      if (!existingSeason) {
        return error(404, { message: "Season not found" });
      }
      
      // Check if ranks are associated with this season
      const ranksCount = await db.ranks.count({
        where: {
          season_id: seasonId
        }
      });
      
      if (ranksCount > 0) {
        return error(400, { 
          message: "Cannot delete season: Ranks are associated with this season" 
        });
      }
      
      // Check if user ranks are associated with this season
      const userRanksCount = await db.user_rank.count({
        where: {
          season_id: seasonId
        }
      });
      
      if (userRanksCount > 0) {
        return error(400, { 
          message: "Cannot delete season: User ranks are associated with this season" 
        });
      }
      
      await db.rank_seasons.delete({
        where: {
          id: seasonId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default rankSeasonsController;