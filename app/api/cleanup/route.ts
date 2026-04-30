import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.item.deleteMany({
    where: {
      status: "closed",
      closedAt: { lt: twoWeeksAgo },
    },
  });

  return NextResponse.json({ deleted: count });
}
