"use client";

import { useDraft } from "../lib/draftStore";
import { ListPreview } from "./ListPreview";
import { MatchupPreview } from "./MatchupPreview";
import { ActionBadge } from "./ActionBadge";

export function PagePreview() {
  const { draft } = useDraft();

  if (!draft) {
    return (
      <div
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: 12,
          padding: 48,
          textAlign: "center",
          color: "#9ca3af",
        }}
      >
        <p style={{ margin: 0 }}>No draft yet.</p>
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>
          Ask the assistant to draft a list or matchup page.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "48px 40px",
        minHeight: 600,
      }}
    >
      {draft.actionContent ? <ActionBadge action={draft.actionContent} /> : null}
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {draft.title}
        </h2>
        {draft.description ? (
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
            {draft.description}
          </p>
        ) : null}
      </header>
      {draft.type === "list" ? (
        <ListPreview draft={draft} />
      ) : (
        <MatchupPreview draft={draft} />
      )}
    </div>
  );
}
