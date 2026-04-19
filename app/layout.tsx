import type { Metadata } from "next";
import "./globals.css";
import {
  fraunces, instrumentSans, jetbrainsMono,
  playfairDisplay, dmSerifDisplay, spectral,
  inter, dmSans, ibmPlexSans, poppins, sora, manrope,
} from "./fonts";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export const metadata: Metadata = {
  title: "Ledger — Kişisel Finans",
  description: "Banka ekstresi analizi ve kişisel finans takibi",
};

const fontVars = [
  fraunces, instrumentSans, jetbrainsMono,
  playfairDisplay, dmSerifDisplay, spectral,
  inter, dmSans, ibmPlexSans, poppins, sora, manrope,
].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={fontVars}>
        <ThemeProvider>
          <div className="app">
            <Sidebar />
            <div className="main">
              <Topbar />
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
