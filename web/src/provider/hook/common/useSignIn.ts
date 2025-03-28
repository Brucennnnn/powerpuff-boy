import { useQuery } from "@tanstack/react-query";
import api from "web/client/client";

export function useSign() {
  return useQuery({
    queryKey: ["sign"],
    queryFn: async () => {
      const response = await api.auth.sign({ name: "Fischl" }).get();
      return response.data;
    },
  });
}
