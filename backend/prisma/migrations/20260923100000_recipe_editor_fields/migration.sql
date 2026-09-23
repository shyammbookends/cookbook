-- Fields for the split-screen Recipe/SOP editor. Additive only; existing rows untouched.
ALTER TABLE "Recipe" ADD COLUMN "station" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "sopVersion" TEXT,
ADD COLUMN "qualityCheck" TEXT[] DEFAULT ARRAY[]::TEXT[];
