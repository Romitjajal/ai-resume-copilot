/*
  Warnings:

  - You are about to drop the column `experienceScore` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `keywordScore` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `projectsScore` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `resumeFileName` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `skillsScore` on the `ResumeScan` table. All the data in the column will be lost.
  - You are about to drop the column `structureScore` on the `ResumeScan` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `ResumeScan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `ResumeScan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResumeScan" DROP COLUMN "experienceScore",
DROP COLUMN "keywordScore",
DROP COLUMN "overallScore",
DROP COLUMN "projectsScore",
DROP COLUMN "resumeFileName",
DROP COLUMN "skillsScore",
DROP COLUMN "structureScore",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "score" INTEGER NOT NULL;
