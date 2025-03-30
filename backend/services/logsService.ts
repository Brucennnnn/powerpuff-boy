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

    async getJobById(jobId: number) {
        try {
            const job = await db.jobs.findUnique({
                where: {
                    id: jobId
                }
            });

            if (!job) {
                return null;
            }

            // นับจำนวน jobs ทั้งหมดในฐานข้อมูล
            const totalJobs = await db.jobs.count();

            // นับจำนวน jobs ที่มี job_id เหมือนกัน (รวมถึง job ปัจจุบัน)
            const sameTypeJobs = await db.jobs.count({
                where: {
                    id: job.id
                }
            });

            // คำนวณเปอร์เซ็นต์ของ jobs ที่มี job_id เดียวกันเทียบกับ jobs ทั้งหมด
            const percentage = (sameTypeJobs / totalJobs) * 100;

            // หาตำแหน่งของ job ปัจจุบันในกลุ่ม jobs ที่มี job_id เดียวกัน
            const position = await db.jobs.count({
                where: {
                    id: {
                        lte: job.id
                    }
                }
            });

            // คำนวณเปอร์เซ็นต์ของตำแหน่งในกลุ่ม
            const positionPercentage = (position / sameTypeJobs) * 100;

            return {
                ...job,
                totalJobs,
                sameTypeJobs,
                percentage: Math.round(percentage * 10) / 10, // เปอร์เซ็นต์ของ jobs ประเภทเดียวกันเทียบกับทั้งหมด
                position,
                positionPercentage: Math.round(positionPercentage * 10) / 10 // ตำแหน่งเปอร์เซ็นต์ในกลุ่มประเภทเดียวกัน
            };
        } catch (err) {
            console.error("Error fetching job by ID:", err);
            throw err;
        }
    },

    async createLog(data: { job_id: number }) {
        try {
            // Check if job exists
            const job = await db.jobs.findUnique({
                where: {
                    id: data.job_id
                }
            });

            if (!job) {
                return { error: "Job not found" };
            }

            // Create the log
            const log = await db.logs.create({
                data: {
                    job_id: data.job_id
                    // created_at จะถูกสร้างอัตโนมัติโดย Prisma ถ้าเป็น timestamp ที่มี default value เป็น NOW()
                }
            });

            return log;
        } catch (err) {
            console.error("Error creating log:", err);
            throw err;
        }
    }
};