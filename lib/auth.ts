import { prismadb } from "@/lib/prisma";
import { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { newUserNotify } from "./new-user-notify";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;
  if (!clientId || clientId.length === 0) {
    throw new Error("Missing GOOGLE_ID");
  }

  if (!clientSecret || clientSecret.length === 0) {
    throw new Error("Missing GOOGLE_SECRET");
  }

  return { clientId, clientSecret };
}

function getGitHubCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GITHUB_ID;
  const clientSecret = process.env.GITHUB_SECRET;
  if (!clientId || clientId.length === 0) {
    throw new Error("Missing GITHUB_ID environment variable");
  }

  if (!clientSecret || clientSecret.length === 0) {
    throw new Error("Missing GITHUB_SECRET environment variable");
  }

  return { clientId, clientSecret };
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
}

export const authOptions: NextAuthOptions = {
  secret: getJWTSecret(),
  adapter: PrismaAdapter(prismadb),
  session: {
    strategy: "database",
  },

  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),

    GitHubProvider({
      name: "github",
      clientId: getGitHubCredentials().clientId,
      clientSecret: getGitHubCredentials().clientSecret,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email or password is missing");
        }

        const user = await prismadb.user.findFirst({
          where: {
            email: credentials.email,
          },
        });

        // Clear white space from both email and password
        const trimmedEmail = credentials.email.trim().toLowerCase();
        const trimmedPassword = credentials.password.trim();

        // SECURITY: Consistent timing to prevent user enumeration attacks
        // Always hash the password even if user doesn't exist
        let isValidCredentials = false;
        
        if (user && user.password) {
          isValidCredentials = await bcrypt.compare(trimmedPassword, user.password);
        } else {
          // Perform dummy hash operation to maintain consistent timing
          await bcrypt.compare(trimmedPassword, '$2a$12$dummy.hash.to.prevent.timing.attacks');
        }

        if (!isValidCredentials) {
          // Use consistent error message to prevent user enumeration
          throw new Error("Invalid username or password");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async session({ token, session }: { token: JWT; session: Session }) {
      // Validate token has required email property
      if (!token.email) {
        console.error("JWT token missing email property");
        return null;
      }

      const user = await prismadb.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!user) {
        try {
          // Validate all required token properties before creating user
          if (!token.email) {
            throw new Error("Token email is required for user creation");
          }

          const newUser = await prismadb.user.create({
            data: {
              email: token.email,
              name: token.name || null, // Handle potential undefined
              image: token.picture || null, // Handle potential undefined
              isActive: true,
              role: "user",
              lastLoginAt: new Date(),
            },
          });

          await newUserNotify(newUser);

          //Put new created user data in session
          session.user.id = newUser.id;
          session.user.name = newUser.name;
          session.user.email = newUser.email;
          session.user.image = newUser.image;
          session.user.role = newUser.role;
          session.user.isActive = newUser.isActive;
          session.user.lastLoginAt = newUser.lastLoginAt;
          return session;
        } catch (error) {
          console.error("Error creating new user during OAuth:", error);
          // Return null to prevent authentication with invalid session
          return null;
        }
      } else {
        await prismadb.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastLoginAt: new Date(),
          },
        });
        //User already exist in localDB, put user data in session
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
        session.user.role = user.role;
        session.user.isActive = user.isActive;
        session.user.lastLoginAt = user.lastLoginAt;
      }

      return session;
    },
  },
};
