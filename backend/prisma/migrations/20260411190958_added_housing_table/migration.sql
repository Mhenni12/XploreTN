-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('APARTMENT', 'VILLA', 'STUDIO', 'TRADITIONAL_HOUSE', 'FARM_STAY', 'GUESTHOUSE', 'RIAD', 'CHALET');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "image" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Housing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "HousingType" NOT NULL,
    "floors" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL,
    "familyMembers" INTEGER NOT NULL,
    "maxTourists" INTEGER NOT NULL,
    "maxStayDays" INTEGER NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Housing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Housing" ADD CONSTRAINT "Housing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
