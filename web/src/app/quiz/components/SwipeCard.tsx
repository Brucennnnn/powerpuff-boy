"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { cn } from "@web/lib/utils";

const SwipeCard = ({
  id,
  title,
  setCards,
  onYes,
  onNo,
}: {
  id: number;
  title: string;
  setCards: Dispatch<SetStateAction<Card[]>>;
  onYes: (id: number) => void;
  onNo: (id: number) => void;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [yes, setYes] = useState(false);
  const [no, setNo] = useState(false);

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
  const handleDrag = () => {
    if (x.get() > 30) {
      setYes(true);
    }
    if (x.get() < -30) {
      setNo(true);
    }
    if (Math.abs(y.get()) > 80) {
      y.set(0);
    }
  };

  setInterval(() => {
    if (-30 <= x.get() && x.get() <= 30) {
      setYes(false);
      setNo(false);
    }
    y.set(0);
    x.set(0);
  }, 500);

  return (
    <motion.div
      className="h-96 w-72 origin-bottom rounded-lg bg-white object-cover hover:cursor-grab active:cursor-grabbing overflow-clip"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        y,
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
      onDrag={handleDrag}
    >
      <CardContent title={title} yes={yes} no={no} />
    </motion.div>
  );
};

function CardContent({
  title,
  yes,
  no,
}: {
  title: string;
  yes: boolean;
  no: boolean;
}) {
  return (
    <div className="bg-pippin w-full h-full flex justify-center items-center relative">
      <Image
        alt="yes"
        src="/yes.svg"
        className={cn(
          "absolute bottom-16 right-16 transition-opacity ",
          yes ? `opacity-100` : `opacity-0`,
        )}
        width={50}
        height={50}
      />
      <Image
        alt="no"
        src="/no.svg"
        className={cn(
          "absolute bottom-16 left-16 transition-opacity",
          no ? `opacity-100` : `opacity-0`,
        )}
        width={50}
        height={50}
      />
      {title}
    </div>
  );
}

export default SwipeCard;

export type Card = {
  id: number;
  title: string;
};
