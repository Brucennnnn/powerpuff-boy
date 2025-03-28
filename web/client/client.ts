import { treaty } from "@elysiajs/eden";
import { type app } from "@backend";

// @ts-expect-error - Ignoring duplicate Elysia type from different node_modules
const api = treaty<app>("localhost:8080", {
  onRequest() {
    const token = localStorage.getItem("token");
    if (token) {
      return {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
    }
    return {}
  },
  onResponse(response) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }
  }
});

export default api;
