"use client";

import type { ReactNode } from "react";
import { CopilotKitProvider, CopilotSidebar } from "@copilotkitnext/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      {children}
      <CopilotSidebar
        defaultOpen
        labels={{
          modalHeaderTitle: "Trivia Authoring Assistant",
          chatInputPlaceholder: "Describe a trivia page to draft...",
        }}
      />
    </CopilotKitProvider>
  );
}
