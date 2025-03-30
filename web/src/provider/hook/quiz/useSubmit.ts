
import { useMutation } from "@tanstack/react-query";
import api from "web/client/client";

export function useSubmit() {
  return useMutation({
    mutationFn: async (answer: { answer: boolean, questionId: number }[]) => {
      const response = await api.questions.submit.post(answer);
      if (response.error) {
        throw new Error("Error submitting answers");
      }
      return response.data;
    }
  })

}
