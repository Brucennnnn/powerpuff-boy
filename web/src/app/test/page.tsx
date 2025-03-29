"use client";
import { useUser } from "@web/guard/useUser";

export default function Page() {
  const { id } = useUser();
  return <div>{id}</div>;
}
