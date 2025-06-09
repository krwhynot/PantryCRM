import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

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
      <SideBar build={build} />
      <div className="flex flex-col h-full w-full overflow-hidden">
        <Header
          id={session.user.id as string}
          name={session.user.name as string}
          email={session.user.email as string}
          avatar={session.user.image as string}
          lang={"en"} /* Fixed to English */
        />
        <div className="flex-grow overflow-y-auto h-full p-5">{children}</div>
        <Footer />
      </div>
    </div>
  );
}