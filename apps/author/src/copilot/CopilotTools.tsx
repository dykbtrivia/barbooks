"use client";

import { useFrontendTool, useAgentContext } from "@copilotkitnext/react";
import { z } from "zod";
import { useDraft } from "../lib/draftStore";
import {
  ActionContentSchema,
  ListItemSchema,
  ListPageSchema,
  MatchupItemSchema,
  MatchupPageSchema,
} from "../lib/schemas";

const RefineMode = z.enum(["replace", "append", "remove"]);

export function CopilotTools() {
  const { draft, setDraft, updateDraft } = useDraft();

  // Share the current draft with the agent so refine actions know what to mutate.
  useAgentContext({
    description:
      "The current trivia page draft. null when nothing has been generated yet.",
    value: draft,
  });

  useAgentContext({
    description:
      "BarBooks itemsNote conventions. The sync-pages script auto-generates clues based on this string. " +
      "Recognised patterns: '<N> items – clues are years descending from <YEAR>', " +
      "'<N> items – clues are rank numbers' (renders as #1, #2, ...). " +
      "Anything else produces empty clues. Prefer one of these patterns when generating list pages.",
    value: null,
  });

  useFrontendTool({
    name: "generateListPage",
    description:
      "Replace the current draft with a brand-new list-style trivia page (numbered fill-in-the-blank items). " +
      "Use when the user asks for a new list page or to start over.",
    parameters: ListPageSchema,
    handler: async (args) => {
      setDraft(args);
      return `Drafted a list page titled "${args.title}" with ${args.items.length} items.`;
    },
  });

  useFrontendTool({
    name: "generateMatchupPage",
    description:
      "Replace the current draft with a brand-new matchup-style trivia page (head-to-head with a center divider). " +
      "Use when the user asks for matchups, head-to-heads, or score-style pages.",
    parameters: MatchupPageSchema,
    handler: async (args) => {
      setDraft(args);
      return `Drafted a matchup page titled "${args.title}" with ${args.items.length} matchups.`;
    },
  });

  useFrontendTool({
    name: "refineItems",
    description:
      "Mutate the items array of the current draft. " +
      "mode='replace' overwrites all items; 'append' adds to the end; 'remove' deletes items at the given indices (0-based).",
    parameters: z.object({
      mode: RefineMode,
      items: z.array(z.union([ListItemSchema, MatchupItemSchema])).optional(),
      removeIndices: z.array(z.number().int().min(0)).optional(),
    }),
    handler: async ({ mode, items, removeIndices }) => {
      if (!draft) return "No draft to refine. Generate a page first.";
      updateDraft((prev) => {
        const p = prev as { items: unknown[] } & typeof prev;
        if (mode === "replace" && items) {
          return { ...p, items } as typeof prev;
        }
        if (mode === "append" && items) {
          return { ...p, items: [...p.items, ...items] } as typeof prev;
        }
        if (mode === "remove" && removeIndices) {
          const drop = new Set(removeIndices);
          return {
            ...p,
            items: p.items.filter((_, i) => !drop.has(i)),
          } as typeof prev;
        }
        return prev;
      });
      return `Applied ${mode} to items.`;
    },
  });

  useFrontendTool({
    name: "setActionBadge",
    description:
      "Add or update the decorative orange badge on the current draft. Pass null to remove it.",
    parameters: z.object({
      badge: ActionContentSchema.nullable(),
    }),
    handler: async ({ badge }) => {
      if (!draft) return "No draft to badge. Generate a page first.";
      updateDraft((prev) => ({
        ...prev,
        actionContent: badge ?? undefined,
      }));
      return badge ? "Badge updated." : "Badge removed.";
    },
  });

  useFrontendTool({
    name: "updatePageMeta",
    description:
      "Update the title, description, columns, or itemsNote of the current draft without touching items.",
    parameters: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      columns: z.number().int().min(1).max(4).optional(),
      itemsNote: z.string().optional(),
    }),
    handler: async (patch) => {
      if (!draft) return "No draft to update. Generate a page first.";
      updateDraft((prev) => {
        const next = { ...prev, ...patch };
        if (prev.type !== "list" && "itemsNote" in next) {
          delete (next as Record<string, unknown>).itemsNote;
        }
        return next;
      });
      return "Updated page metadata.";
    },
  });

  return null;
}
