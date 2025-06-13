import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { GlobalSearch } from "@/components/ui/global-search";

type Props = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lang: string; // Kept for compatibility, but will be fixed to "en"
};

const Header = ({ id, name, email, avatar }: Props) => {
  return (
    <>
      <div className="flex h-20 justify-between items-center p-5 space-x-5">
        <div className="flex items-center gap-4">
          {/* Food Service CRM - Phase 2 Core Features */}
          <h1 className="text-xl font-bold whitespace-nowrap">Kitchen Pantry CRM</h1>
          
          {/* Global Search - Maria's quick access feature */}
          <div className="hidden md:block flex-1 max-w-md">
            <GlobalSearch className="w-full" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <div className="md:hidden">
            <GlobalSearch 
              className="w-64" 
              placeholder="Quick search..."
            />
          </div>
          <ThemeToggle />
          
          {/* Simple avatar dropdown replacement */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-9 w-9">
                {avatar ? (
                  <AvatarImage src={avatar} alt={name} />
                ) : (
                  <AvatarFallback>
                    {name?.substring(0, 2) || "FD"}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />
    </>
  );
};

export default Header;