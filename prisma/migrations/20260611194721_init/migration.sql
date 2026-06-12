-- CreateEnum
CREATE TYPE "StaffKind" AS ENUM ('CONSULTANT', 'SHO', 'RHO', 'HO', 'MO', 'NURSE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT_EDITOR', 'SHO_EDITOR');

-- CreateEnum
CREATE TYPE "RosterLayer" AS ENUM ('CONSULTANT', 'SHO');

-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SWAP', 'PUBLISH', 'REPUBLISH', 'DELETE');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "kind" "StaffKind" NOT NULL,
    "fullName" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "colorKey" TEXT NOT NULL,
    "isSeat" BOOLEAN NOT NULL DEFAULT false,
    "currentHolder" TEXT,
    "activeFrom" TIMESTAMP(3) NOT NULL,
    "activeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyConfig" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "layer" "RosterLayer" NOT NULL,
    "config" JSONB NOT NULL,
    "poolKinds" TEXT[],

    CONSTRAINT "DutyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "layer" "RosterLayer" NOT NULL,
    "month" TEXT NOT NULL,
    "status" "RosterStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "builtAgainstVersion" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutySlot" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "staffId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isCash" BOOLEAN NOT NULL DEFAULT false,
    "isPostCash" BOOLEAN NOT NULL DEFAULT false,
    "isWeekendBlock" BOOLEAN NOT NULL DEFAULT false,
    "secondOnCallId" TEXT,
    "conflictFlag" BOOLEAN NOT NULL DEFAULT false,
    "conflictReason" TEXT,

    CONSTRAINT "DutySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnavailabilityDate" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "from" DATE NOT NULL,
    "to" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "UnavailabilityDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekendRotationState" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "layer" "RosterLayer" NOT NULL,
    "rotationOrder" TEXT[],
    "lastAssignedId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekendRotationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_name_key" ON "Department"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_departmentId_name_key" ON "Unit"("departmentId", "name");

-- CreateIndex
CREATE INDEX "StaffMember_unitId_kind_idx" ON "StaffMember"("unitId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DutyConfig_unitId_layer_key" ON "DutyConfig"("unitId", "layer");

-- CreateIndex
CREATE UNIQUE INDEX "Roster_unitId_layer_month_key" ON "Roster"("unitId", "layer", "month");

-- CreateIndex
CREATE INDEX "DutySlot_staffId_date_idx" ON "DutySlot"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DutySlot_rosterId_date_key" ON "DutySlot"("rosterId", "date");

-- CreateIndex
CREATE INDEX "UnavailabilityDate_staffId_from_to_idx" ON "UnavailabilityDate"("staffId", "from", "to");

-- CreateIndex
CREATE UNIQUE INDEX "WeekendRotationState_unitId_layer_key" ON "WeekendRotationState"("unitId", "layer");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyConfig" ADD CONSTRAINT "DutyConfig_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roster" ADD CONSTRAINT "Roster_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySlot" ADD CONSTRAINT "DutySlot_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySlot" ADD CONSTRAINT "DutySlot_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySlot" ADD CONSTRAINT "DutySlot_secondOnCallId_fkey" FOREIGN KEY ("secondOnCallId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnavailabilityDate" ADD CONSTRAINT "UnavailabilityDate_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekendRotationState" ADD CONSTRAINT "WeekendRotationState_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
