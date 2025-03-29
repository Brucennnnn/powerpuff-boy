// controllers/jobsController.ts
import { Elysia, t } from "elysia";
import { JobService } from "../services/jobService";

const jobsController = new Elysia({ prefix: "/jobs" })
    .get("/all", async ({ error }) => {
        try {
            const jobs = await JobService.getAllJobs();
            return jobs;
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        response: {
            200: t.Array(
                t.Object({
                    id: t.Number(),
                    // Add other fields here
                })
            ),
            500: t.Object({
                message: t.String()
            })
        }
    })
    .get("/:id", async ({ params, error }) => {
        try {
            const job = await JobService.getJobById(Number(params.id));
            if (!job) {
                return error(404, { message: "Job not found" });
            }
            return job;
        } catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        response: {
            200: t.Object({
                id: t.Number(),
                job_title_th: t.String(),
                job_title_en: t.String(),
                short_desc: t.String(),
                job_avatar: t.String(),
                academy_link: t.String(),
            }),
            404: t.Object({
                message: t.String()
            }),
            500: t.Object({
                message: t.String()
            })
        }
    });

export default jobsController;