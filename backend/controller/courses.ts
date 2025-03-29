import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const coursesController = new Elysia({ prefix: "/courses" })
  .use(authPlugin)
  .get("/", async ({ error }) => {
    try {
      const courses = await db.courses.findMany({
        include: {
          instructor: {
            select: {
              id: true,
              username: true,
              firstname: true,
              lastname: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        instructor_name: `${course.instructor.firstname} ${course.instructor.lastname}`,
        instructor_username: course.instructor.username,
        category: course.category,
        price: course.price.toString(),
        lesson_count: course._count.lessons,
        enrollment_count: course._count.enrollments,
        created_at: course.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/:id", async ({ params: { id }, error }) => {
    try {
      const courseId = parseInt(id);
      
      if (isNaN(courseId)) {
        return error(400, { message: "Invalid course ID" });
      }
      
      const course = await db.courses.findUnique({
        where: {
          id: courseId
        },
        include: {
          instructor: {
            select: {
              id: true,
              username: true,
              firstname: true,
              lastname: true
            }
          },
          lessons: {
            orderBy: {
              order_number: 'asc'
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });
      
      if (!course) {
        return error(404, { message: "Course not found" });
      }
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        instructor_name: `${course.instructor.firstname} ${course.instructor.lastname}`,
        instructor_username: course.instructor.username,
        category: course.category,
        price: course.price.toString(),
        enrollment_count: course._count.enrollments,
        created_at: course.created_at.toISOString(),
        lessons: course.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          order_number: lesson.order_number
        }))
      };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/instructor/:id", async ({ params: { id }, error }) => {
    try {
      const instructorId = parseInt(id);
      
      if (isNaN(instructorId)) {
        return error(400, { message: "Invalid instructor ID" });
      }
      
      const courses = await db.courses.findMany({
        where: {
          instructor_id: instructorId
        },
        include: {
          instructor: {
            select: {
              id: true,
              username: true,
              firstname: true,
              lastname: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        instructor_name: `${course.instructor.firstname} ${course.instructor.lastname}`,
        instructor_username: course.instructor.username,
        category: course.category,
        price: course.price.toString(),
        lesson_count: course._count.lessons,
        enrollment_count: course._count.enrollments,
        created_at: course.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/category/:category", async ({ params: { category }, error }) => {
    try {
      const courses = await db.courses.findMany({
        where: {
          category
        },
        include: {
          instructor: {
            select: {
              id: true,
              username: true,
              firstname: true,
              lastname: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        instructor_name: `${course.instructor.firstname} ${course.instructor.lastname}`,
        instructor_username: course.instructor.username,
        category: course.category,
        price: course.price.toString(),
        lesson_count: course._count.lessons,
        enrollment_count: course._count.enrollments,
        created_at: course.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, userId, role, error }) => {
    try {
      // Check if user is instructor or admin
      if (role !== UserRole.INSTRUCTOR && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: Instructor or Admin access required" });
      }
      
      const { title, description, category, price } = body;
      
      const course = await db.courses.create({
        data: {
          title,
          description,
          category,
          price,
          instructor_id: userId,
          created_at: new Date()
        }
      });
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        category: course.category,
        price: course.price.toString(),
        created_at: course.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid course data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      category: t.String(),
      price: t.Number()
    })
  })
  .put("/:id", async ({ params: { id }, body, userId, role, error }) => {
    try {
      const courseId = parseInt(id);
      
      if (isNaN(courseId)) {
        return error(400, { message: "Invalid course ID" });
      }
      
      // Check if course exists
      const existingCourse = await db.courses.findUnique({
        where: {
          id: courseId
        }
      });
      
      if (!existingCourse) {
        return error(404, { message: "Course not found" });
      }
      
      // Check if user owns the course or is an admin
      if (existingCourse.instructor_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only update your own courses" });
      }
      
      const { title, description, category, price } = body;
      
      const course = await db.courses.update({
        where: {
          id: courseId
        },
        data: {
          title,
          description,
          category,
          price
        }
      });
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: course.instructor_id,
        category: course.category,
        price: course.price.toString(),
        created_at: course.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid course data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      category: t.String(),
      price: t.Number()
    })
  })
  .delete("/:id", async ({ params: { id }, userId, role, error }) => {
    try {
      const courseId = parseInt(id);
      
      if (isNaN(courseId)) {
        return error(400, { message: "Invalid course ID" });
      }
      
      // Check if course exists
      const existingCourse = await db.courses.findUnique({
        where: {
          id: courseId
        }
      });
      
      if (!existingCourse) {
        return error(404, { message: "Course not found" });
      }
      
      // Check if user owns the course or is an admin
      if (existingCourse.instructor_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only delete your own courses" });
      }
      
      // Delete related records first
      await db.lessons.deleteMany({
        where: {
          course_id: courseId
        }
      });
      
      await db.enrollments.deleteMany({
        where: {
          course_id: courseId
        }
      });
      
      await db.reviews.deleteMany({
        where: {
          course_id: courseId
        }
      });
      
      await db.payments.deleteMany({
        where: {
          course_id: courseId
        }
      });
      
      // Delete the course
      await db.courses.delete({
        where: {
          id: courseId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default coursesController;