import type { ListPageDraft } from "../lib/schemas";

export function ListPreview({ draft }: { draft: ListPageDraft }) {
  const columns = draft.columns ?? 2;
  const items = draft.items ?? [];
  if (items.length === 0) {
    return (
      <p style={{ color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>
        (waiting for items...)
      </p>
    );
  }
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          columnGap: 32,
          rowGap: 12,
        }}
      >
        {items.map((item, i) => {
          const clue = item.clue ?? `${i + 1}.`;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "#1f2937",
                  width: 64,
                  fontSize: 14,
                  flexShrink: 0,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {clue}:
              </span>
              <div
                style={{
                  flex: 1,
                  borderBottom: "1px solid #d1d5db",
                  height: 20,
                }}
              />
            </div>
          );
        })}
      </div>
      {draft.itemsNote ? (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          itemsNote: {draft.itemsNote}
        </p>
      ) : null}
    </div>
  );
}
