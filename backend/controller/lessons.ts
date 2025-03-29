import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const lessonsController = new Elysia({ prefix: "/lessons" })
  .use(authPlugin)
  .get("/course/:id", async ({ params: { id }, error }) => {
    try {
      const courseId = parseInt(id);
      
      if (isNaN(courseId)) {
        return error(400, { message: "Invalid course ID" });
      }
      
      const lessons = await db.lessons.findMany({
        where: {
          course_id: courseId
        },
        orderBy: {
          order_number: 'asc'
        }
      });
      
      return lessons.map(lesson => ({
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content,
        order_number: lesson.order_number,
        created_at: lesson.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/:id", async ({ params: { id }, error }) => {
    try {
      const lessonId = parseInt(id);
      
      if (isNaN(lessonId)) {
        return error(400, { message: "Invalid lesson ID" });
      }
      
      const lesson = await db.lessons.findUnique({
        where: {
          id: lessonId
        },
        include: {
          course: {
            select: {
              title: true,
              instructor_id: true
            }
          }
        }
      });
      
      if (!lesson) {
        return error(404, { message: "Lesson not found" });
      }
      
      return {
        id: lesson.id,
        course_id: lesson.course_id,
        course_title: lesson.course.title,
        title: lesson.title,
        content: lesson.content,
        order_number: lesson.order_number,
        created_at: lesson.created_at.toISOString()
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, userId, role, error }) => {
    try {
      const { course_id, title, content, order_number } = body;
      
      // Check if course exists
      const course = await db.courses.findUnique({
        where: {
          id: course_id
        }
      });
      
      if (!course) {
        return error(404, { message: "Course not found" });
      }
      
      // Check if user is the course instructor or an admin
      if (course.instructor_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only add lessons to your own courses" });
      }
      
      const lesson = await db.lessons.create({
        data: {
          course_id,
          title,
          content,
          order_number,
          created_at: new Date()
        }
      });
      
      return {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content,
        order_number: lesson.order_number,
        created_at: lesson.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid lesson data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      course_id: t.Number(),
      title: t.String(),
      content: t.String(),
      order_number: t.Number()
    })
  })
  .put("/:id", async ({ params: { id }, body, userId, role, error }) => {
    try {
      const lessonId = parseInt(id);
      
      if (isNaN(lessonId)) {
        return error(400, { message: "Invalid lesson ID" });
      }
      
      // Check if lesson exists
      const existingLesson = await db.lessons.findUnique({
        where: {
          id: lessonId
        },
        include: {
          course: true
        }
      });
      
      if (!existingLesson) {
        return error(404, { message: "Lesson not found" });
      }
      
      // Check if user is the course instructor or an admin
      if (existingLesson.course.instructor_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only update lessons in your own courses" });
      }
      
      const { title, content, order_number } = body;
      
      const lesson = await db.lessons.update({
        where: {
          id: lessonId
        },
        data: {
          title,
          content,
          order_number
        }
      });
      
      return {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content,
        order_number: lesson.order_number,
        created_at: lesson.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid lesson data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      title: t.String(),
      content: t.String(),
      order_number: t.Number()
    })
  })
  .delete("/:id", async ({ params: { id }, userId, role, error }) => {
    try {
      const lessonId = parseInt(id);
      
      if (isNaN(lessonId)) {
        return error(400, { message: "Invalid lesson ID" });
      }
      
      // Check if lesson exists
      const existingLesson = await db.lessons.findUnique({
        where: {
          id: lessonId
        },
        include: {
          course: true
        }
      });
      
      if (!existingLesson) {
        return error(404, { message: "Lesson not found" });
      }
      
      // Check if user is the course instructor or an admin
      if (existingLesson.course.instructor_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only delete lessons in your own courses" });
      }
      
      await db.lessons.delete({
        where: {
          id: lessonId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default lessonsController;