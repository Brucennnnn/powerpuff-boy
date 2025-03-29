import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const achievementsController = new Elysia({ prefix: "/achievements" })
  .use(authPlugin)
  .get("/", async ({ error }) => {
    try {
      const achievements = await db.achievements.findMany({
        orderBy: {
          points: 'desc'
        }
      });
      
      return achievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon_url: achievement.icon_url,
        points: achievement.points,
        xp: achievement.xp,
        criteria: achievement.criteria,
        created_at: achievement.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/:id", async ({ params: { id }, error }) => {
    try {
      const achievementId = parseInt(id);
      
      if (isNaN(achievementId)) {
        return error(400, { message: "Invalid achievement ID" });
      }
      
      const achievement = await db.achievements.findUnique({
        where: {
          id: achievementId
        }
      });
      
      if (!achievement) {
        return error(404, { message: "Achievement not found" });
      }
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon_url: achievement.icon_url,
        points: achievement.points,
        xp: achievement.xp,
        criteria: achievement.criteria,
        created_at: achievement.created_at.toISOString()
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, role, error }) => {
    try {
      // Only admins can create achievements
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { name, description, icon_url, points, xp, criteria } = body;
      
      const achievement = await db.achievements.create({
        data: {
          name,
          description,
          icon_url,
          points,
          xp,
          criteria,
          created_at: new Date()
        }
      });
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon_url: achievement.icon_url,
        points: achievement.points,
        xp: achievement.xp,
        criteria: achievement.criteria,
        created_at: achievement.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid achievement data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
      icon_url: t.String(),
      points: t.Number(),
      xp: t.Number(),
      criteria: t.String()
    })
  })
  .put("/:id", async ({ params: { id }, body, role, error }) => {
    try {
      // Only admins can update achievements
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const achievementId = parseInt(id);
      
      if (isNaN(achievementId)) {
        return error(400, { message: "Invalid achievement ID" });
      }
      
      // Check if achievement exists
      const existingAchievement = await db.achievements.findUnique({
        where: {
          id: achievementId
        }
      });
      
      if (!existingAchievement) {
        return error(404, { message: "Achievement not found" });
      }
      
      const { name, description, icon_url, points, xp, criteria } = body;
      
      const achievement = await db.achievements.update({
        where: {
          id: achievementId
        },
        data: {
          name,
          description,
          icon_url,
          points,
          xp,
          criteria
        }
      });
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon_url: achievement.icon_url,
        points: achievement.points,
        xp: achievement.xp,
        criteria: achievement.criteria,
        created_at: achievement.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid achievement data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
      icon_url: t.String(),
      points: t.Number(),
      xp: t.Number(),
      criteria: t.String()
    })
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete achievements
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const achievementId = parseInt(id);
      
      if (isNaN(achievementId)) {
        return error(400, { message: "Invalid achievement ID" });
      }
      
      // Check if achievement exists
      const existingAchievement = await db.achievements.findUnique({
        where: {
          id: achievementId
        }
      });
      
      if (!existingAchievement) {
        return error(404, { message: "Achievement not found" });
      }
      
      // Delete user achievements first
      await db.user_achievements.deleteMany({
        where: {
          achievement_id: achievementId
        }
      });
      
      // Then delete the achievement
      await db.achievements.delete({
        where: {
          id: achievementId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default achievementsController;