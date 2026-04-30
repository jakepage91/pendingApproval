CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "managerResponse" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "delegatedTo" TEXT,
    "delegatedBy" TEXT,
    "includedPeople" TEXT,
    "secondOpinions" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
