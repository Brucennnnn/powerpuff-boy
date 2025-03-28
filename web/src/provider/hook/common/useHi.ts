import { useQuery } from "@tanstack/react-query";
import api from "web/client/client";

export function useHi() {
  return useQuery({
    queryKey: [],
    queryFn: async () => {
      const response = await api.hi.get();
      return response.data;
    },
  });
}
