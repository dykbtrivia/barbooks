import type { MatchupPageDraft } from "../lib/schemas";

export function MatchupPreview({ draft }: { draft: MatchupPageDraft }) {
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
          columnGap: 24,
          rowGap: 16,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 16,
            }}
          >
            {item.context ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 8,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 500,
                }}
              >
                {item.context}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  borderBottom: "2px solid #d1d5db",
                  height: 24,
                }}
              />
              <span
                style={{
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 13,
                  fontFamily: "ui-monospace, monospace",
                  padding: "0 8px",
                }}
              >
                {item.centerText}
              </span>
              <div
                style={{
                  flex: 1,
                  borderBottom: "2px solid #d1d5db",
                  height: 24,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
