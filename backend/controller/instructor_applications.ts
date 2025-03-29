import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const instructorApplicationsController = new Elysia({ prefix: "/instructor-applications" })
  .use(authPlugin)
  .get("/my", async ({ userId, error }) => {
    try {
      const applications = await db.instructor_applications.findMany({
        where: {
          user_id: userId
        },
        orderBy: {
          applied_at: 'desc'
        }
      });
      
      return applications.map(application => ({
        id: application.id,
        application_text: application.application_text,
        experience: application.experience,
        status: application.status,
        applied_at: application.applied_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/", async ({ role, error }) => {
    try {
      // Check if user is an admin
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const applications = await db.instructor_applications.findMany({
        include: {
          user: {
            select: {
              username: true,
              firstname: true,
              lastname: true
            }
          }
        },
        orderBy: [
          {
            status: 'asc' // 'pending' comes before 'approved' and 'rejected'
          },
          {
            applied_at: 'desc'
          }
        ]
      });
      
      return applications.map(application => ({
        id: application.id,
        user_id: application.user_id,
        username: application.user.username,
        applicant_name: `${application.user.firstname} ${application.user.lastname}`,
        application_text: application.application_text,
        experience: application.experience,
        status: application.status,
        applied_at: application.applied_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, userId, error }) => {
    try {
      const { application_text, experience } = body;
      
      // Check if user already has a pending application
      const existingApplication = await db.instructor_applications.findFirst({
        where: {
          user_id: userId,
          status: 'pending'
        }
      });
      
      if (existingApplication) {
        return error(400, { message: "You already have a pending application" });
      }
      
      // Check if user is already an instructor
      const user = await db.users.findUnique({
        where: {
          id: userId
        }
      });
      
      if (!user) {
        return error(404, { message: "User not found" });
      }
      
      if (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) {
        return error(400, { message: "You are already an instructor or admin" });
      }
      
      const application = await db.instructor_applications.create({
        data: {
          user_id: userId,
          application_text,
          experience,
          status: 'pending',
          applied_at: new Date()
        }
      });
      
      return {
        id: application.id,
        application_text: application.application_text,
        experience: application.experience,
        status: application.status,
        applied_at: application.applied_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid application data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      application_text: t.String(),
      experience: t.String()
    })
  })
  .put("/:id/status", async ({ params: { id }, body, role, error }) => {
    try {
      // Check if user is an admin
      if (role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Admin access required" });
      }
      
      const applicationId = parseInt(id);
      
      if (isNaN(applicationId)) {
        return error(400, { message: "Invalid application ID" });
      }
      
      const { status } = body;
      
      // Validate status
      if (status !== 'approved' && status !== 'rejected') {
        return error(400, { message: "Status must be 'approved' or 'rejected'" });
      }
      
      // Check if application exists
      const existingApplication = await db.instructor_applications.findUnique({
        where: {
          id: applicationId
        }
      });
      
      if (!existingApplication) {
        return error(404, { message: "Application not found" });
      }
      
      // If approving the application, update the user's role to instructor
      if (status === 'approved') {
        await db.users.update({
          where: {
            id: existingApplication.user_id
          },
          data: {
            role: UserRole.INSTRUCTOR
          }
        });
      }
      
      const application = await db.instructor_applications.update({
        where: {
          id: applicationId
        },
        data: {
          status
        }
      });
      
      return {
        id: application.id,
        user_id: application.user_id,
        application_text: application.application_text,
        experience: application.experience,
        status: application.status,
        applied_at: application.applied_at.toISOString()
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      status: t.String()
    })
  })
  .delete("/:id", async ({ params: { id }, userId, role, error }) => {
    try {
      const applicationId = parseInt(id);
      
      if (isNaN(applicationId)) {
        return error(400, { message: "Invalid application ID" });
      }
      
      // Check if application exists
      const existingApplication = await db.instructor_applications.findUnique({
        where: {
          id: applicationId
        }
      });
      
      if (!existingApplication) {
        return error(404, { message: "Application not found" });
      }
      
      // Check if user owns the application or is an admin
      if (existingApplication.user_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only delete your own applications" });
      }
      
      await db.instructor_applications.delete({
        where: {
          id: applicationId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default instructorApplicationsController;