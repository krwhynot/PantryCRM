import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { SimpleErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL! || "http://localhost:3000"
  ),
  title: "Kitchen Pantry CRM - Food Service Industry",
  description: "Customer Relationship Management for Food Service Industry",
  openGraph: {
    images: [
      {
        url: "/images/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Kitchen Pantry CRM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/images/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Kitchen Pantry CRM",
      },
    ],
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect("/sign-in");
  }

  const user = session?.user;

  if (user?.userStatus === "PENDING") {
    return redirect("/pending");
  }

  if (user?.userStatus === "INACTIVE") {
    return redirect("/inactive");
  }

  // Dynamic import to avoid next-intl imports in components
  const SideBar = (await import("./components/SideBar")).default;
  const Header = (await import("./components/Header")).default;
  const Footer = (await import("./components/Footer")).default;
  // Simplified build info for Kitchen Pantry CRM
  const build = {
    version: "2.0.0",
    buildDate: new Date().toISOString(),
    name: "Kitchen Pantry CRM"
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SimpleErrorBoundary message="Navigation sidebar failed to load">
        <SideBar build={build} />
      </SimpleErrorBoundary>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <SimpleErrorBoundary message="Header failed to load">
          <Header
            id={session.user.id as string}
            name={session.user.name as string}
            email={session.user.email as string}
            avatar={session.user.image as string}
            lang={"en"} /* Fixed to English */
          />
        </SimpleErrorBoundary>
        <div className="flex-grow overflow-y-auto h-full p-5">
          <SimpleErrorBoundary message="Page content failed to load">
            {children}
          </SimpleErrorBoundary>
        </div>
        <SimpleErrorBoundary message="Footer failed to load">
          <Footer />
        </SimpleErrorBoundary>
      </div>
    </div>
  );
}