"use client";

import type { ReactNode } from "react";
import { CopilotKitProvider, CopilotSidebar } from "@copilotkitnext/react";
import { DraftProvider } from "../lib/draftStore";
import { CopilotTools } from "../copilot/CopilotTools";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <DraftProvider>
        <CopilotTools />
        {children}
        <CopilotSidebar
          defaultOpen
          labels={{
            modalHeaderTitle: "Trivia Authoring Assistant",
            chatInputPlaceholder: "Describe a trivia page to draft...",
          }}
        />
      </DraftProvider>
    </CopilotKitProvider>
  );
}
