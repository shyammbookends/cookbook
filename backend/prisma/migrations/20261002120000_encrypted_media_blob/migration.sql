-- Encrypted (AES-256-GCM) file storage in PostgreSQL. Additive only: no existing data is touched.
CREATE TABLE "MediaBlob" (
    "key" TEXT NOT NULL,
    "mediaId" TEXT,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "plainBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaBlob_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "MediaBlob_mediaId_idx" ON "MediaBlob"("mediaId");
