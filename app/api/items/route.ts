import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateItemInput } from "@/lib/types";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body: CreateItemInput = await req.json();

  if (!body.title || !body.context || !body.submittedBy) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: {
      title: body.title,
      type: body.type || "question",
      priority: body.priority || "normal",
      context: body.context,
      additionalInfo: body.additionalInfo ?? null,
      submittedBy: body.submittedBy,
      attachmentUrl: body.attachmentUrl ?? null,
      attachmentName: body.attachmentName ?? null,
      assignedManager: body.assignedManager ?? "lorena",
    },
  });

  return NextResponse.json(item, { status: 201 });
}
