-- AlterTable
ALTER TABLE "AffiliateLink" ADD COLUMN     "dealExpiresAt" TIMESTAMP(3),
ADD COLUMN     "dealTitle" TEXT,
ADD COLUMN     "featuredDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoCode" TEXT;
