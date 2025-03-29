import { Prisma, UserRole } from "@prisma/client";
import db from "backend/db/db";
import { authPlugin } from "backend/plugin/auth";
import { Elysia, t } from "elysia";

const reviewsController = new Elysia({ prefix: "/reviews" })
  .use(authPlugin)
  .get("/course/:id", async ({ params: { id }, error }) => {
    try {
      const courseId = parseInt(id);
      
      if (isNaN(courseId)) {
        return error(400, { message: "Invalid course ID" });
      }
      
      const reviews = await db.reviews.findMany({
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
          created_at: 'desc'
        }
      });
      
      return reviews.map(review => ({
        id: review.id,
        user_id: review.user_id,
        username: review.user.username,
        reviewer_name: `${review.user.firstname} ${review.user.lastname}`,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .get("/my", async ({ userId, error }) => {
    try {
      const reviews = await db.reviews.findMany({
        where: {
          user_id: userId
        },
        include: {
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return reviews.map(review => ({
        id: review.id,
        course_id: review.course_id,
        course_title: review.course.title,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at.toISOString()
      }));
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  })
  .post("/", async ({ body, userId, error }) => {
    try {
      const { course_id, rating, comment } = body;
      
      // Check if course exists
      const course = await db.courses.findUnique({
        where: {
          id: course_id
        }
      });
      
      if (!course) {
        return error(404, { message: "Course not found" });
      }
      
      // Check if user is enrolled in the course
      const enrollment = await db.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: course_id
          }
        }
      });
      
      if (!enrollment) {
        return error(403, { message: "You must be enrolled in the course to review it" });
      }
      
      // Check if user has already reviewed this course
      const existingReview = await db.reviews.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: course_id
          }
        }
      });
      
      if (existingReview) {
        return error(400, { message: "You have already reviewed this course" });
      }
      
      // Validate rating
      if (rating < 1 || rating > 5) {
        return error(400, { message: "Rating must be between 1 and 5" });
      }
      
      const review = await db.reviews.create({
        data: {
          user_id: userId,
          course_id,
          rating,
          comment,
          created_at: new Date()
        }
      });
      
      return {
        id: review.id,
        course_id: review.course_id,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid review data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      course_id: t.Number(),
      rating: t.Number(),
      comment: t.Optional(t.String())
    })
  })
  .put("/:id", async ({ params: { id }, body, userId, error }) => {
    try {
      const reviewId = parseInt(id);
      
      if (isNaN(reviewId)) {
        return error(400, { message: "Invalid review ID" });
      }
      
      const { rating, comment } = body;
      
      // Check if review exists
      const existingReview = await db.reviews.findUnique({
        where: {
          id: reviewId
        }
      });
      
      if (!existingReview) {
        return error(404, { message: "Review not found" });
      }
      
      // Check if user owns the review
      if (existingReview.user_id !== userId) {
        return error(403, { message: "Forbidden: You can only update your own reviews" });
      }
      
      // Validate rating
      if (rating < 1 || rating > 5) {
        return error(400, { message: "Rating must be between 1 and 5" });
      }
      
      const review = await db.reviews.update({
        where: {
          id: reviewId
        },
        data: {
          rating,
          comment
        }
      });
      
      return {
        id: review.id,
        course_id: review.course_id,
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at.toISOString()
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientValidationError) {
        return error(400, { message: "Invalid review data" });
      }
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      rating: t.Number(),
      comment: t.Optional(t.String())
    })
  })
  .delete("/:id", async ({ params: { id }, userId, role, error }) => {
    try {
      const reviewId = parseInt(id);
      
      if (isNaN(reviewId)) {
        return error(400, { message: "Invalid review ID" });
      }
      
      // Check if review exists
      const existingReview = await db.reviews.findUnique({
        where: {
          id: reviewId
        }
      });
      
      if (!existingReview) {
        return error(404, { message: "Review not found" });
      }
      
      // Check if user owns the review or is an admin
      if (existingReview.user_id !== userId && role !== UserRole.ADMIN) {
        return error(403, { message: "Forbidden: You can only delete your own reviews" });
      }
      
      await db.reviews.delete({
        where: {
          id: reviewId
        }
      });
      
      return { success: true };
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  });

export default reviewsController;