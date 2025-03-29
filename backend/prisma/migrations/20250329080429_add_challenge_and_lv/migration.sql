/*
  Warnings:

  - You are about to drop the column `startAt` on the `streak` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `streak` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `streak` table. All the data in the column will be lost.
  - You are about to drop the `course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instructorapplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lesson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournamentresult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `streak` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `streak_start_at` to the `streak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `streak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `streak` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "course" DROP CONSTRAINT "course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "forum" DROP CONSTRAINT "forum_courseId_fkey";

-- DropForeignKey
ALTER TABLE "forum" DROP CONSTRAINT "forum_userId_fkey";

-- DropForeignKey
ALTER TABLE "instructorapplication" DROP CONSTRAINT "instructorapplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_courseId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "rank" DROP CONSTRAINT "rank_userId_fkey";

-- DropForeignKey
ALTER TABLE "review" DROP CONSTRAINT "review_courseId_fkey";

-- DropForeignKey
ALTER TABLE "review" DROP CONSTRAINT "review_userId_fkey";

-- DropForeignKey
ALTER TABLE "streak" DROP CONSTRAINT "streak_userId_fkey";

-- DropForeignKey
ALTER TABLE "tournamentresult" DROP CONSTRAINT "tournamentresult_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "tournamentresult" DROP CONSTRAINT "tournamentresult_userId_fkey";

-- DropIndex
DROP INDEX "streak_userId_key";

-- AlterTable
ALTER TABLE "streak" DROP COLUMN "startAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "streak_reset_at" TIMESTAMP(3),
ADD COLUMN     "streak_start_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "count" SET DEFAULT 0;

-- DropTable
DROP TABLE "course";

-- DropTable
DROP TABLE "enrollment";

-- DropTable
DROP TABLE "forum";

-- DropTable
DROP TABLE "instructorapplication";

-- DropTable
DROP TABLE "lesson";

-- DropTable
DROP TABLE "message";

-- DropTable
DROP TABLE "payment";

-- DropTable
DROP TABLE "rank";

-- DropTable
DROP TABLE "review";

-- DropTable
DROP TABLE "tournament";

-- DropTable
DROP TABLE "tournamentresult";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT,
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "organizer" TEXT NOT NULL,
    "prize_pool" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_results" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "placement" INTEGER NOT NULL,
    "team_name" TEXT,
    "prize_earned" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_text" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "challenge_type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "completion_criteria" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "points_earned" INTEGER,
    "xp_earned" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "criteria" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" SERIAL NOT NULL,
    "level_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "min_xp" INTEGER NOT NULL,
    "max_xp" INTEGER NOT NULL,
    "rewards" TEXT,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_level" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "min_points" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_seasons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rank_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rank" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rank_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_rank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_course_id_key" ON "reviews"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenges_user_id_challenge_id_key" ON "user_challenges"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "levels_level_number_key" ON "levels"("level_number");

-- CreateIndex
CREATE UNIQUE INDEX "levels_min_xp_key" ON "levels"("min_xp");

-- CreateIndex
CREATE UNIQUE INDEX "levels_max_xp_key" ON "levels"("max_xp");

-- CreateIndex
CREATE UNIQUE INDEX "user_level_user_id_key" ON "user_level"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_name_key" ON "ranks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_min_points_key" ON "ranks"("min_points");

-- CreateIndex
CREATE UNIQUE INDEX "user_rank_user_id_season_id_key" ON "user_rank"("user_id", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "streak_user_id_key" ON "streak"("user_id");

-- AddForeignKey
ALTER TABLE "streak" ADD CONSTRAINT "streak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_level" ADD CONSTRAINT "user_level_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_level" ADD CONSTRAINT "user_level_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "rank_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rank" ADD CONSTRAINT "user_rank_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rank" ADD CONSTRAINT "user_rank_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rank" ADD CONSTRAINT "user_rank_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "rank_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
