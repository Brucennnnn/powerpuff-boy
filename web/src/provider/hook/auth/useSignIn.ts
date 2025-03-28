import { useMutation } from "@tanstack/react-query";
import api from "web/client/client";

export function useSign() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const response = await api.auth.signin.post({
        username: username,
        password: password,
      });
      return response.data;
    },
  });
}
