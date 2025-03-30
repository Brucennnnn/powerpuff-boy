"use client";
// import { useUser } from "@web/guard/useUser";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "./components/SwipeCard";
import { Career, CareersCard } from "./components/CareersCard";
import Link from "next/link";
import { useQuestion } from "@web/provider/hook/quiz/useQuestion";
import { useSubmit } from "@web/provider/hook/quiz/useSubmit";
import Typography from "@web/components/ui/typography";

const SwipeCard = dynamic(() => import("./components/SwipeCard"), {
  ssr: false,
});

export default function Page() {
  const [answer, setAnswer] = useState<Record<number, boolean>>({});
  const [career, setCareer] = useState<Career | null>();
  const [cards, setCards] = useState<Card[]>([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const { data: question } = useQuestion();
  const { mutate: onSubmit } = useSubmit();

  useEffect(() => {
    if (!question) return;
    const card = question.map((q) => ({ id: q.id, title: q.question }));
    setCards(card);
  }, [question]);

  const onYes = (id: number) => {
    answer[id] = true;
    setAnswer(answer);
  };

  const onNo = (id: number) => {
    answer[id] = false;
    setAnswer(answer);
  };

  useEffect(() => {
    if (!question || cards.length > 0 || career) return;
    console.log("submit");

    const submitAnswer: { answer: boolean; questionId: number }[] = [];
    for (const [key, value] of Object.entries(answer)) {
      submitAnswer.push({ answer: value, questionId: Number(key) });
    }
    if (submitAnswer.length === 0) {
      return;
    }

    try {
      onSubmit(submitAnswer, {
        onSuccess(data) {
          setCareer(data);
        },
      });
    } catch (err) {
      console.log(err);
    }

    setIsSubmit(true);
  }, [cards, isSubmit, onSubmit, career, answer, question]);

  if (career) {
    return (
      <div className="flex flex-col min-h-dvh min-w-dvw bg-coralred justify-center items-center gap-4">
        <CareersCard {...career} />
        <Link
          href={career.academy_link}
          className="bg-white p-2 rounded-full items-end"
        >
          ไปที่ Academy
        </Link>
      </div>
    );
  }

  return (
    <div className="grid h-[500px] min-h-dvh min-w-dvw bg-coralred  place-items-center ">
      <Typography variant="h3" fontWeight="bold" className="text-white">
        Quiz
      </Typography>
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
