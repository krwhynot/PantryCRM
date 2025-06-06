import { prismadb } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
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

export const authOptions: NextAuthOptions = {
  secret: process.env.JWT_SECRET,
  //adapter: PrismaAdapter(prismadb),
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),

    GitHubProvider({
      name: "github",
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },

      async authorize(credentials) {
        console.log('🔐 Auth attempt:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          throw new Error("Email or password is missing");
        }

        const user = await prismadb.user.findFirst({
          where: {
            email: credentials.email,
          },
        }) as any;

        console.log('👤 Found user:', user ? 'Yes' : 'No');
        console.log('🔑 User has password:', user?.password ? 'Yes' : 'No');

        //clear white space from password
        const trimmedPassword = credentials.password.trim();

        if (!user || !user?.password) {
          console.log('❌ User not found or no password');
          throw new Error("User not found, please register first");
        }

        const isCorrectPassword = await bcrypt.compare(
          trimmedPassword,
          user.password
        );

        console.log('🔓 Password match:', isCorrectPassword ? 'Yes' : 'No');

        if (!isCorrectPassword) {
          console.log('❌ Incorrect password');
          throw new Error("Password is incorrect");
        }

        console.log('✅ Authentication successful');
        return user;
      },
    }),
  ],
  callbacks: {
    //TODO: fix this any
    async session({ token, session }: any) {
      const user = await prismadb.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!user) {
        try {
          const newUser = await prismadb.user.create({
            data: {
              email: token.email,
              name: token.name,
              image: token.picture,
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
          return console.log(error);
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

      //console.log(session, "session");
      return session;
    },
  },
};
