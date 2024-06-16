/*
  Warnings:

  - Added the required column `name` to the `Link` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Link_url_key";

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkCountry" (
    "id" SERIAL NOT NULL,
    "linkId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LinkCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_id_key" ON "Country"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LinkCountry_linkId_countryId_key" ON "LinkCountry"("linkId", "countryId");

-- AddForeignKey
ALTER TABLE "LinkCountry" ADD CONSTRAINT "LinkCountry_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkCountry" ADD CONSTRAINT "LinkCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
