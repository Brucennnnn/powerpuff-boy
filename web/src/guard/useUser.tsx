"use client";

import { useMe } from "@web/provider/hook/user/useMe";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useUser() {
  const router = useRouter();
  const { data, isError, isLoading } = useMe();
  useEffect(() => {
    if (isLoading) return;
    console.log(data);
    // if (!data || isError) {
    //   router.push("/login");
    // }
  }, [data, isError, isLoading, router]);
  return {
    id: data?.id ?? "",
    username: data?.username ?? "",
    password: data?.password ?? "",
  };
}
