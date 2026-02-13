
-- Drop existing tables/types if they exist to ensure clean state
DROP TABLE IF EXISTS "DocumentAcknowledgement" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "PDHour" CASCADE;
DROP TABLE IF EXISTS "Registration" CASCADE;
DROP TABLE IF EXISTS "TrainingEvent" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "ObservationDomain" CASCADE;
DROP TABLE IF EXISTS "Observation" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ObservationStatus" CASCADE;
DROP TYPE IF EXISTS "GoalStatus" CASCADE;
DROP TYPE IF EXISTS "TrainingStatus" CASCADE;
DROP TYPE IF EXISTS "AcknowledgementStatus" CASCADE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEADER', 'TEACHER', 'MANAGEMENT', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('IN_PROGRESS', 'NEAR_COMPLETION', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcknowledgementStatus" AS ENUM ('PENDING', 'VIEWED', 'ACKNOWLEDGED', 'SIGNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "campusId" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "observerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "ObservationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "actionStep" TEXT,
    "teacherReflection" TEXT,
    "discussionMet" BOOLEAN NOT NULL DEFAULT false,
    "hasReflection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "detailedReflection" JSONB,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservationDomain" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "evidence" TEXT,

    CONSTRAINT "ObservationDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "isSchoolAligned" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDHour" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PDHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hash" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAcknowledgement" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "AcknowledgementStatus" NOT NULL DEFAULT 'PENDING',
    "viewedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "receiptUrl" TEXT,
    "documentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_userId_key" ON "Registration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAcknowledgement_documentId_teacherId_key" ON "DocumentAcknowledgement"("documentId", "teacherId");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_observerId_fkey" FOREIGN KEY ("observerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationDomain" ADD CONSTRAINT "ObservationDomain_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDHour" ADD CONSTRAINT "PDHour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAcknowledgement" ADD CONSTRAINT "DocumentAcknowledgement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAcknowledgement" ADD CONSTRAINT "DocumentAcknowledgement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed Data
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('1', 'rohit.schoolleader@pdi.com', '$2b$10$zIZssZPGqAhlbBWE7xmmI.E.B0FzuDHVARqugTRUoj5xMKDPiXEbu', 'Rohit', 'LEADER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('2', 'avani.admin@pdi.com', '$2b$10$Z1MCTE.DL5dyXx2alXgoLO1drcU.inCrnrOpuQrOLhiPdVlsy24ra', 'Avani', 'ADMIN', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('3', 'teacher1.btmlayout@pdi.com', '$2b$10$N2NV7OVXBzPT7sRw.BQDK.xsMveiS7QlFdswvkOtaW3153dZRQh9a', 'Teacher One', 'TEACHER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('4', 'teacher2.jpnagar@pdi.com', '$2b$10$ceDcFYRnPGJVCVFfr3UzbOsPsnla5zPYMBNLhoED899lvSZvKaQ5K', 'Teacher Two', 'TEACHER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('5', 'teacher3.itpl@pdi.com', '$2b$10$nNJh3wq/WJF2iKUCDJz5R.Lid3W49fKEtqAGDlq26GPDvimjUoL6u', 'Teacher Three', 'TEACHER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('6', 'teacher@pms.com', '$2b$10$l29nfMXrDWe/WxArhFJKJeJ7LHbWBl.dExAgQElKu1Q9geLpZ2Nsq', 'Teacher', 'TEACHER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('7', 'schoolleader@pms.com', '$2b$10$JlEjIJwbvSHlIhvDBEmlT.n32q8sCKCK5seY86.5y0I5wxhWtAvpS', 'School Leader', 'LEADER', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('8', 'admin@pms.com', '$2b$10$412D2vO4qGBh/8uVaAu/tu1DT8DuN63DeXMxkqGZUAGcAMQOMGwu6', 'Admin', 'ADMIN', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('9', 'management@pms.com', '$2b$10$wseCdew1CjDTGm4GD4JYa.pbvztvZR588.Zy2i1peTrc3Vj7oWOli', 'Management User', 'MANAGEMENT', NOW());
INSERT INTO "User" ("id", "email", "password", "fullName", "role", "updatedAt") VALUES ('10', 'superadmin@pms.com', '$2b$10$WR0ZijUmnoQoHlyVW.g5GOMBSdTvAwUae8cfr9GfKm47OW16QTZS2', 'Super Admin', 'SUPERADMIN', NOW());
