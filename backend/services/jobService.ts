// services/jobService.ts
import db from "backend/db/db";

export const JobService = {
    async getAllJobs() {
        try {
            return await db.jobs.findMany({});
        } catch (err) {
            throw err;
        }
    },

    async getJobById(id: number) {
        try {
            return await db.jobs.findUnique({
                where: { id }
            });
        } catch (err) {
            throw err;
        }
    }
};