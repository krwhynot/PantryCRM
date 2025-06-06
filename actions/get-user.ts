import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

/**
 * Gets the current user from the session
 * Updated as part of Task 3 (Critical Dependency Fixes) to use user model instead of users
 */
export const getUser = async () => {
  const session = await getServerSession(authOptions);
  const data = await prismadb.user.findUnique({
    where: {
      id: session?.user?.id,
    },
  });
  if (!data) throw new Error("User not found");
  return data;
};
