import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEED_ITEMS = [
  {
    title: "Approve new vendor contract — AWS Reserved Instances",
    type: "approval",
    priority: "urgent",
    context:
      "We have an opportunity to lock in 1-year reserved instance pricing for our prod cluster. Current on-demand spend is $4,200/month; reserved would drop to ~$2,700/month. Contract needs to be signed by EOW to hit Q2 savings target.",
    additionalInfo:
      "Finance has already signed off on the budget. Legal reviewed the contract last week — no blockers.",
    submittedBy: "jake",
    status: "open",
  },
  {
    title: "Should we move the API docs to Mintlify?",
    type: "question",
    priority: "normal",
    context:
      "We currently use a custom-built docs site that's getting hard to maintain. Mintlify would give us search, versioning, and a much nicer DX for contributors. Monthly cost would be $80.",
    additionalInfo: "Arsh already has a prototype running — took about 4 hours to migrate.",
    submittedBy: "arsh",
    status: "inprogress",
    managerResponse:
      "Love the idea. Let's do a 30-day trial and see if the team adopts it. Arsh, go ahead and set it up. We can decide on the paid plan after we validate.",
  },
  {
    title: "New onboarding flow design — which direction?",
    type: "design",
    priority: "high",
    context:
      "I've mocked up two approaches for the new user onboarding: (A) step-by-step wizard with progress bar, (B) single long-scroll page with anchors. Both test well internally but they serve different mental models.",
    additionalInfo: "Figma link in Notion under 'Onboarding v2'. User research summary attached.",
    submittedBy: "ioana",
    status: "open",
  },
];

export async function POST() {
  const count = await prisma.item.count();
  if (count > 0) {
    return NextResponse.json({ message: "Already seeded" });
  }

  await prisma.item.createMany({ data: SEED_ITEMS });
  return NextResponse.json({ message: "Seeded successfully" });
}
