import { Prisma } from "@prisma/client";
import db from "backend/db/db";
import { Elysia, t } from "elysia";

const jobsController = new Elysia({ prefix: "/jobs" })
    .get("/all", async ({ error }) => {
        try {
            const jobs = await db.jobs.findMany({
            });
            return jobs;
        }
        catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }, {
        response: {
            200: t.Array(
                t.Object({
                id: t.Number(),

                })
            ),
            500: t.Object({
                message: t.String()
            })
        }
    })
    .get("/:id", async ({ params, error }) => {
        try {
            const job = await db.jobs.findUnique({
                where: {
                    id: Number(params.id)
                }
            });
            if (!job) {
                return error(404, { message: "Job not found" });
            }
            return job;
        }
        catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    }
    , {
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
    })


export default jobsController;
