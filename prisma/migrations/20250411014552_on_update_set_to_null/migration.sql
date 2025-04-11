-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "bills_client_id_fkey";

-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "fk_bills_user_email";

-- DropForeignKey
ALTER TABLE "cash_registers" DROP CONSTRAINT "cash_registers_bill_id_fkey";

-- DropForeignKey
ALTER TABLE "cash_registers" DROP CONSTRAINT "cash_registers_client_id_fkey";

-- DropForeignKey
ALTER TABLE "cash_registers" DROP CONSTRAINT "cash_registers_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "cash_registers" DROP CONSTRAINT "fk_cash_registers_user_email";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "fk_clients_user_email";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "fk_vendors_user_email";

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "fk_vendors_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "fk_clients_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "fk_bills_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "fk_cash_registers_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE SET NULL;
