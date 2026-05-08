"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { PageDraft } from "./schemas";

type DraftContextValue = {
  draft: PageDraft | null;
  setDraft: (draft: PageDraft | null) => void;
  updateDraft: (updater: (prev: PageDraft) => PageDraft) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PageDraft | null>(null);

  const updateDraft = (updater: (prev: PageDraft) => PageDraft) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  };

  return (
    <DraftContext.Provider value={{ draft, setDraft, updateDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used inside <DraftProvider>");
  return ctx;
}
