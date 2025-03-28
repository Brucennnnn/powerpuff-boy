
import { useQuery } from "@tanstack/react-query";
import api from "web/client/client";

export function useMe() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const response = await api.user.me.get();
      return response.data;
    },
  });
}
