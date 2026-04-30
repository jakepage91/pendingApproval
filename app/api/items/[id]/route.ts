import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SecondOpinion } from "@/lib/types";
import { Resend } from "resend";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function sendResponseNotification({
  submittedBy,
  managerName,
  itemTitle,
  response,
  itemId,
}: {
  submittedBy: string;
  managerName: string;
  itemTitle: string;
  response: string;
  itemId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const toEmail = `${submittedBy}@metalbear.com`;
  const appUrl = process.env.AUTH_URL ?? "https://approvalpending.vercel.app";

  await resend.emails.send({
    from: "ApprovalPending <noreply@metalbear.com>",
    to: toEmail,
    subject: `${capitalize(managerName)} responded to "${itemTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #fafafd;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #756df3; margin-bottom: 16px;">
          ApprovalPending
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0f0f1a; margin: 0 0 8px;">
          ${capitalize(managerName)} responded to your request
        </h1>
        <p style="font-size: 14px; color: #555; margin: 0 0 24px;">${itemTitle}</p>

        <div style="background: #fff; border: 2px solid #000; border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 0 0 #000; margin-bottom: 28px;">
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-bottom: 10px;">
            ${capitalize(managerName)}&rsquo;s response
          </div>
          <p style="font-size: 15px; color: #0f0f1a; line-height: 1.6; white-space: pre-wrap; margin: 0;">${response}</p>
        </div>

        <a href="${appUrl}/team" style="display: inline-block; padding: 12px 24px; background: #756df3; color: #fff; font-weight: 700; font-size: 14px; border-radius: 8px; text-decoration: none; border: 2px solid #000; box-shadow: 0 3px 0 0 #000;">
          View in ApprovalPending →
        </a>

        <p style="margin-top: 32px; font-size: 11px; color: #bbb;">
          You received this because you submitted a request in ApprovalPending.
        </p>
      </div>
    `,
  });
}

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
  if (body.assignedManager !== undefined) data.assignedManager = body.assignedManager;
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

  // Fetch the item before update to check if response is new/changed
  const before = await prisma.item.findUnique({ where: { id } });
  const item = await prisma.item.update({ where: { id }, data });

  // Send email notification if a manager response was just saved (new or updated)
  if (
    body.managerResponse &&
    body.managerResponse !== before?.managerResponse &&
    before?.submittedBy
  ) {
    sendResponseNotification({
      submittedBy: before.submittedBy,
      managerName: body.closedBy ?? item.closedBy ?? item.assignedManager ?? "lorena",
      itemTitle: item.title,
      response: body.managerResponse,
      itemId: id,
    }).catch(() => {}); // fire-and-forget, don't block the response
  }

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
