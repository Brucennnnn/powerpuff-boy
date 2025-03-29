import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const paymentsController = new Elysia({ prefix: "/payments" })
    .use(authPlugin)
    .get("/my", async ({ userId, error }) => {
        try {
            const payments = await db.payments.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    course: {
                        select: {
                            title: true,
                            instructor: {
                                select: {
                                    firstname: true,
                                    lastname: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    paid_at: 'desc'
                }
            });

            return payments.map(payment => ({
                id: payment.id,
                course_id: payment.course_id,
                course_title: payment.course.title,
                instructor_name: `${payment.course.instructor.firstname} ${payment.course.instructor.lastname}`,
                amount: payment.amount.toString(),
                payment_method: payment.payment_method,
                payment_status: payment.payment_status,
                paid_at: payment.paid_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/course/:id", async ({ params: { id }, role, userId, error }) => {
        try {
            const courseId = parseInt(id);

            if (isNaN(courseId)) {
                return error(400, { message: "Invalid course ID" });
            }

            // Check if course exists
            const course = await db.courses.findUnique({
                where: {
                    id: courseId
                }
            });

            if (!course) {
                return error(404, { message: "Course not found" });
            }

            // Check if user is course instructor or admin
            if (course.instructor_id !== userId && role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: You can only view payments for your own courses" });
            }

            const payments = await db.payments.findMany({
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
                    paid_at: 'desc'
                }
            });

            return payments.map(payment => ({
                id: payment.id,
                user_id: payment.user_id,
                username: payment.user.username,
                student_name: `${payment.user.firstname} ${payment.user.lastname}`,
                amount: payment.amount.toString(),
                payment_method: payment.payment_method,
                payment_status: payment.payment_status,
                paid_at: payment.paid_at.toISOString()
            }));
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .post("/", async ({ body, userId, error }) => {
        try {
            const { course_id, payment_method } = body;

            // Check if course exists
            const course = await db.courses.findUnique({
                where: {
                    id: course_id
                }
            });

            if (!course) {
                return error(404, { message: "Course not found" });
            }

            // Check if user has already paid for this course
            const existingPayment = await db.payments.findFirst({
                where: {
                    user_id: userId,
                    course_id: course_id,
                    payment_status: 'completed'
                }
            });

            if (existingPayment) {
                return error(400, { message: "You have already paid for this course" });
            }

            // Create payment with "pending" status
            const payment = await db.payments.create({
                data: {
                    user_id: userId,
                    course_id: course_id,
                    amount: course.price,
                    payment_method,
                    payment_status: 'pending',
                    paid_at: new Date()
                }
            });

            // In a real application, here you would integrate with a payment gateway
            // After successful payment, you would update the status to "completed"
            // and create an enrollment

            // For now, we'll simulate a successful payment and create the enrollment
            const updatedPayment = await db.payments.update({
                where: {
                    id: payment.id
                },
                data: {
                    payment_status: 'completed'
                }
            });

            // Create enrollment after successful payment
            await db.enrollments.create({
                data: {
                    user_id: userId,
                    course_id: course_id,
                    progress: 0,
                    completed: false,
                    enrolled_at: new Date()
                }
            });

            return {
                id: updatedPayment.id,
                course_id: updatedPayment.course_id,
                amount: updatedPayment.amount.toString(),
                payment_method: updatedPayment.payment_method,
                payment_status: updatedPayment.payment_status,
                paid_at: updatedPayment.paid_at.toISOString(),
                message: "Payment successful. You are now enrolled in the course."
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientValidationError) {
                return error(400, { message: "Invalid payment data" });
            }
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            course_id: t.Number(),
            payment_method: t.String()
        })
    })
    .put("/:id/status", async ({ params: { id }, body, role, error }) => {
        try {
            // Only admins can update payment status
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const paymentId = parseInt(id);

            if (isNaN(paymentId)) {
                return error(400, { message: "Invalid payment ID" });
            }

            const { payment_status } = body;

            // Validate payment status
            if (payment_status !== 'pending' && payment_status !== 'completed' && payment_status !== 'failed') {
                return error(400, { message: "Invalid payment status. Must be 'pending', 'completed', or 'failed'" });
            }

            // Check if payment exists
            const existingPayment = await db.payments.findUnique({
                where: {
                    id: paymentId
                }
            });

            if (!existingPayment) {
                return error(404, { message: "Payment not found" });
            }

            const payment = await db.payments.update({
                where: {
                    id: paymentId
                },
                data: {
                    payment_status
                }
            });

            // If payment is now completed, create an enrollment if it doesn't exist
            if (payment_status === 'completed') {
                const existingEnrollment = await db.enrollments.findUnique({
                    where: {
                        user_id_course_id: {
                            user_id: payment.user_id,
                            course_id: payment.course_id
                        }
                    }
                });

                if (!existingEnrollment) {
                    await db.enrollments.create({
                        data: {
                            user_id: payment.user_id,
                            course_id: payment.course_id,
                            progress: 0,
                            completed: false,
                            enrolled_at: new Date()
                        }
                    });
                }
            }

            return {
                id: payment.id,
                user_id: payment.user_id,
                course_id: payment.course_id,
                amount: payment.amount.toString(),
                payment_method: payment.payment_method,
                payment_status: payment.payment_status,
                paid_at: payment.paid_at.toISOString()
            };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        body: t.Object({
            payment_status: t.String()
        })
    })
    .delete("/:id", async ({ params: { id }, role, error }) => {
        try {
            // Only admins can delete payments
            if (role !== UserRole.ADMIN) {
                return error(403, { message: "Forbidden: Admin access required" });
            }

            const paymentId = parseInt(id);

            if (isNaN(paymentId)) {
                return error(400, { message: "Invalid payment ID" });
            }

            // Check if payment exists
            const existingPayment = await db.payments.findUnique({
                where: {
                    id: paymentId
                }
            });

            if (!existingPayment) {
                return error(404, { message: "Payment not found" });
            }

            await db.payments.delete({
                where: {
                    id: paymentId
                }
            });

            return { success: true };
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    });

export default paymentsController;