"use client";
// import { useUser } from "@web/guard/useUser";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "./components/SwipeCard";

const SwipeCard = dynamic(() => import("./components/SwipeCard"), {
  ssr: false,
});

export default function Page() {
  const [answer, setAnswer] = useState<boolean[]>(
    Array(cardData.length).fill(false),
  );
  const [cards, setCards] = useState<Card[]>(cardData);

  const onYes = (id: number) => {
    answer[id] = true;
    setAnswer(answer);
  };

  const onNo = (id: number) => {};
  console.log(answer);

  return (
    <div className="grid h-[500px] min-h-dvh min-w-dvw bg-coralred  place-items-center ">
      {cards.map((card) => {
        return (
          <SwipeCard
            key={card.id}
            cards={cards}
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
