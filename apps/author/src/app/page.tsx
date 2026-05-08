import { PagePreview } from "../components/PagePreview";

export default function Home() {
  return (
    <main
      style={{
        padding: "32px 24px",
        maxWidth: 920,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          BarBooks Author
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
          Draft pages by chatting with the assistant on the right.
        </p>
      </header>
      <PagePreview />
    </main>
  );
}
