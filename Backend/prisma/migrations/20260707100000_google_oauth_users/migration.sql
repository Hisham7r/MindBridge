-- AlterTable
-- Google OAuth sign-in: password becomes optional (Google-created accounts
-- have none) and users gain a unique googleId (the ID token's `sub` claim).
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL,
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
