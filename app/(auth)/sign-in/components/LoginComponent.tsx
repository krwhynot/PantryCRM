"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { FingerprintIcon } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import LoadingComponent from "@/components/LoadingComponent";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  //State for dialog to be by opened and closed by DialogTrigger
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const router = useRouter();

  const formSchema = z.object({
    email: z.string().min(3).max(50),
    password: z.string().min(8).max(50),
  });

  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const status = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (status?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: status.error,
        });
        setIsLoading(false);
      } else {
        toast({
          title: "Success",
          description: "Successfully logged in",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onPasswordReset(email: string) {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/users/reset-password", {
        email,
      });
      if (response.status === 200) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-5 min-w-80 w-full md:min-w-96 md:w-fit ">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Button
            type="button"
            disabled={isLoading}
            size="lg"
            className="w-full"
            onClick={loginWithGoogle}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}{" "}
            Continue with Google
          </Button>
        </div>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-600">
              Or continue with
            </span>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid items-center gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left flex">Email</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="name@service.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid items-center gap-1.5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-left">Password</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-5 border rounded-md">
                        <Input
                          disabled={isLoading}
                          placeholder="Password"
                          className="border-0"
                          type={show ? "text" : "password"}
                          {...field}
                        />
                        <span
                          onClick={() => {
                            setShow(!show);
                          }}
                          className="text-sm cursor-pointer m-2"
                        >
                          {show ? "Hide" : "Show"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full">
              <Button
                disabled={isLoading}
                type="submit"
                className="w-full flex items-center space-x-2"
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                <FingerprintIcon className={isLoading ? "hidden" : ""} />
                <span className={isLoading ? "hidden" : ""}>Login</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-5">
        <div className="text-sm text-gray-500">
          Need account? Register{" "}
          <Link href={"/register"} className="text-blue-500">
            here
          </Link>
        </div>
        <div className="text-sm text-gray-500">
          Need password reset? Click
          {/* Dialog start */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="text-blue-500">
              <span className="px-2">here</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="p-5">Password Reset</DialogTitle>
                <DialogDescription className="p-5">
                  Enter your email address and we will send new password to your
                  e-mail.
                </DialogDescription>
              </DialogHeader>
              {isLoading ? (
                <LoadingComponent />
              ) : (
                <div className="flex px-2 space-x-5 py-5">
                  <Input
                    type="email"
                    placeholder="name@domain.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    disabled={email === ""}
                    onClick={() => {
                      onPasswordReset(email);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              )}
              <DialogTrigger className="w-full text-right pt-5 ">
                <Button variant={"destructive"}>Cancel</Button>
              </DialogTrigger>
            </DialogContent>
          </Dialog>
          {/* Dialog end */}
        </div>
      </CardFooter>
    </Card>
  );
}