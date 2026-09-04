-- AlterTable: add editor-supplied detail fields to Activity
ALTER TABLE "Activity" ADD COLUMN     "location" TEXT,
ADD COLUMN     "included" JSONB,
ADD COLUMN     "notIncluded" JSONB,
ADD COLUMN     "importantInfo" JSONB;
