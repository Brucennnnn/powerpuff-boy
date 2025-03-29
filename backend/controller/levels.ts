import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const levelsController = new Elysia({ prefix: "/levels" })
  .use(authPlugin)
  .get("/", async ({ error }) => {
    try {
      const levels = await db.levels.findMany({
        orderBy: {
          level_number: 'asc'
        }
      });
      
      return levels.map(level => ({
        id: level.id,
        level_number: level.level_number,
        name: level.name,
        min_xp: level.min_xp,
        max_xp: level.max_xp,
        rewards: level.rewards
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/:id", async ({ params: { id }, error }) => {
    try {
      const levelId = parseInt(id);
      
      if (isNaN(levelId)) {
        return error(400, { message: "Invalid level ID" });
      }
      
      const level = await db.levels.findUnique({
        where: {
          id: levelId
        }
      });
      
      if (!level) {
        return error(404, { message: "Level not found" });
      }
      
      return {
        id: level.id,
        level_number: level.level_number,
        name: level.name,
        min_xp: level.min_xp,
        max_xp: level.max_xp,
        rewards: level.rewards
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, role, error }) => {
    try {
      // Only admins can create levels
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { level_number, name, min_xp, max_xp, rewards } = body;
      
      // Check if level_number or XP ranges overlap with existing levels
      const existingLevel = await db.levels.findFirst({
        where: {
          OR: [
            { level_number },
            {
              OR: [
                {
                  min_xp: {
                    lte: max_xp,
                    gte: min_xp
                  }
                },
                {
                  max_xp: {
                    lte: max_xp,
                    gte: min_xp
                  }
                }
              ]
            }
          ]
        }
      });
      
      if (existingLevel) {
        return error(400, { 
          message: "Level number or XP range overlaps with an existing level" 
        });
      }
      
      const level = await db.levels.create({
        data: {
          level_number,
          name,
          min_xp,
          max_xp,
          rewards
        }
      });
      
      return {
        id: level.id,
        level_number: level.level_number,
        name: level.name,
        min_xp: level.min_xp,
        max_xp: level.max_xp,
        rewards: level.rewards
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid level data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      level_number: t.Number(),
      name: t.String(),
      min_xp: t.Number(),
      max_xp: t.Number(),
      rewards: t.Optional(t.String())
    })
  })
  .put("/:id", async ({ params: { id }, body, role, error }) => {
    try {
      // Only admins can update levels
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const levelId = parseInt(id);
      
      if (isNaN(levelId)) {
        return error(400, { message: "Invalid level ID" });
      }
      
      // Check if level exists
      const existingLevel = await db.levels.findUnique({
        where: {
          id: levelId
        }
      });
      
      if (!existingLevel) {
        return error(404, { message: "Level not found" });
      }
      
      const { level_number, name, min_xp, max_xp, rewards } = body;
      
      // Check if level_number or XP ranges overlap with other existing levels
      const overlappingLevel = await db.levels.findFirst({
        where: {
          id: {
            not: levelId
          },
          OR: [
            { level_number },
            {
              OR: [
                {
                  min_xp: {
                    lte: max_xp,
                    gte: min_xp
                  }
                },
                {
                  max_xp: {
                    lte: max_xp,
                    gte: min_xp
                  }
                }
              ]
            }
          ]
        }
      });
      
      if (overlappingLevel) {
        return error(400, { 
          message: "Level number or XP range overlaps with another level" 
        });
      }
      
      const level = await db.levels.update({
        where: {
          id: levelId
        },
        data: {
          level_number,
          name,
          min_xp,
          max_xp,
          rewards
        }
      });
      
      return {
        id: level.id,
        level_number: level.level_number,
        name: level.name,
        min_xp: level.min_xp,
        max_xp: level.max_xp,
        rewards: level.rewards
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid level data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      level_number: t.Number(),
      name: t.String(),
      min_xp: t.Number(),
      max_xp: t.Number(),
      rewards: t.Optional(t.String())
    })
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete levels
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const levelId = parseInt(id);
      
      if (isNaN(levelId)) {
        return error(400, { message: "Invalid level ID" });
      }
      
      // Check if level exists
      const existingLevel = await db.levels.findUnique({
        where: {
          id: levelId
        }
      });
      
      if (!existingLevel) {
        return error(404, { message: "Level not found" });
      }
      
      // Check if any users are at this level
      const usersAtLevel = await db.user_level.findFirst({
        where: {
          level_id: levelId
        }
      });
      
      if (usersAtLevel) {
        return error(400, { 
          message: "Cannot delete level: Users are currently at this level" 
        });
      }
      
      await db.levels.delete({
        where: {
          id: levelId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default levelsController;