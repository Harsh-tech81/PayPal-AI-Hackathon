import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayShield AI — Cognitive Payment Verification & Autonomous Defense for PayPal",
  description: "Next-generation PayPal transaction protection powered by zero-knowledge episodic human memory and Google Gemini cognitive reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-[#0070ba] selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
        {children}
      </body>
    </html>
  );
}
