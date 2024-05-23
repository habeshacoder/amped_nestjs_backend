/*
  Warnings:

  - The values [HateSpeach,Descrimination] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('HateSpeech', 'GenderViolation', 'InappropriateAgeRange', 'Stereotype', 'Discrimination', 'Unspecified');
ALTER TABLE "reports" ALTER COLUMN "report_type" DROP DEFAULT;
ALTER TABLE "reports" ALTER COLUMN "report_type" TYPE "ReportType_new" USING ("report_type"::text::"ReportType_new");
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "ReportType_old";
ALTER TABLE "reports" ALTER COLUMN "report_type" SET DEFAULT 'Unspecified';
COMMIT;
