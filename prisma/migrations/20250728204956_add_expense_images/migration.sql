-- CreateTable
CREATE TABLE "DBT_ExpenseImages" (
    "ID" SERIAL NOT NULL,
    "ID_Expense" INTEGER NOT NULL,
    "FileName" VARCHAR(255) NOT NULL,
    "FilePath" VARCHAR(500) NOT NULL,
    "FileSize" INTEGER NOT NULL,
    "MimeType" VARCHAR(100) NOT NULL,
    "UploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DBT_ExpenseImages_pkey" PRIMARY KEY ("ID")
);

-- AddForeignKey
ALTER TABLE "DBT_ExpenseImages" ADD CONSTRAINT "DBT_ExpenseImages_ID_Expense_fkey" FOREIGN KEY ("ID_Expense") REFERENCES "DBT_Expenses"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
