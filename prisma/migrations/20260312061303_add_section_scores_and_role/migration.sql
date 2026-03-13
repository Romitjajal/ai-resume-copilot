-- AlterTable
ALTER TABLE "ResumeScan" ADD COLUMN     "detectedRole" TEXT,
ADD COLUMN     "educationScore" INTEGER,
ADD COLUMN     "experienceScore" INTEGER,
ADD COLUMN     "projectsScore" INTEGER,
ADD COLUMN     "skillsScore" INTEGER,
ADD COLUMN     "summaryScore" INTEGER;
