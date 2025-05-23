/*
  Warnings:

  - Added the required column `file_id` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "file_id" INTEGER NOT NULL;
