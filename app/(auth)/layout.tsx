import Link from "next/link";
import ClientThemeToggle from "@/components/ClientThemeToggle";
import { DiscordLogoIcon } from "@radix-ui/react-icons";

export const metadata = {
  title: "Kitchen Pantry CRM - Authentication",
  description: "Customer Relationship Management for Food Service Industry - Authentication",
};

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full">
      <div className="flex justify-end items-center space-x-5 w-full p-5">
        <div className="flex items-center border rounded-md p-2">
          <Link href="https://discord.gg/Dd4Aj6S4Dz">
            <DiscordLogoIcon className="size-5" />
          </Link>
        </div>
        <ClientThemeToggle />
      </div>
      <div className="flex items-center grow h-full overflow-hidden">
        {children}
      </div>
      <div className="flex flex-col items-center justify-center w-full p-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Kitchen Pantry CRM - Food Service Industry CRM Solution</p>
        <p className="text-xs mt-1">Optimized for iPad usage by sales representatives</p>
      </div>
    </div>
  );
};

export default AuthLayout;