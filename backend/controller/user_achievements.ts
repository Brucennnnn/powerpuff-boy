import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const userAchievementsController = new Elysia({ prefix: "/user-achievements" })
  .use(authPlugin)
  .get("/my", async ({ userId, error }) => {
    try {
      const userAchievements = await db.user_achievements.findMany({
        where: {
          user_id: userId
        },
        include: {
          achievement: true
        },
        orderBy: {
          unlocked_at: 'desc'
        }
      });
      
      return userAchievements.map(userAchievement => ({
        id: userAchievement.id,
        achievement_id: userAchievement.achievement_id,
        name: userAchievement.achievement.name,
        description: userAchievement.achievement.description,
        icon_url: userAchievement.achievement.icon_url,
        points: userAchievement.achievement.points,
        xp: userAchievement.achievement.xp,
        unlocked_at: userAchievement.unlocked_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/user/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only instructors and admins can view other users' achievements
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
      
      const userAchievements = await db.user_achievements.findMany({
        where: {
          user_id: targetUserId
        },
        include: {
          achievement: true
        },
        orderBy: {
          unlocked_at: 'desc'
        }
      });
      
      return {
        user: {
          id: targetUserId,
          username: user.username,
          name: `${user.firstname} ${user.lastname}`
        },
        achievements: userAchievements.map(userAchievement => ({
          id: userAchievement.id,
          achievement_id: userAchievement.achievement_id,
          name: userAchievement.achievement.name,
          description: userAchievement.achievement.description,
          icon_url: userAchievement.achievement.icon_url,
          points: userAchievement.achievement.points,
          xp: userAchievement.achievement.xp,
          unlocked_at: userAchievement.unlocked_at.toISOString()
        }))
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/unlock", async ({ body, userId, role, error }) => {
    try {
      // Only admins can manually unlock achievements
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const { user_id, achievement_id } = body;
      
      // Check if user exists
      const user = await db.users.findUnique({
        where: {
          id: user_id
        }
      });
      
      if (!user) {
        return error(404, { message: "User not found" });
      }
      
      // Check if achievement exists
      const achievement = await db.achievements.findUnique({
        where: {
          id: achievement_id
        }
      });
      
      if (!achievement) {
        return error(404, { message: "Achievement not found" });
      }
      
      // Check if user has already unlocked this achievement
      const existingUserAchievement = await db.user_achievements.findUnique({
        where: {
          user_id_achievement_id: {
            user_id,
            achievement_id
          }
        }
      });
      
      if (existingUserAchievement) {
        return error(400, { message: "User has already unlocked this achievement" });
      }
      
      // Unlock the achievement
      const userAchievement = await db.user_achievements.create({
        data: {
          user_id,
          achievement_id,
          unlocked_at: new Date()
        }
      });
      
      // Update user level with earned XP
      await updateUserXP(user_id, achievement.xp);
      
      return {
        id: userAchievement.id,
        user_id: userAchievement.user_id,
        achievement_id: userAchievement.achievement_id,
        unlocked_at: userAchievement.unlocked_at.toISOString(),
        message: `Achievement unlocked for user ${user.username}. ${achievement.xp} XP earned.`
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid achievement data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      user_id: t.Number(),
      achievement_id: t.Number()
    })
  })
  .post("/check-criteria", async ({ userId, error }) => {
    try {
      // Get all achievements
      const achievements = await db.achievements.findMany();
      
      // Get user's currently unlocked achievements
      const userAchievements = await db.user_achievements.findMany({
        where: {
          user_id: userId
        }
      });
      
      const unlockedAchievementIds = userAchievements.map(ua => ua.achievement_id);
      
      // Get achievements that haven't been unlocked yet
      const lockedAchievements = achievements.filter(
        achievement => !unlockedAchievementIds.includes(achievement.id)
      );
      
      // Check each locked achievement to see if criteria are met
      const newlyUnlockedAchievements = [];
      
      for (const achievement of lockedAchievements) {
        // Parse the criteria (in a real app, this would have actual logic)
        // For now, we'll use a simple check based on the criteria string
        const criteria = JSON.parse(achievement.criteria);
        
        let criteriaFulfilled = false;
        
        if (criteria.type === 'courses_completed') {
          // Check number of completed courses
          const completedCourses = await db.enrollments.count({
            where: {
              user_id: userId,
              completed: true
            }
          });
          
          if (completedCourses >= criteria.count) {
            criteriaFulfilled = true;
          }
        } else if (criteria.type === 'challenges_completed') {
          // Check number of completed challenges
          const completedChallenges = await db.user_challenges.count({
            where: {
              user_id: userId,
              completed: true
            }
          });
          
          if (completedChallenges >= criteria.count) {
            criteriaFulfilled = true;
          }
        } else if (criteria.type === 'level_reached') {
          // Check user level
          const userLevel = await db.user_level.findUnique({
            where: {
              user_id: userId
            },
            include: {
              level: true
            }
          });
          
          if (userLevel && userLevel.level.level_number >= criteria.level) {
            criteriaFulfilled = true;
          }
        }
        
        // If criteria fulfilled, unlock the achievement
        if (criteriaFulfilled) {
          const userAchievement = await db.user_achievements.create({
            data: {
              user_id: userId,
              achievement_id: achievement.id,
              unlocked_at: new Date()
            }
          });
          
          // Update user level with earned XP
          await updateUserXP(userId, achievement.xp);
          
          newlyUnlockedAchievements.push({
            id: userAchievement.id,
            achievement_id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon_url: achievement.icon_url,
            points: achievement.points,
            xp: achievement.xp,
            unlocked_at: userAchievement.unlocked_at.toISOString()
          });
        }
      }
      
      return {
        unlockedCount: newlyUnlockedAchievements.length,
        newlyUnlocked: newlyUnlockedAchievements
      };
    } catch (err) {
      console.error(err);
      return error(500, { message: "Internal Server Error" });
    }
  })
  .delete("/:id", async ({ params: { id }, role, error }) => {
    try {
      // Only admins can delete user achievements
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const userAchievementId = parseInt(id);
      
      if (isNaN(userAchievementId)) {
        return error(400, { message: "Invalid user achievement ID" });
      }
      
      // Check if user achievement exists
      const existingUserAchievement = await db.user_achievements.findUnique({
        where: {
          id: userAchievementId
        },
        include: {
          achievement: true
        }
      });
      
      if (!existingUserAchievement) {
        return error(404, { message: "User achievement not found" });
      }
      
      // Delete the user achievement
      await db.user_achievements.delete({
        where: {
          id: userAchievementId
        }
      });
      
      // Subtract XP from user's level (if possible)
      const user = await db.user_level.findUnique({
        where: {
          user_id: existingUserAchievement.user_id
        }
      });
      
      if (user) {
        // Only subtract XP if it wouldn't make the XP negative
        const newXP = Math.max(0, user.current_xp - existingUserAchievement.achievement.xp);
        
        await db.user_level.update({
          where: {
            user_id: existingUserAchievement.user_id
          },
          data: {
            current_xp: newXP
          }
        });
      }
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

// Helper function to update user XP and level
async function updateUserXP(userId: number, xpAmount: number) {
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
    const newXP = userLevel.current_xp + xpAmount;
    
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
          current_xp: xpAmount
        }
      });
    }
  }
}

export default userAchievementsController;