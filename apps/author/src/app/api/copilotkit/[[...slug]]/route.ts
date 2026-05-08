import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkitnext/runtime";
import { BuiltInAgent } from "@copilotkitnext/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { handle } from "hono/vercel";

const provider = (process.env.MODEL_PROVIDER ?? "anthropic").toLowerCase();

const model = (() => {
  if (provider === "ollama") {
    const ollama = createOpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      apiKey: "ollama",
    });
    return ollama(process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct");
  }
  // default: Anthropic via BuiltInAgent's built-in resolver
  return process.env.ANTHROPIC_MODEL ?? "anthropic/claude-sonnet-4-6";
})();

const agent = new BuiltInAgent({
  model,
  prompt: [
    "You are a trivia-page authoring assistant for the BarBooks sports trivia book.",
    "Your job is to draft and refine trivia pages by CALLING TOOLS, not by answering in prose.",
    "",
    "Available tools (always prefer one of these over a text reply):",
    "- generateListPage: start a new fill-in-the-blank list page (e.g. 'last 25 Super Bowl MVPs')",
    "- generateMatchupPage: start a new head-to-head page (e.g. closest Super Bowls, score matchups)",
    "- refineItems: append/replace/remove items on the current draft",
    "- setActionBadge: add or remove the decorative orange badge",
    "- updatePageMeta: tweak title, description, columns, or itemsNote",
    "",
    "Rules:",
    "1. When the user describes a page, call generateListPage or generateMatchupPage immediately — do not ask for confirmation first.",
    "2. For list pages, set itemsNote using one of these patterns when applicable:",
    "   - '<N> items – clues are years descending from <YEAR>'",
    "   - '<N> items – clues are rank numbers'",
    "3. The current draft is provided as context. When the user asks to modify it, use refineItems / setActionBadge / updatePageMeta — do not regenerate from scratch unless they ask.",
    "4. Keep replies short. After calling a tool, briefly confirm what you changed (one sentence).",
  ].join("\n"),
});

const runtime = new CopilotRuntime({
  agents: { default: agent },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handle(app);
export const POST = handle(app);
