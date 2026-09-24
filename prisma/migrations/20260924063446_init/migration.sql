-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'BARTENDER', 'WAITER', 'INVENTORY_MANAGER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PAID', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PESAPAL', 'CASH', 'CARD');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'PAYMENT', 'INVENTORY', 'SYSTEM');

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CASHIER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "approvedById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "reorderAt" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tableId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "pesapalOrderId" TEXT,
    "merchantRef" TEXT,
    "confirmationRef" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PesapalTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantRef" TEXT NOT NULL,
    "pesapalOrderId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "callbackPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesapalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "tableId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "pesapalTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cashTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cardTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "initialAdminId" TEXT NOT NULL,
    "venueName" TEXT NOT NULL DEFAULT 'Singapore Club',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openingCash" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDrawer" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "countedBy" TEXT NOT NULL,
    "expected" DECIMAL(12,3) NOT NULL,
    "counted" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDiscount" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTax" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrinterConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PrinterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DataRetention" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "provider" TEXT NOT NULL,
    "cursor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginPolicy" (
    "id" TEXT NOT NULL,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "LoginPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "currency" TEXT NOT NULL DEFAULT 'KES',

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,

    CONSTRAINT "BusinessDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "expected" DECIMAL(12,2) NOT NULL,
    "received" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderAlerts" BOOLEAN NOT NULL DEFAULT true,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "inventoryAlerts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalReference" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,

    CONSTRAINT "ExternalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRetentionPolicy" (
    "id" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 365,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRate" (
    "id" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRole" "Role",
    "toRole" "Role" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotice" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncFailure" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "clerkUserId" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiHealthMetric" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiHealthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCorrection" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "correctedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueMessage" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIndexState" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndexState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataVersion" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureUsage" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionDevice" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetAudit" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminBootstrap" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "configuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "configuredBy" TEXT,

    CONSTRAINT "AdminBootstrap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,

    CONSTRAINT "RolePermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAccessLog" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "configured" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationRecord" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseNote" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCredit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "threshold" DECIMAL(12,3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReversal" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReversal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSecret" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPresence" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',

    CONSTRAINT "UserPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDelivery" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryLog" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "query" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRowError" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "ImportRowError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportRow" (
    "id" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ExportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "name" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "name" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "locale" TEXT NOT NULL DEFAULT 'en-KE',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "type" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationHealth" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "details" JSONB,

    CONSTRAINT "IntegrationHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "emailedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileMoneyAccount" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MobileMoneyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReorderRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReorderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "requestedRole" "Role" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "orders" INTEGER NOT NULL,

    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT,
    "callbackUrl" TEXT,

    CONSTRAINT "PaymentProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPurgeLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "deletedCount" INTEGER NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataPurgeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronLock" (
    "name" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "CronLock_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "OutgoingEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutgoingEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceToken" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ServiceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiTarget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KpiTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionedSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionedSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiConsumer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiConsumer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiConsumerScope" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,

    CONSTRAINT "ApiConsumerScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSyncRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "DataSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSyncItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "DataSyncItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerConsent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "event" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditExport" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseHealth" (
    "id" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,

    CONSTRAINT "DatabaseHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "period" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleHistory" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "UserRoleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAvailability" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerId" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EventReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableLayout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MenuVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuVersionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReceiptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxConfiguration" (
    "id" TEXT NOT NULL,
    "inclusive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentStatusHistory" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fromStatus" "PaymentStatus",
    "toStatus" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stocktake" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Stocktake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StocktakeItem" (
    "id" TEXT NOT NULL,
    "stocktakeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expected" DECIMAL(12,3) NOT NULL,
    "counted" DECIMAL(65,30),

    CONSTRAINT "StocktakeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLocationStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT "ProductLocationStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PaymentProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationBatch" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReconciliationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookRetry" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookRetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLink" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTerminalTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "terminalRef" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTerminalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFee" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PaymentFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReorderThreshold" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "threshold" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "ReorderThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiEndpoint" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturePermission" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeaturePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeatureOverride" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "UserFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "properties" JSONB,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelStep" (
    "id" TEXT NOT NULL,
    "funnel" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataWarehouseSync" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DataWarehouseSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataWarehouseRecord" (
    "id" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "DataWarehouseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleNotificationSetting" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationCursor" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "UserNotificationCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DataQualityRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EnvironmentConfig" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EnvironmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentRecord" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseDeployment" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,

    CONSTRAINT "ReleaseDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsNote" (
    "id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationsNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChecklist" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "dueAt" TIMESTAMP(3),

    CONSTRAINT "SystemTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSurvey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SystemSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppAnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAudit" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerApproval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleCatalog" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RoleCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseMigrationLock" (
    "id" TEXT NOT NULL,
    "lockName" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3),

    CONSTRAINT "DatabaseMigrationLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedStatus" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SeedStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppInstall" (
    "id" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,

    CONSTRAINT "AppInstall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesaPalConfig" (
    "id" TEXT NOT NULL,
    "consumerKeyEnv" TEXT NOT NULL DEFAULT 'PESAPAL_CONSUMER_KEY',
    "consumerSecretEnv" TEXT NOT NULL DEFAULT 'PESAPAL_CONSUMER_SECRET',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesaPalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesaPalCallback" (
    "id" TEXT NOT NULL,
    "orderTrackingId" TEXT NOT NULL,
    "orderNotificationId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesaPalCallback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesaPalIpn" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PesaPalIpn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettlement" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "settledAmount" DECIMAL(12,2) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PaymentSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiError" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTrace" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAudit" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileDevice" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleExecution" (
    "id" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleRequest" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSequence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptSequence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReceiptSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSequence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaymentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataArchive" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedRecord" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestoreRequest" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestoreRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLineage" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "DataLineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaMigration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrismaMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_clerkUserId_key" ON "StaffProfile"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_email_key" ON "StaffProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RoleGrant_userId_role_key" ON "RoleGrant"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VenueTable_name_key" ON "VenueTable"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_pesapalOrderId_key" ON "Payment"("pesapalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantRef_key" ON "Payment"("merchantRef");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PesapalTransaction_merchantRef_key" ON "PesapalTransaction"("merchantRef");

-- CreateIndex
CREATE UNIQUE INDEX "PesapalTransaction_pesapalOrderId_key" ON "PesapalTransaction"("pesapalOrderId");

-- CreateIndex
CREATE INDEX "PesapalTransaction_status_createdAt_idx" ON "PesapalTransaction"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Reservation_tableId_startsAt_endsAt_idx" ON "Reservation"("tableId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_day_key" ON "DailySummary"("day");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalId_key" ON "WebhookEvent"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_initialAdminId_key" ON "AppConfig"("initialAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_orderId_key" ON "CustomerOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CashDrawer_shiftId_key" ON "CashDrawer"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemHealth_service_key" ON "SystemHealth"("service");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRule_name_key" ON "TaxRule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRule_name_key" ON "DiscountRule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetention_entity_key" ON "DataRetention"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "HealthCheck_name_key" ON "HealthCheck"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_key" ON "Venue"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDay_date_key" ON "BusinessDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReference_provider_externalId_key" ON "ExternalReference"("provider", "externalId");

-- CreateIndex
CREATE INDEX "RateLimitEvent_key_createdAt_idx" ON "RateLimitEvent"("key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_provider_eventId_key" ON "WebhookDelivery"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_base_quote_key" ON "CurrencyRate"("base", "quote");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_orderId_key" ON "Receipt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_number_key" ON "Receipt"("number");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidget_userId_widgetKey_key" ON "DashboardWidget"("userId", "widgetKey");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_clerkUserId_key" ON "OnboardingState"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_version_key" ON "AppVersion"("version");

-- CreateIndex
CREATE INDEX "ApiRequestLog_path_createdAt_idx" ON "ApiRequestLog"("path", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_type_version_key" ON "LegalDocument"("type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_clerkUserId_key" ON "TeamMember"("teamId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIndexState_resource_key" ON "SearchIndexState"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "DataVersion_entity_entityId_version_key" ON "DataVersion"("entity", "entityId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDevice_clerkUserId_fingerprint_key" ON "SessionDevice"("clerkUserId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "AdminBootstrap_clerkUserId_key" ON "AdminBootstrap"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissionOverride_userId_permissionId_key" ON "RolePermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_provider_key" ON "IntegrationCredential"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationRecord_name_key" ON "MigrationRecord"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_paymentId_attemptNo_key" ON "PaymentAttempt"("paymentId", "attemptNo");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSecret_provider_key" ON "WebhookSecret"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserPresence_clerkUserId_key" ON "UserPresence"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_clerkUserId_key" ON "UserPreference"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationHealth_provider_key" ON "IntegrationHealth"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSnapshot_period_key" ON "RevenueSnapshot"("period");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProviderConfig_provider_key" ON "PaymentProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "AppMetric_name_recordedAt_idx" ON "AppMetric"("name", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceToken_service_key" ON "ServiceToken"("service");

-- CreateIndex
CREATE UNIQUE INDEX "KpiTarget_name_key" ON "KpiTarget"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshot_kpi_period_key" ON "KpiSnapshot"("kpi", "period");

-- CreateIndex
CREATE UNIQUE INDEX "VersionedSetting_key_version_key" ON "VersionedSetting"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ApiConsumerScope_consumerId_scope_key" ON "ApiConsumerScope"("consumerId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsage_key_period_key" ON "ApiUsage"("key", "period");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_productId_key" ON "SupplierProduct"("supplierId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_name_key" ON "InventoryLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocationStock_productId_locationId_key" ON "ProductLocationStock"("productId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProviderEvent_provider_eventId_key" ON "PaymentProviderEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ReorderThreshold_productId_key" ON "ReorderThreshold"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJob_name_key" ON "ScheduledJob"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApiEndpoint_path_key" ON "ApiEndpoint"("path");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturePermission_feature_role_key" ON "FeaturePermission"("feature", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureOverride_clerkUserId_feature_key" ON "UserFeatureOverride"("clerkUserId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "RoleNotificationSetting_role_type_key" ON "RoleNotificationSetting"("role", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationCursor_clerkUserId_key" ON "UserNotificationCursor"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentConfig_environment_key" ON "EnvironmentConfig"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentRecord_deploymentId_key" ON "DeploymentRecord"("deploymentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppAnnouncementRead_announcementId_clerkUserId_key" ON "AppAnnouncementRead"("announcementId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleCatalog_role_key" ON "RoleCatalog"("role");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseMigrationLock_lockName_key" ON "DatabaseMigrationLock"("lockName");

-- CreateIndex
CREATE UNIQUE INDEX "SeedStatus_key_key" ON "SeedStatus"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PesaPalIpn_notificationId_key" ON "PesaPalIpn"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestTrace_traceId_key" ON "RequestTrace"("traceId");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseConnection_name_key" ON "DatabaseConnection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeConfig_key_key" ON "RuntimeConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_clerkUserId_role_key" ON "RoleAssignment"("clerkUserId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "MobileDevice_clerkUserId_deviceId_key" ON "MobileDevice"("clerkUserId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DataPolicy_name_key" ON "DataPolicy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AccessPolicy_name_key" ON "AccessPolicy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_key_key" ON "NotificationTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRule_key_key" ON "BusinessRule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSequence_date_key" ON "OrderSequence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSequence_date_key" ON "ReceiptSequence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSequence_date_key" ON "PaymentSequence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_entity_field_key" ON "FieldDefinition"("entity", "field");

-- CreateIndex
CREATE UNIQUE INDEX "SchemaVersion_version_key" ON "SchemaVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaMigration_name_key" ON "PrismaMigration"("name");

-- AddForeignKey
ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "VenueTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
