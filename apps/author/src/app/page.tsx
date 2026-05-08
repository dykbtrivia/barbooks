export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: 720 }}>
      <h1>BarBooks Author</h1>
      <p>
        Phase 1 placeholder. Use the chat sidebar on the right to verify the
        CopilotKit runtime is wired up. Page-generation tools and live preview
        come in Phase 2.
      </p>
      <ol>
        <li>Set <code>ANTHROPIC_API_KEY</code> in <code>.env.local</code>.</li>
        <li>Run <code>npm run dev:author</code> from the repo root.</li>
        <li>Say hi in the sidebar — you should get a reply.</li>
      </ol>
    </main>
  );
}
