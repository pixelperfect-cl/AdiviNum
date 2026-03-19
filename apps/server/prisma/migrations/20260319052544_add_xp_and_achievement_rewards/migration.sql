-- AlterTable
ALTER TABLE "achievements" ADD COLUMN     "reward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;
