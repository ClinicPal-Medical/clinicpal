-- CreateEnum
CREATE TYPE "NotificationUrgency" AS ENUM ('INFO', 'WARNING', 'URGENT', 'CRITICAL');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "urgency" "NotificationUrgency" NOT NULL DEFAULT 'INFO',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "externalKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_externalKey_key" ON "Notification"("externalKey");

-- CreateIndex
CREATE INDEX "Notification_recipientId_recipientType_idx" ON "Notification"("recipientId", "recipientType");
