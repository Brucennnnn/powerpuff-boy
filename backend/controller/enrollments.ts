import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const enrollmentsController = new Elysia({ prefix: "/enrollments" })
    .use(authPlugin)
    .get("/my", async ({ userId, error }) => {
        try {
            const enrollments = await db.enrollments.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    course: {
                        include: {
                            instructor: {
                                select: {
                                    username: true,
                                    firstname: true,
                                    lastname: true
                                }
                            },
                            _count: {
                                select: {
                                    lessons: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    enrolled_at: 'desc'
                }
            });

            return enrollments.map(enrollment => ({
                id: enrollment.id,
                course_id: enrollment.course_id,
                course_title: enrollment.course.title,
                course_description: enrollment.course.description,
                category: enrollment.course.category,
                instructor_name: `${enrollment.course.instructor.firstname} ${enrollment.course.instructor.lastname}`,
                instructor_username: enrollment.course.instructor.username,
                total_lessons: enrollment.course._count.lessons,
                progress: enrollment.progress,
                completed: enrollment.completed,
                enrolled_at: enrollment.enrolled_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/course/:id", async ({ params: { id }, role, error }) => {
        try {
            // Only instructors and admins can see course enrollments
            if (role !== UserRole.INSTRUCTOR && role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Instructor or Admin access required" });
            }

            const courseId = parseInt(id);

            if (isNaN(courseId)) {
                return error(400, { message: "Invalid course ID" });
            }

            const enrollments = await db.enrollments.findMany({
                where: {
                    course_id: courseId
                },
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
                    enrolled_at: 'desc'
                }
            });

            return enrollments.map(enrollment => ({
                id: enrollment.id,
                user_id: enrollment.user_id,
                username: enrollment.user.username,
                student_name: `${enrollment.user.firstname} ${enrollment.user.lastname}`,
                progress: enrollment.progress,
                completed: enrollment.completed,
                enrolled_at: enrollment.enrolled_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/", async ({ body, userId, error }) => {
        try {
            const { course_id } = body;

            // Check if course exists
            const course = await db.courses.findUnique({
                where: {
                    id: course_id
                }
            });

            if (!course) {
                return error(404, { message: "Course not found" });
            }

            // Check if user is already enrolled
            const existingEnrollment = await db.enrollments.findUnique({
                where: {
                    user_id_course_id: {
                        user_id: userId,
                        course_id: course_id
                    }
                }
            });

            if (existingEnrollment) {
                return error(400, { message: "Already enrolled in this course" });
            }

            const enrollment = await db.enrollments.create({
                data: {
                    user_id: userId,
                    course_id: course_id,
                    progress: 0,
                    completed: false,
                    enrolled_at: new Date()
                }
            });

            return {
                id: enrollment.id,
                user_id: enrollment.user_id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                completed: enrollment.completed,
                enrolled_at: enrollment.enrolled_at.toISOString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid enrollment data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            course_id: t.Number()
        })
    })
    .put("/progress", async ({ body, userId, error }) => {
        try {
            const { course_id, progress, completed } = body;

            // Check if enrollment exists
            const existingEnrollment = await db.enrollments.findUnique({
                where: {
                    user_id_course_id: {
                        user_id: userId,
                        course_id: course_id
                    }
                }
            });

            if (!existingEnrollment) {
                return error(404, { message: "Enrollment not found" });
            }

            // Validate progress value
            if (progress < 0 || progress > 100) {
                return error(400, { message: "Progress must be between 0 and 100" });
            }

            const enrollment = await db.enrollments.update({
                where: {
                    user_id_course_id: {
                        user_id: userId,
                        course_id: course_id
                    }
                },
                data: {
                    progress,
                    completed
                }
            });

            return {
                id: enrollment.id,
                user_id: enrollment.user_id,
                course_id: enrollment.course_id,
                progress: enrollment.progress,
                completed: enrollment.completed,
                enrolled_at: enrollment.enrolled_at.toISOString()
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid progress data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            course_id: t.Number(),
            progress: t.Number(),
            completed: t.Boolean()
        })
    })
    .delete("/:id", async ({ params: { id }, userId, role, error }) => {
        try {
            const enrollmentId = parseInt(id);

            if (isNaN(enrollmentId)) {
                return error(400, { message: "Invalid enrollment ID" });
            }

            // Check if enrollment exists
            const existingEnrollment = await db.enrollments.findUnique({
                where: {
                    id: enrollmentId
                }
            });

            if (!existingEnrollment) {
                return error(404, { message: "Enrollment not found" });
            }

            // Check if user owns the enrollment or is an admin
            if (existingEnrollment.user_id !== userId && role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: You can only delete your own enrollments" });
            }

            await db.enrollments.delete({
                where: {
                    id: enrollmentId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default enrollmentsController;