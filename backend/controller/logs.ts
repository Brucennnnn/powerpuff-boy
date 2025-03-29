// controllers/logsController.ts
import { Elysia, t } from "elysia";
import { LogsService } from "../services/logsService";

const logsController = new Elysia({ prefix: "/logs" })
    .get("/all", async ({ error }) => {
        try {
            const logs = await LogsService.getAllLogs();
            return logs;
        }
        catch (err) {
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/:id", async ({ params, error }) => {
        try {
            const logId = Number(params.id);
            const log = await LogsService.getLogById(logId);

            if (!log) {
                return error(404, { message: "Log not found" });
            }

            return log;
        }
        catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    })
    .get("/job/:jobId", async ({ params, error }) => {
        try {
            const jobId = Number(params.jobId);
            const logs = await LogsService.getLogsByJobId(jobId);

            if (!logs) {
                return error(404, { message: "Job not found" });
            }

            return logs;
        }
        catch (err) {
            console.error(err);
            return error(500, { message: "Internal Server Error" });
        }
    });

export default logsController;