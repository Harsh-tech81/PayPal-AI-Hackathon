import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayShield AI — Cognitive Payment Verification",
  description: "Next-generation PayPal transaction protection powered by private human memory and Google Gemini 1.5 Flash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
