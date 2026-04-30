export type ItemType = "approval" | "question" | "design";
export type Priority = "urgent" | "high" | "normal" | "low";
export type Status = "open" | "inprogress" | "decided" | "closed";
export type TeamMember = "jake" | "arsh" | "ioana";
export type Manager = "lorena" | "eyal";
export type Person = TeamMember | Manager;

export const ALL_PEOPLE: { id: Person; label: string }[] = [
  { id: "lorena", label: "Lorena" },
  { id: "eyal", label: "Eyal" },
  { id: "jake", label: "Jake" },
  { id: "arsh", label: "Arsh" },
  { id: "ioana", label: "Ioana" },
];

export const TEAM_MEMBERS: TeamMember[] = ["jake", "arsh", "ioana"];
export const MANAGERS: Manager[] = ["lorena", "eyal"];

export interface Item {
  id: string;
  title: string;
  type: ItemType;
  priority: Priority;
  context: string;
  additionalInfo: string | null;
  submittedBy: TeamMember;
  submittedAt: string;
  status: Status;
  managerResponse: string | null;
  closedAt: string | null;
  closedBy: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  delegatedTo: string | null;
  delegatedBy: string | null;
  includedPeople: string | null;
  secondOpinions: string | null;
  assignedManager: Manager;
}

export interface SecondOpinion {
  author: string;
  body: string;
  updatedAt: string;
}

export interface CreateItemInput {
  title: string;
  type: ItemType;
  priority: Priority;
  context: string;
  additionalInfo?: string;
  submittedBy: TeamMember;
  attachmentUrl?: string;
  attachmentName?: string;
  assignedManager?: Manager;
}

export interface UpdateItemInput {
  status?: Status;
  managerResponse?: string;
  closedBy?: string;
  delegatedTo?: string | null;
  delegatedBy?: string | null;
  includedPeople?: string | null;
}
