-- CreateTable
CREATE TABLE "Version" (
    "id" SERIAL NOT NULL,
    "snapshot" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);
