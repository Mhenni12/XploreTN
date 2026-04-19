-- CreateTable
CREATE TABLE "ActivityReservation" (
    "id" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "touristId" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityReservation_activityId_idx" ON "ActivityReservation"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReservation_touristId_idx" ON "ActivityReservation"("touristId");

-- CreateIndex
CREATE INDEX "ActivityReservation_status_idx" ON "ActivityReservation"("status");

-- AddForeignKey
ALTER TABLE "ActivityReservation" ADD CONSTRAINT "ActivityReservation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReservation" ADD CONSTRAINT "ActivityReservation_touristId_fkey" FOREIGN KEY ("touristId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
