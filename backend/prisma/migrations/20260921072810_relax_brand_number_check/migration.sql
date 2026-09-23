-- Bookends Hospitality (the parent portal) is seeded as Brand.number = 0,
-- since it isn't one of the four numbered brand cards. Relax the check to
-- allow that instead of requiring a strictly positive number.
ALTER TABLE "Brand" DROP CONSTRAINT "brand_number_positive";
ALTER TABLE "Brand" ADD CONSTRAINT "brand_number_nonneg" CHECK ("number" >= 0);
