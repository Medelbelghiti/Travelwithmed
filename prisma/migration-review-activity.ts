import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Non-destructive schema change for prod:
 * Add activityId to Review + back-relation on Activity.
 */
async function main() {
  const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Review"
    ADD COLUMN IF NOT EXISTS "activityId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Review"
    ADD CONSTRAINT "Review_activityId_fkey"
    FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Review_activityId_idx" ON "Review"("activityId");
  `);

  console.log("Schema updated: Review.activityId added.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
