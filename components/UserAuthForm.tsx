"use client";

import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const UserAuthForm: FC<UserAuthFormProps> = ({ className, ...props }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const loginWithGoogle = () => {
    startTransition(async () => {
      try {
        const result = await signIn("google", { 
          redirect: false // Don't redirect immediately to handle errors gracefully
        });
        
        // Check if sign-in was successful
        if (result?.error) {
          console.error("Authentication error:", result.error);
          toast({
            title: "Authentication Failed",
            description: "Unable to sign in with Google. Please try again.",
            variant: "destructive",
          });
        } else if (result?.ok) {
          toast({
            title: "Sign In Successful",
            description: "Welcome to Kitchen Pantry CRM!",
            variant: "default",
          });
          // Redirect after successful authentication
          window.location.href = result.url || "/";
        }
      } catch (error) {
        console.error("Unexpected authentication error:", error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <Button
        type="button"
        className="max-w-sm w-full bg-slate-200"
        onClick={loginWithGoogle}
        disabled={isPending}
      >
        {isPending ? null : (
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="github"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        Google
      </Button>
    </div>
  );
};

export default UserAuthForm;
