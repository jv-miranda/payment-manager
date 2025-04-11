-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "telephone" VARCHAR(20),
    "cpf" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "belongs_to" TEXT,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "vendor_id" INTEGER,
    "notes" TEXT,
    "telephone" VARCHAR(20),
    "cep" VARCHAR(10),
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT timezone('America/Sao_Paulo'::text, CURRENT_TIMESTAMP),
    "belongs_to" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "notes" TEXT,
    "status" VARCHAR(10) NOT NULL,
    "payment_method" VARCHAR(10) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT timezone('America/Sao_Paulo'::text, CURRENT_TIMESTAMP),
    "belongs_to" TEXT,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "vendor_id" INTEGER,
    "bill_id" INTEGER,
    "date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "bill_value" DECIMAL(10,2) NOT NULL,
    "vendor_day_costs" DECIMAL(10,2) NOT NULL,
    "belongs_to" TEXT,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "unique_telephone_vendors" ON "vendors"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_cpf_key" ON "vendors"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clients_cpf_key" ON "clients"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "unique_telephone_clients" ON "clients"("telephone");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "fk_vendors_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "fk_clients_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "fk_bills_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "fk_cash_registers_user_email" FOREIGN KEY ("belongs_to") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE NO ACTION;
