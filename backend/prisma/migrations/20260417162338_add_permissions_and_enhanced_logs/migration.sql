-- CreateEnum
CREATE TYPE "PermissionModule" AS ENUM ('USERS', 'ORDERS', 'TRYON', 'PHOTOS', 'ADMINS', 'CONFIGS', 'ANNOUNCEMENTS', 'LOGS');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OperationType" ADD VALUE 'CREATE_ADMIN';
ALTER TYPE "OperationType" ADD VALUE 'UPDATE_ADMIN';
ALTER TYPE "OperationType" ADD VALUE 'DELETE_ADMIN';
ALTER TYPE "OperationType" ADD VALUE 'CREATE_PERMISSION';
ALTER TYPE "OperationType" ADD VALUE 'UPDATE_PERMISSION';
ALTER TYPE "OperationType" ADD VALUE 'DELETE_PERMISSION';

-- AlterTable
ALTER TABLE "OperationLog" ADD COLUMN     "afterData" TEXT,
ADD COLUMN     "beforeData" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "module" TEXT;

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "module" "PermissionModule" NOT NULL,
    "actions" "PermissionAction"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPermission_adminId_idx" ON "AdminPermission"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_module_key" ON "AdminPermission"("adminId", "module");

-- CreateIndex
CREATE INDEX "OperationLog_module_idx" ON "OperationLog"("module");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
