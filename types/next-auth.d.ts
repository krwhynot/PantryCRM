/* eslint-disable no-unused-vars */
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

type UserId = string;

declare module "next-auth/jwt" {
  interface JWT {
    id: UserId;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: string;
    isActive?: boolean;
  }
}

declare module "next-auth" {
  interface Session {
    user: User & {
      id: UserId;
      _id?: UserId;
      avatar?: string | null | undefined;
      isAdmin?: boolean;
      role?: string;
      isActive?: boolean;
      userLanguage?: string;
      userStatus?: string;
      lastLoginAt?: Date | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
    isActive?: boolean;
    userStatus?: string;
    userLanguage?: string;
    lastLoginAt?: Date | null;
  }
}
