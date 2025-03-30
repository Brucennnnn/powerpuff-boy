import { useQuery } from "@tanstack/react-query";
import api from "web/client/client";

export function useQuestion() {
  return useQuery({
    queryKey: ["question", "all"],
    queryFn: async () => {
      try {
        const response = await api.questions.all.get();
        return response.data;
      } catch (err) {
        console.log(err)
      }
    }
  })

}
