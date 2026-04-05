import { z } from "zod";
import { listTags } from "../clients/gamma.js";

export const listTagsTool = {
  name: "list_tags",
  description:
    "List all available Polymarket category tags. " +
    "Tags categorize markets into topics like 'politics', 'crypto', 'sports', 'science', etc. " +
    "Use tag slugs or IDs with list_events/list_markets to filter by category.",
  inputSchema: z.object({
    limit: z.number().min(1).max(200).default(50).describe("Max number of tags to return. Default 50"),
    offset: z.number().min(0).default(0).describe("Pagination offset. Default 0"),
  }),
  async execute(args: { limit?: number; offset?: number }) {
    const tags = await listTags({ limit: args.limit ?? 50, offset: args.offset ?? 0 });

    if (!tags?.length) {
      return { content: [{ type: "text" as const, text: "No tags found." }] };
    }

    const lines: string[] = [`# Polymarket Tags (${tags.length})\n`];
    lines.push("| ID | Label | Slug |");
    lines.push("|----|-------|------|");
    for (const t of tags) {
      lines.push(`| ${t.id} | ${t.label} | ${t.slug} |`);
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};
