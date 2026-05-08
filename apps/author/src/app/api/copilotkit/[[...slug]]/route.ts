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
  prompt:
    "You are a trivia-page authoring assistant for the BarBooks sports trivia book. " +
    "For now, just chat helpfully — structured page-generation tools will be added next.",
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
