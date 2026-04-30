import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SecondOpinion } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.managerResponse !== undefined) data.managerResponse = body.managerResponse;
  if (body.delegatedTo !== undefined) data.delegatedTo = body.delegatedTo;
  if (body.delegatedBy !== undefined) data.delegatedBy = body.delegatedBy;
  if (body.includedPeople !== undefined) data.includedPeople = body.includedPeople;
  if (body.status === "closed") {
    data.closedAt = new Date();
    data.closedBy = body.closedBy ?? null;
  }
  if (body.status === "open") {
    data.closedAt = null;
    data.closedBy = null;
  }

  // Merge a single second opinion by author
  if (body.secondOpinion) {
    const { author, body: opinionBody } = body.secondOpinion as { author: string; body: string };
    const existing = await prisma.item.findUnique({ where: { id }, select: { secondOpinions: true } });
    let opinions: SecondOpinion[] = [];
    if (existing?.secondOpinions) {
      try { opinions = JSON.parse(existing.secondOpinions); } catch { opinions = []; }
    }
    const idx = opinions.findIndex((o) => o.author === author);
    const entry: SecondOpinion = { author, body: opinionBody, updatedAt: new Date().toISOString() };
    if (idx >= 0) opinions[idx] = entry;
    else opinions.push(entry);
    data.secondOpinions = JSON.stringify(opinions);
  }

  const item = await prisma.item.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.item.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
