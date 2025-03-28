import { treaty } from "@elysiajs/eden";
import { type App } from "@backend";

// Ignore the error, should work if you have a proper moonorepo setup which install package in root instead of relative node_modules
export const api = treaty<App>("localhost:8080");
