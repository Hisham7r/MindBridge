-- AlterTable
-- Make profile fields nullable so a therapist can self-register with a minimal
-- profile and complete the rest later in Settings. Add licenseNumber.
ALTER TABLE "therapists" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "credentials" DROP NOT NULL,
ALTER COLUMN "about" DROP NOT NULL,
ALTER COLUMN "methodology" DROP NOT NULL,
ALTER COLUMN "feePkr" DROP NOT NULL,
ADD COLUMN     "licenseNumber" TEXT;
