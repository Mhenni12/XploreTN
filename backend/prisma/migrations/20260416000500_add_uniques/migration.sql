/*
  Warnings:

  - A unique constraint covering the columns `[title,creatorId]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,city]` on the table `Place` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Activity_title_creatorId_key" ON "Activity"("title", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_city_key" ON "Place"("name", "city");
