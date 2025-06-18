/*
  Warnings:

  - You are about to drop the column `file_id` on the `Version` table. All the data in the column will be lost.
  - Added the required column `resourceId` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" DROP COLUMN "file_id",
ADD COLUMN     "resourceId" TEXT NOT NULL;
