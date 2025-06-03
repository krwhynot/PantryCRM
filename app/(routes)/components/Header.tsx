import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandComponent } from "@/components/CommandComponent";
import SupportComponent from "@/components/support";

// We'll import these dynamically to ensure any next-intl references are removed
const Feedback = dynamic(() => import("./Feedback"));
const FulltextSearch = dynamic(() => import("./FulltextSearch"));
const AvatarDropdown = dynamic(() => import("./ui/AvatarDropdown"));

import dynamic from "next/dynamic";

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
        <div className="flex justify-center ">
          <FulltextSearch />
        </div>
        <div className="flex items-center gap-3">
          <CommandComponent />
          {/* Removed SetLanguage component since we're only using English */}
          <Feedback />
          <ThemeToggle />
          <SupportComponent />
          <AvatarDropdown
            avatar={avatar}
            userId={id}
            name={name}
            email={email}
          />
        </div>
      </div>
      <Separator />
    </>
  );
};

export default Header;