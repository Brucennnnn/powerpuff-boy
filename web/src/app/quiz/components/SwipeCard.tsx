"use client";
import React, { Dispatch, SetStateAction } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

const SwipeCard = ({
  id,
  title,
  setCards,
  onYes,
  onNo,
  cards,
}: {
  id: number;
  title: string;
  setCards: Dispatch<SetStateAction<Card[]>>;
  onYes: (id: number) => void;
  onNo: (id: number) => void;
  cards: Card[];
}) => {
  const x = useMotionValue(0);

  const rotate = useTransform(x, [-150, 150], [-18, 18]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const handleDragEnd = () => {
    if (Math.abs(x.get()) > 100) {
      if (x.get() > 100) {
        onYes(id);
      }
      if (x.get() < -100) {
        onNo(id);
      }
      setCards((pv) => pv.filter((v) => v.id !== id));
    }
  };

  return (
    <motion.div
      className="h-96 w-72 origin-bottom rounded-lg bg-white object-cover hover:cursor-grab active:cursor-grabbing overflow-clip"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        opacity,
        rotate,
        transition: "0.125s transform",
      }}
      drag={true}
      dragConstraints={{
        left: 0,
        right: 0,
      }}
      onDragEnd={handleDragEnd}
    >
      <CardContent title={title} />
    </motion.div>
  );
};

function CardContent({ title }: { title: string }) {
  return (
    <div className="bg-pippin w-full h-full flex justify-center items-center">
      {title}
    </div>
  );
}

export default SwipeCard;

export type Card = {
  id: number;
  title: string;
};
