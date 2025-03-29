/*
  Warnings:

  - You are about to drop the `results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "results";

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "job_title_th" TEXT NOT NULL,
    "job_title_en" TEXT NOT NULL,
    "short_desc" TEXT NOT NULL,
    "job_avatar" TEXT NOT NULL,
    "academy_link" TEXT NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);
