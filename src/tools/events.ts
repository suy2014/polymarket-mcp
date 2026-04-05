import { z } from "zod";
import { listEvents, getEvent } from "../clients/gamma.js";
import { formatEvent } from "../utils/types.js";

export const listEventsTool = {
  name: "list_events",
  description:
    "Browse Polymarket events with filtering and sorting. " +
    "Events group related markets together (e.g. '2024 US Election' contains multiple outcome markets). " +
    "Supports filtering by tag/category, volume, liquidity, status, and date range.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(10).describe("Number of events to return. Default 10"),
    offset: z.number().min(0).default(0).describe("Pagination offset. Default 0"),
    order: z
      .enum(["volume", "liquidity", "startDate", "endDate", "createdAt"])
      .default("volume")
      .describe("Sort field. Default 'volume'"),
    ascending: z.boolean().default(false).describe("Sort ascending. Default false (highest first)"),
    active: z.boolean().optional().describe("Filter only active events"),
    closed: z.boolean().optional().describe("Filter only closed/resolved events"),
    tag_slug: z.string().optional().describe("Filter by tag slug, e.g. 'politics', 'crypto', 'sports'"),
    tag_id: z.number().optional().describe("Filter by tag ID"),
    liquidity_min: z.number().optional().describe("Minimum liquidity in USD"),
    volume_min: z.number().optional().describe("Minimum volume in USD"),
  }),
  async execute(args: any) {
    const events = await listEvents(args);
    if (!events?.length) {
      return { content: [{ type: "text" as const, text: "No events found matching the criteria." }] };
    }

    const lines: string[] = [`# Polymarket Events (${events.length} results)\n`];
    for (const e of events) {
      lines.push(formatEvent(e));
      lines.push("---");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

export const getEventTool = {
  name: "get_event",
  description:
    "Get detailed information about a specific Polymarket event by ID or slug. " +
    "Returns the event details including all associated markets with their current probabilities.",
  inputSchema: z.object({
    event: z.string().describe("Event ID (numeric) or slug (e.g. 'will-trump-win-2024')"),
  }),
  async execute(args: { event: string }) {
    const event = await getEvent(args.event);
    if (!event) {
      return { content: [{ type: "text" as const, text: `Event "${args.event}" not found.` }] };
    }
    return { content: [{ type: "text" as const, text: formatEvent(event) }] };
  },
};
