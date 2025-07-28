/*
  Warnings:

  - You are about to drop the column `pgAccounts` on the `DBT_PageAccess` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DBT_PageAccess" DROP COLUMN "pgAccounts",
ADD COLUMN     "pgAdmin" BOOLEAN NOT NULL DEFAULT false;
