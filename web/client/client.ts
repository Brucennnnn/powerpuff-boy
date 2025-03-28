import { treaty } from "@elysiajs/eden";
import { type app } from "@backend";

// Ignore the error, should work if you have a proper moonorepo setup which install package in root instead of relative node_modules
const api = treaty<app>("localhost:8080");

export default api;
