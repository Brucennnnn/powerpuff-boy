import { useMutation } from "@tanstack/react-query";
import api from "web/client/client";

export function useRegister() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {

      const response = await api.auth.register.post({
        username: username,
        password: password,
      });
      return response.data;
    },
  });
}
