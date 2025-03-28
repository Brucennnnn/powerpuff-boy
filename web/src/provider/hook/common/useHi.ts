import { useQuery } from "@tanstack/react-query";
import api from "web/client/client";

export function usePing() {
  return useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      const response = await api.ping.get();
      return response.data;
    },
  });
}
