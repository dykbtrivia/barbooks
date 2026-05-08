import type { ReactNode } from "react";
import "@copilotkitnext/react/styles.css";
import { Providers } from "./providers";

export const metadata = {
  title: "BarBooks Author",
  description: "AI-assisted trivia page authoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
