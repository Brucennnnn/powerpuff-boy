import { treaty } from "@elysiajs/eden";
import { type app } from "@backend";

// @ts-expect-error - Ignoring duplicate Elysia type from different node_modules
const api = treaty<app>("localhost:8080");

export default api;
