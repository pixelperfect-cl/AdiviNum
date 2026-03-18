-- AlterTable: Change default ELO from 0 to 1000
ALTER TABLE "users" ALTER COLUMN "elo_rating" SET DEFAULT 1000;

-- Data Migration: Update all existing players with ELO 0 to 1000 (base rating)
UPDATE "users" SET "elo_rating" = 1000 WHERE "elo_rating" = 0;
