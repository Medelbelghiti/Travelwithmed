-- CreateTable
CREATE TABLE "EsimProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "pros" JSONB,
    "cons" JSONB,
    "affiliateLinkId" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsimProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsimPlan" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COUNTRY',
    "coverage" TEXT,
    "dataAmount" TEXT,
    "validity" TEXT,
    "price" TEXT,
    "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "supports5g" BOOLEAN NOT NULL DEFAULT false,
    "hotspot" BOOLEAN NOT NULL DEFAULT false,
    "bestFor" TEXT,
    "affiliateLinkId" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsimPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EsimProvider_name_key" ON "EsimProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EsimProvider_slug_key" ON "EsimProvider"("slug");

-- CreateIndex
CREATE INDEX "EsimProvider_isActive_idx" ON "EsimProvider"("isActive");

-- CreateIndex
CREATE INDEX "EsimProvider_sortOrder_idx" ON "EsimProvider"("sortOrder");

-- CreateIndex
CREATE INDEX "EsimPlan_providerId_idx" ON "EsimPlan"("providerId");

-- CreateIndex
CREATE INDEX "EsimPlan_type_idx" ON "EsimPlan"("type");

-- CreateIndex
CREATE INDEX "EsimPlan_isActive_idx" ON "EsimPlan"("isActive");

-- AddForeignKey
ALTER TABLE "EsimProvider" ADD CONSTRAINT "EsimProvider_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsimPlan" ADD CONSTRAINT "EsimPlan_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EsimProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsimPlan" ADD CONSTRAINT "EsimPlan_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
