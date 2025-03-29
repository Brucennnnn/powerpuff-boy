// services/logsService.ts
import { Prisma } from "@prisma/client";
import db from "backend/db/db";

export const LogsService = {
    async getAllLogs() {
        try {
            return await db.logs.findMany({
                include: {
                    job: true
                }
            });
        } catch (err) {
            throw err;
        }
    },

    async getLogById(logId: number) {
        try {
            const log = await db.logs.findUnique({
                where: {
                    id: logId
                },
                include: {
                    job: true
                }
            });

            if (!log) {
                return null;
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
        } catch (err) {
            throw err;
        }
    },

    async getLogsByJobId(jobId: number) {
        try {
            // Check if job exists
            const job = await db.jobs.findUnique({
                where: {
                    id: jobId
                }
            });

            if (!job) {
                return null;
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
        } catch (err) {
            throw err;
        }
    }
};