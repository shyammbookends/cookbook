-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "author" TEXT,
ADD COLUMN     "dishCode" TEXT,
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "holding" TEXT,
ADD COLUMN     "miseEnPlace" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nextReviewDate" TIMESTAMP(3),
ADD COLUMN     "plating" TEXT;
