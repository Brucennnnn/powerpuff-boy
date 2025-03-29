import { Prisma } from "@prisma/client";
import db from "backend/db/db";
import { Elysia, t } from "elysia";

const logsController = new Elysia({ prefix: "/logs" })
    .get("/all", async ({ error }) => {
        try {
            const logs = await db.logs.findMany({
                include: {
                    job: true
                }
            });
            return logs;
        }
        catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/:id", async ({ params, error }) => {
        try {
            const logId = Number(params.id);

            const log = await db.logs.findUnique({
                where: {
                    id: logId
                },
                include: {
                    job: true
                }
            });

            if (!log) {
                return error(404, { message: "Log not found" });
            }

            // Get total count of logs with this job_id
            const totalLogsWithSameJob = await db.logs.count({
                where: {
                    job_id: log.job_id
                }
            });

            // Calculate position (how many logs with this job_id have a smaller id)
            const position = await db.logs.count({
                where: {
                    job_id: log.job_id,
                    id: {
                        lte: log.id
                    }
                }
            });

            // Calculate the percentage
            const percentage = (position / totalLogsWithSameJob) * 100;

            return {
                ...log,
                percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
                position: position,
                totalLogsWithSameJob: totalLogsWithSameJob
            };
        }
        catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/job/:jobId", async ({ params, error }) => {
        try {
            const jobId = Number(params.jobId);

            // Check if job exists
            const job = await db.jobs.findUnique({
                where: {
                    id: jobId
                }
            });

            if (!job) {
                return error(404, { message: "Job not found" });
            }

            // Get total count of logs with this job_id
            const totalLogsWithJob = await db.logs.count({
                where: {
                    job_id: jobId
                }
            });

            // Get logs for the job with position and percentage information
            const logs = await db.logs.findMany({
                where: {
                    job_id: jobId
                },
                orderBy: {
                    id: 'asc'
                },
                include: {
                    job: true
                }
            });

            // Add percentage information to each log
            const logsWithPercentage = logs.map((log, index) => {
                const position = index + 1;
                const percentage = (position / totalLogsWithJob) * 100;

                return {
                    ...log,
                    percentage: Math.round(percentage * 10) / 10,
                    position: position,
                    totalLogsWithJob: totalLogsWithJob
                };
            });

            return logsWithPercentage;
        }
        catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    });

export default logsController;