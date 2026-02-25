import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tars Chat",
  description: "Real-time messaging app",
};

/**
 * app/layout.tsx — Root layout
 *
 * Provider order matters:
 * ClerkProvider must wrap ConvexClientProvider because Convex needs
 * access to Clerk's auth token to authenticate requests.
 *
 * This is a Server Component (no "use client") — correct for layouts.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
