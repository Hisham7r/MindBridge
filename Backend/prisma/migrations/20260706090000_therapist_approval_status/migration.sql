-- CreateEnum
CREATE TYPE "TherapistStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
-- Admin review lifecycle for therapist profiles.
ALTER TABLE "therapists" ADD COLUMN     "status" "TherapistStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- Data-fix: therapists that are already live (seeded / previously completed)
-- are grandfathered in as APPROVED so they stay listed without admin action.
UPDATE "therapists" SET "status" = 'APPROVED' WHERE "isActive" = true;
