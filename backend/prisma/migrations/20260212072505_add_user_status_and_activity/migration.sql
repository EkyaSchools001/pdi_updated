-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActive" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active';
