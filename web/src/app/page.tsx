"use client";
import Typography from "@web/components/ui/typography";
import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div className="min-w-dvw min-h-dvh bg-coralred flex justify-center items-center">
      <div className="flex flex-col max-w-fit justify-center items-center gap-4">
        <Image src={"/landing/main.png"} alt="main" width={800} height={800} />
        <Typography variant="h1" fontWeight="bold" className="text-white">
          อยากอัพสกิลตัวเองใช่ไหม?
        </Typography>
        <Typography variant="h4" fontWeight="bold" className="text-white">
          อยากอัพสกิลตัวเองใช่ไหม?
        </Typography>
        <Link href={"/quiz"} className="bg-white p-2 rounded-full">
          คลิกเพื่อเริ่มทดสอบกันเลย!
        </Link>
      </div>
    </div>
  );
}
