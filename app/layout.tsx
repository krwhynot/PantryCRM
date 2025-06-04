import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

// Import the bypass layout
import BypassLayout from './layout-bypass';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kitchen Pantry CRM",
  description: "Customer Relationship Management for Food Service Industry",
  keywords: ["CRM", "Food Service", "Kitchen", "Pantry", "Restaurant Management"],
  authors: [{ name: "Kitchen Pantry CRM Team" }],
  openGraph: {
    title: "Kitchen Pantry CRM",
    description: "Customer Relationship Management for Food Service Industry",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we should bypass authentication based on environment variable
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  // Render either the bypass layout or the original layout
  if (bypassAuth) {
    return <BypassLayout>{children}</BypassLayout>;
  } else {
    return (
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    );
  }
}