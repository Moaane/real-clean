-- CreateTable
CREATE TABLE "saved_address" (
    "id_address" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_address_pkey" PRIMARY KEY ("id_address")
);

-- CreateIndex
CREATE INDEX "saved_address_id_user_idx" ON "saved_address"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "saved_address_id_user_address_key" ON "saved_address"("id_user", "address");

-- AddForeignKey
ALTER TABLE "saved_address" ADD CONSTRAINT "saved_address_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
