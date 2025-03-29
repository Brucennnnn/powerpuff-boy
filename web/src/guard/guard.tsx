"use client";

import { useMe } from "@web/provider/hook/user/useMe";
import { useRouter } from "next/router";
import { JSX } from "react";

export default function Guard(children: JSX.Element) {
  const data = useMe();
  const router = useRouter();
  if (data.isError) {
    router.push("/login");
  }
  return <>{children}</>;
}
