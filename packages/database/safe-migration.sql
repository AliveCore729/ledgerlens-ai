-- Safe Migration Script
-- Run this directly against the Postgres database BEFORE running `prisma db push` or deploying the new code.

BEGIN;

-- 1. Create the enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add the columns to Organization, defaulting to PENDING
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "activatedBy" TEXT,
ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING';

-- 3. Copy the data from the old Subscription table to the new columns in Organization
-- This ensures no existing ACTIVE orgs are locked out
UPDATE "Organization" o
SET "subscriptionStatus" = 
    CASE 
        WHEN s."status" = 'ACTIVE' THEN 'ACTIVE'::"SubscriptionStatus"
        WHEN s."status" = 'SUSPENDED' THEN 'SUSPENDED'::"SubscriptionStatus"
        ELSE 'PENDING'::"SubscriptionStatus"
    END,
    "subscriptionExpiresAt" = s."currentPeriodEnd"
FROM "Subscription" s
WHERE o.id = s."organizationId";

-- 4. Drop the old table and types safely
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_organizationId_fkey";
DROP TABLE IF EXISTS "Subscription";
DROP TYPE IF EXISTS "Plan";
DROP TYPE IF EXISTS "SubStatus";

COMMIT;
