import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

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