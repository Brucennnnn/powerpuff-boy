import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const userLevelController = new Elysia({ prefix: "/user-level" })
  .use(authPlugin)
  .get("/my", async ({ userId, error }) => {
    try {
      const userLevel = await db.user_level.findUnique({
        where: {
          user_id: userId
        },
        include: {
          level: true
        }
      });
      
      if (!userLevel) {
        // If user doesn't have a level yet, get the first level
        const firstLevel = await db.levels.findFirst({
          where: {
            level_number: 1
          }
        });
        
        if (!firstLevel) {
          return error(404, { message: "No levels defined in the system" });
        }
        
        // Create a user level entry
        const newUserLevel = await db.user_level.create({
          data: {
            user_id: userId,
            level_id: firstLevel.id,
            current_xp: 0
          },
          include: {
            level: true
          }
        });
        
        return {
          user_id: userId,
          level_number: newUserLevel.level.level_number,
          level_name: newUserLevel.level.name,
          current_xp: newUserLevel.current_xp,
          min_xp: newUserLevel.level.min_xp,
          max_xp: newUserLevel.level.max_xp,
          xp_to_next_level: newUserLevel.level.max_xp - newUserLevel.current_xp,
          progress_percentage: Math.round((newUserLevel.current_xp / newUserLevel.level.max_xp) * 100),
          updated_at: newUserLevel.updated_at.toISOString()
        };
      }
      
      // Calculate progress percentage and XP needed for next level
      const xpToNextLevel = userLevel.level.max_xp - userLevel.current_xp;
      const progressPercentage = Math.round((userLevel.current_xp / userLevel.level.max_xp) * 100);
      
      return {
        user_id: userId,
        level_number: userLevel.level.level_number,
        level_name: userLevel.level.name,
        current_xp: userLevel.current_xp,
        min_xp: userLevel.level.min_xp,
        max_xp: userLevel.level.max_xp,
        xp_to_next_level: xpToNextLevel,
        progress_percentage: progressPercentage,
        updated_at: userLevel.updated_at.toISOString()
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/user/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only instructors and admins can view other users' levels
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
      
      const userLevel = await db.user_level.findUnique({
        where: {
          user_id: targetUserId
        },
        include: {
          level: true
        }
      });
      
      if (!userLevel) {
        return {
          user: {
            id: targetUserId,
            username: user.username,
            name: `${user.firstname} ${user.lastname}`
          },
          level: {
            level_number: 0,
            level_name: "Not Started",
            current_xp: 0,
            progress_percentage: 0
          }
        };
      }
      
      // Calculate progress percentage and XP needed for next level
      const xpToNextLevel = userLevel.level.max_xp - userLevel.current_xp;
      const progressPercentage = Math.round((userLevel.current_xp / userLevel.level.max_xp) * 100);
      
      return {
        user: {
          id: targetUserId,
          username: user.username,
          name: `${user.firstname} ${user.lastname}`
        },
        level: {
          level_number: userLevel.level.level_number,
          level_name: userLevel.level.name,
          current_xp: userLevel.current_xp,
          min_xp: userLevel.level.min_xp,
          max_xp: userLevel.level.max_xp,
          xp_to_next_level: xpToNextLevel,
          progress_percentage: progressPercentage,
          updated_at: userLevel.updated_at.toISOString()
        }
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/add-xp", async ({ body, userId, role, error }) => {
    try {
      let targetUserId = userId;
      let xpAmount = body.xp;
      
      // If admin is granting XP to another user
      if (role === UserRole.ADMIN && body.user_id) {
        targetUserId = body.user_id;
      }
      
      // Validate XP amount
      if (xpAmount <= 0) {
        return error(400, { message: "XP amount must be greater than 0" });
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
      
      // Get user's current level
      let userLevel = await db.user_level.findUnique({
        where: {
          user_id: targetUserId
        },
        include: {
          level: true
        }
      });
      
      // If user doesn't have a level yet, assign the first level
      if (!userLevel) {
        const firstLevel = await db.levels.findFirst({
          where: {
            level_number: 1
          }
        });
        
        if (!firstLevel) {
          return error(404, { message: "No levels defined in the system" });
        }
        
        userLevel = await db.user_level.create({
          data: {
            user_id: targetUserId,
            level_id: firstLevel.id,
            current_xp: 0
          },
          include: {
            level: true
          }
        });
      }
      
      // Calculate new XP
      let newXP = userLevel.current_xp + xpAmount;
      let currentLevelId = userLevel.level_id;
      let didLevelUp = false;
      let newLevel = null;
      
      // Check if user should level up
      if (newXP >= userLevel.level.max_xp) {
        // Find the next level
        newLevel = await db.levels.findFirst({
          where: {
            level_number: userLevel.level.level_number + 1
          }
        });
        
        if (newLevel) {
          // Update to next level
          currentLevelId = newLevel.id;
          newXP = newXP - userLevel.level.max_xp; // Carry over excess XP
          didLevelUp = true;
        }
      }
      
      // Update user level
      const updatedUserLevel = await db.user_level.update({
        where: {
          user_id: targetUserId
        },
        data: {
          level_id: currentLevelId,
          current_xp: newXP
        },
        include: {
          level: true
        }
      });
      
      // Calculate progress for the response
      const xpToNextLevel = updatedUserLevel.level.max_xp - updatedUserLevel.current_xp;
      const progressPercentage = Math.round((updatedUserLevel.current_xp / updatedUserLevel.level.max_xp) * 100);
      
      return {
        user_id: targetUserId,
        level_number: updatedUserLevel.level.level_number,
        level_name: updatedUserLevel.level.name,
        current_xp: updatedUserLevel.current_xp,
        xp_added: xpAmount,
        min_xp: updatedUserLevel.level.min_xp,
        max_xp: updatedUserLevel.level.max_xp,
        xp_to_next_level: xpToNextLevel,
        progress_percentage: progressPercentage,
        level_up: didLevelUp,
        previous_level: didLevelUp ? userLevel.level.level_number : null,
        updated_at: updatedUserLevel.updated_at.toISOString()
      };
    } catch (err) {
      console.error(err);
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      xp: t.Number(),
      user_id: t.Optional(t.Number()) // Optional, only used by admins
    })
  })
  .put("/", async ({ body, role, error }) => {
    try {
      // Only admins can directly set user levels
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { user_id, level_id, current_xp } = body;
      
      // Check if user exists
      const user = await db.users.findUnique({
        where: {
          id: user_id
        }
      });
      
      if (!user) {
        return error(404, { message: "User not found" });
      }
      
      // Check if level exists
      const level = await db.levels.findUnique({
        where: {
          id: level_id
        }
      });
      
      if (!level) {
        return error(404, { message: "Level not found" });
      }
      
      // Validate current_xp is within level range
      if (current_xp < level.min_xp || current_xp > level.max_xp) {
        return error(400, { 
          message: `XP must be between ${level.min_xp} and ${level.max_xp} for this level` 
        });
      }
      
      // Check if user level exists
      const existingUserLevel = await db.user_level.findUnique({
        where: {
          user_id
        }
      });
      
      let userLevel;
      
      if (existingUserLevel) {
        // Update existing user level
        userLevel = await db.user_level.update({
          where: {
            user_id
          },
          data: {
            level_id,
            current_xp
          },
          include: {
            level: true
          }
        });
      } else {
        // Create new user level
        userLevel = await db.user_level.create({
          data: {
            user_id,
            level_id,
            current_xp
          },
          include: {
            level: true
          }
        });
      }
      
      // Calculate progress for the response
      const xpToNextLevel = userLevel.level.max_xp - userLevel.current_xp;
      const progressPercentage = Math.round((userLevel.current_xp / userLevel.level.max_xp) * 100);
      
      return {
        user_id,
        level_number: userLevel.level.level_number,
        level_name: userLevel.level.name,
        current_xp: userLevel.current_xp,
        min_xp: userLevel.level.min_xp,
        max_xp: userLevel.level.max_xp,
        xp_to_next_level: xpToNextLevel,
        progress_percentage: progressPercentage,
        updated_at: userLevel.updated_at.toISOString()
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      user_id: t.Number(),
      level_id: t.Number(),
      current_xp: t.Number()
    })
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete user levels
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const userId = parseInt(id);
      
      if (isNaN(userId)) {
        return error(400, { message: "Invalid user ID" });
      }
      
      // Check if user level exists
      const existingUserLevel = await db.user_level.findUnique({
        where: {
          user_id: userId
        }
      });
      
      if (!existingUserLevel) {
        return error(404, { message: "User level not found" });
      }
      
      await db.user_level.delete({
        where: {
          user_id: userId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default userLevelController;