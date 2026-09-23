-- Brand-voice content fields (see prisma/README.md for why this is
-- hand-written rather than `prisma migrate dev` output: the shadow-db diff
-- for this schema also re-triggers the known search/index false-positive
-- documented there, so this migration is scoped to ONLY the new columns).
ALTER TABLE "Brand"
  ADD COLUMN "personality" TEXT,
  ADD COLUMN "moodFeel" TEXT,
  ADD COLUMN "promise" TEXT,
  ADD COLUMN "voiceWords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "sampleLines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
