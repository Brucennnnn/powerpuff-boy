-- CreateTable
CREATE TABLE "results" (
    "id" SERIAL NOT NULL,
    "job_title_th" TEXT NOT NULL,
    "job_title_en" TEXT NOT NULL,
    "short_desc" TEXT NOT NULL,
    "job_avatar" TEXT NOT NULL,
    "academy_link" TEXT NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);
