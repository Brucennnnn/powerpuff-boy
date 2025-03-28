"use client";
import { useEffect, useState } from "react";
import { api } from "../client/client";

export default function Home() {
  const [s, setS] = useState<string | null>("");
  useEffect(() => {
    const a = async () => {
      const d = await api.hii.get();
      setS(d.data);
      console.log(d);
    };
    a();
  }, []);
  return <div className="text-red-600">{s}</div>;
}
