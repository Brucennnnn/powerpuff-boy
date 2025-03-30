import { Prisma, QuestionStatus } from "@prisma/client";
import db from "backend/db/db";
import { CareerService } from "backend/services/careerService";
import { JobService } from "backend/services/jobService";
import { Elysia, t } from "elysia";

const questionsController = new Elysia({ prefix: "/questions" })
  .get("/all", async ({ error }) => {
    try {
      const questions = await db.questions.findMany({
        where: {
          status: QuestionStatus.ACTIVE
        }
      });
      return questions;
    } catch (err) {
      return error(500, { message: "Internal Server Error" });
    }
  }, {
    response: {
      200: t.Array(
        t.Object({
          id: t.Number(),
          question: t.String()
        })
      ),
      500: t.Object({
        message: t.String()
      })
    }
  })
  .post("/submit",
    async ({ body, error }) => {
      try {
        // Get all question IDs from the submission
        const questionIds = body.map(item => item.questionId);

        // Fetch the question texts from the database
        const questions = await db.questions.findMany({
          where: {
            id: {
              in: questionIds
            }
          },
          select: {
            id: true,
            question: true
          }
        });

        // Check if all question IDs exist in the database
        const foundQuestionIds = questions.map(q => q.id);
        const missingQuestionIds = questionIds.filter(id => !foundQuestionIds.includes(id));

        if (missingQuestionIds.length > 0) {
          return error(400, {
            message: `The following question IDs do not exist: ${missingQuestionIds.join(', ')}`
          });
        }

        // Create a map for quick lookup of question text by ID
        const questionMap: Record<number, string> = {};
        questions.forEach(q => {
          questionMap[q.id] = q.question;
        });

        // Transform the data to include question text
        const formattedAnswers = body.map(item => ({
          question: questionMap[item.questionId],
          answer: item.answer
        }));

        const possibleAnswers = await JobService.getAllJobs();

        const recommendation = await CareerService.getCareerRecommendation(formattedAnswers, possibleAnswers);
        if ("error" in recommendation) {
          return error(500, { message: "Internal Server Error" });
        }
        // Call another controller/service with the formatted data
        // Import and use the other controller here

        //const result = await aiController.sendSomeAnswer(formattedAnswers); <-- Example of calling another controller

        // Return the original formatted answers
        const career = await JobService.getJobById(recommendation.id);
        if (!career) {
          return error(500, { message: "Internal Server Error" });
        }
        return career;
      } catch (err) {
        return error(500, { message: "Internal Server Error" });
      }
    },
    {
      body: t.Array(
        t.Object({
          questionId: t.Number(),
          answer: t.Boolean()
        })
      )
    }
  )
export default questionsController;
