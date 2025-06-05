/*
  Warnings:

  - Added the required column `name` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "name" TEXT NOT NULL;
