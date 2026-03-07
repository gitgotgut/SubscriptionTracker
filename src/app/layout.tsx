import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { NextAuthSessionProvider } from "@/components/session-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Hugo",
  description: "Track your subscriptions and insurance in one place.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const lang = store.get("lang")?.value === "da" ? "da" : "en";

  return (
    <html lang={lang}>
      <body className={dmSans.className}>
        <NextAuthSessionProvider>
          <LanguageProvider initialLang={lang}>
            {children}
            <Toaster />
          </LanguageProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
