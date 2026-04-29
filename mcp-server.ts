#!/usr/bin/env node
/**
 * pendingApproval MCP Server
 *
 * Connects Claude Desktop directly to the SQLite DB so managers can
 * triage open requests without opening the browser.
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *
 *   {
 *     "mcpServers": {
 *       "pendingApproval": {
 *         "command": "npx",
 *         "args": ["ts-node", "/path/to/pendingApproval/mcp-server.ts"],
 *         "env": { "DB_PATH": "/path/to/pendingApproval/dev.db" }
 *       }
 *     }
 *   }
 *
 * Or if you prefer to compile first:
 *   npx tsc mcp-server.ts --outDir dist --module commonjs --target es2020 --esModuleInterop
 *   then use "node /path/to/pendingApproval/dist/mcp-server.js"
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, "dev.db");
const db = new Database(DB_PATH);

const server = new Server(
  { name: "pendingApproval", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── helpers ─────────────────────────────────────────────────────────────────

function formatItem(row: Record<string, unknown>) {
  return [
    `ID: ${row.id}`,
    `Title: ${row.title}`,
    `Type: ${row.type}  Priority: ${row.priority}  Status: ${row.status}`,
    `From: ${row.submittedBy}  At: ${row.submittedAt}`,
    row.delegatedTo ? `Delegated to: ${row.delegatedTo} (by ${row.delegatedBy})` : null,
    row.includedPeople ? `Included: ${row.includedPeople}` : null,
    `Context: ${row.context}`,
    row.additionalInfo ? `Additional info: ${row.additionalInfo}` : null,
    row.managerResponse ? `Manager response: ${row.managerResponse}` : null,
    row.secondOpinions ? `Second opinions: ${row.secondOpinions}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── tool definitions ─────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_items",
      description: "List approval/decision items, optionally filtered by status.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "inprogress", "decided", "closed", "all"],
            description: "Filter by status. Default: open",
          },
        },
      },
    },
    {
      name: "get_item",
      description: "Get the full detail of a single item by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Item ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "save_response",
      description: "Save a manager response to an item.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Item ID" },
          response: { type: "string", description: "The response text" },
        },
        required: ["id", "response"],
      },
    },
    {
      name: "set_status",
      description: "Update the status of an item (open / inprogress / decided / closed).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Item ID" },
          status: {
            type: "string",
            enum: ["open", "inprogress", "decided", "closed"],
          },
          closed_by: {
            type: "string",
            description: "Manager name — required when status is 'closed'",
          },
        },
        required: ["id", "status"],
      },
    },
    {
      name: "delegate",
      description: "Delegate an item to another person.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Item ID" },
          delegate_to: { type: "string", description: "Person to delegate to" },
          delegate_by: { type: "string", description: "Manager doing the delegation" },
        },
        required: ["id", "delegate_to", "delegate_by"],
      },
    },
  ],
}));

// ── tool handlers ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, string>;

  if (name === "list_items") {
    const status = a.status && a.status !== "all" ? a.status : null;
    const rows = status
      ? db.prepare("SELECT * FROM Item WHERE status = ? ORDER BY submittedAt DESC").all(status)
      : db.prepare("SELECT * FROM Item ORDER BY submittedAt DESC").all();
    const list = (rows as Record<string, unknown>[]);
    if (list.length === 0) {
      return { content: [{ type: "text", text: "No items found." }] };
    }
    const text = list.map((r) => formatItem(r)).join("\n\n---\n\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "get_item") {
    const row = db.prepare("SELECT * FROM Item WHERE id = ?").get(a.id) as Record<string, unknown> | undefined;
    if (!row) return { content: [{ type: "text", text: `Item ${a.id} not found.` }] };
    return { content: [{ type: "text", text: formatItem(row) }] };
  }

  if (name === "save_response") {
    db.prepare("UPDATE Item SET managerResponse = ? WHERE id = ?").run(a.response, a.id);
    return { content: [{ type: "text", text: `Response saved to item ${a.id}.` }] };
  }

  if (name === "set_status") {
    if (a.status === "closed") {
      db.prepare("UPDATE Item SET status = ?, closedBy = ?, closedAt = ? WHERE id = ?")
        .run(a.status, a.closed_by ?? null, new Date().toISOString(), a.id);
    } else {
      db.prepare("UPDATE Item SET status = ?, closedBy = NULL, closedAt = NULL WHERE id = ?")
        .run(a.status, a.id);
    }
    return { content: [{ type: "text", text: `Item ${a.id} set to ${a.status}.` }] };
  }

  if (name === "delegate") {
    db.prepare("UPDATE Item SET delegatedTo = ?, delegatedBy = ? WHERE id = ?")
      .run(a.delegate_to, a.delegate_by, a.id);
    return { content: [{ type: "text", text: `Item ${a.id} delegated to ${a.delegate_to}.` }] };
  }

  return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
});

// ── start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err}\n`);
  process.exit(1);
});
