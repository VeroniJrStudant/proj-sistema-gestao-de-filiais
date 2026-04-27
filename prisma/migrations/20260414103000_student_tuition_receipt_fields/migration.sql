-- AlterTable
ALTER TABLE "Student" ADD COLUMN "tuitionDiscountCents" INTEGER;
ALTER TABLE "Student" ADD COLUMN "tuitionMonthlyAmountCents" INTEGER;
ALTER TABLE "Student" ADD COLUMN "didacticMaterialsAmountCents" INTEGER;
ALTER TABLE "Student" ADD COLUMN "tuitionPaymentDate" DATETIME;
ALTER TABLE "Student" ADD COLUMN "tuitionPaymentDetailsJson" TEXT;
