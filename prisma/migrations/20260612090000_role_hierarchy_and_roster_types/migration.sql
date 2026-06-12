-- Role hierarchy: ADMIN/CONSULTANT_EDITOR/SHO_EDITOR →
-- SUPER_ADMIN / HOSPITAL_ADMIN / DEPARTMENT_ADMIN / ROSTER_ADMIN.
-- Existing users are remapped (ADMIN→SUPER_ADMIN, CONSULTANT_EDITOR→DEPARTMENT_ADMIN,
-- SHO_EDITOR→ROSTER_ADMIN) and their scopes backfilled from unitId.

-- More roster layers: a "roster type" is a DutyConfig row per unit+layer.
ALTER TYPE "RosterLayer" ADD VALUE IF NOT EXISTS 'HO';
ALTER TYPE "RosterLayer" ADD VALUE IF NOT EXISTS 'MO';
ALTER TYPE "RosterLayer" ADD VALUE IF NOT EXISTS 'NURSE';

-- New Role enum with value remapping
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN', 'ROSTER_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'ADMIN' THEN 'SUPER_ADMIN'
      WHEN 'CONSULTANT_EDITOR' THEN 'DEPARTMENT_ADMIN'
      WHEN 'SHO_EDITOR' THEN 'ROSTER_ADMIN'
      ELSE 'ROSTER_ADMIN'
    END
  )::"Role_new";
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- Scope columns on User
ALTER TABLE "User" ADD COLUMN "hospitalId" TEXT;
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "User" ADD COLUMN "rosterLayers" "RosterLayer"[] NOT NULL DEFAULT ARRAY[]::"RosterLayer"[];
ALTER TABLE "User" ADD COLUMN "staffId" TEXT;

ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill scopes from the single-unit world:
-- ex-consultant-editors become admins of their unit's department,
-- ex-SHO-editors stay unit-scoped and run the SHO roster.
UPDATE "User" u SET "departmentId" = un."departmentId", "unitId" = NULL
  FROM "Unit" un
  WHERE u."unitId" = un."id" AND u."role" = 'DEPARTMENT_ADMIN';
UPDATE "User" SET "rosterLayers" = ARRAY['SHO']::"RosterLayer"[] WHERE "role" = 'ROSTER_ADMIN';
