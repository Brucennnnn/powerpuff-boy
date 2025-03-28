import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
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
