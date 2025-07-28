-- Migration to rename pgAccounts to pgAdmin
-- Step 1: Add the new column
ALTER TABLE "DBT_PageAccess" ADD COLUMN "pgAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Copy data from pgAccounts to pgAdmin  
UPDATE "DBT_PageAccess" SET "pgAdmin" = "pgAccounts";

-- Step 3: Drop the old column
ALTER TABLE "DBT_PageAccess" DROP COLUMN "pgAccounts";