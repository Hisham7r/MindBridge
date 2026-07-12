-- CreateTable
-- Recurring weekly working hours per therapist. Bookable AvailabilitySlot rows
-- are generated from these rules on a rolling window; booked slots are never
-- touched by regeneration.
CREATE TABLE "therapist_availability" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "therapist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "therapist_availability_therapistId_dayOfWeek_key" ON "therapist_availability"("therapistId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
