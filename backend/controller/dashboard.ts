// controllers/dashboardController.ts
import { Elysia, t } from "elysia";
import { LogsService } from "../services/logsService";

const dashboardController = new Elysia({ prefix: "/dashboard" })
    .get("/logs-summary", async ({ error }) => {
        try {
            const logs = await LogsService.getAllLogs();

            // Define interface for job summary
            interface JobSummary {
                jobName: string;
                count: number;
            }

            // Process logs data for dashboard
            const summary = {
                totalLogs: logs.length,
                // You can add more processed data here
                logsByJob: {} as Record<number, JobSummary>
            };

            // Group logs by job
            logs.forEach(log => {
                // Extract jobId from the log object
                const jobId = log.job_id;

                // Initialize the job entry if it doesn't exist
                if (!summary.logsByJob[jobId]) {
                    summary.logsByJob[jobId] = {
                        jobName: log.job.job_title_en,
                        count: 0
                    };
                }

                // Increment the count for this job
                summary.logsByJob[jobId].count++;
            });

            return summary;
        }
        catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    });

export default dashboardController;