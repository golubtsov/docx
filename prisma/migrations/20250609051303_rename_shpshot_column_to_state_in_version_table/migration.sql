/*
  Warnings:

  - You are about to drop the column `snapshot` on the `Version` table. All the data in the column will be lost.
  - Added the required column `state` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" DROP COLUMN "snapshot",
ADD COLUMN     "state" TEXT NOT NULL;
