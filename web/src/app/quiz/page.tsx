"use client";
// import { useUser } from "@web/guard/useUser";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "./components/SwipeCard";
import { CareersCard } from "./components/CareersCard";
import Link from "next/link";

const SwipeCard = dynamic(() => import("./components/SwipeCard"), {
  ssr: false,
});

export default function Page() {
  const [answer, setAnswer] = useState<Record<number, boolean>>({});
  const [cards, setCards] = useState<Card[]>(cardData);

  const onYes = (id: number) => {
    answer[id] = true;
    setAnswer(answer);
  };

  const onNo = (id: number) => {
    answer[id] = false;
    setAnswer(answer);
  };
  console.log(answer);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col min-h-dvh min-w-dvw bg-coralred justify-center items-center gap-4">
        <CareersCard job="Artist" />
        <Link
          href="https://www.garenaacademy.com/"
          className="bg-white p-2 rounded-full items-end"
        >
          ไปที่ Academy
        </Link>
      </div>
    );
  }

  return (
    <div className="grid h-[500px] min-h-dvh min-w-dvw bg-coralred  place-items-center ">
      {cards.map((card) => {
        return (
          <SwipeCard
            key={card.id}
            setCards={setCards}
            onYes={onYes}
            onNo={onNo}
            {...card}
          />
        );
      })}
    </div>
  );
}

const cardData: Card[] = [
  {
    id: 0,
    title: "คุณชอบเล่นเกมส์มั้ย?",
  },
  {
    id: 1,
    title: "คุณชอบเล่นเกมส์มั้ย?",
  },
  {
    id: 2,
    title: "คุณชอบเล่นเกมส์มั้ย?",
  },
];
