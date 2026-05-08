import type { z } from "zod";
import type { ActionContentSchema } from "../lib/schemas";

type ActionContent = z.infer<typeof ActionContentSchema>;

export function ActionBadge({ action }: { action: ActionContent }) {
  const isRight = action.position !== "left";
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        [isRight ? "right" : "left"]: 12,
        background: "#f97316",
        color: "white",
        padding: "10px 14px",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 13,
        transform: `rotate(${action.rotation ?? 0}deg)`,
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        maxWidth: 160,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {action.icon ? <span style={{ marginRight: 4 }}>{action.icon}</span> : null}
      <span dangerouslySetInnerHTML={{ __html: action.content }} />
    </div>
  );
}
