"use server";

import { getServerSession } from "next-auth";
import { render } from "@react-email/render";

import { SendMailToAll } from "./schema";
import { InputType, ReturnType } from "./types";

import { prismadb } from "@/lib/prisma";
import resendHelper from "@/lib/resend";
import { authOptions } from "@/lib/auth";
import { createSafeAction } from "@/lib/create-safe-action";
import MessageToAllUsers from "@/emails/admin/MessageToAllUser";
import sendEmail from "@/lib/sendmail";

const handler = async (data: InputType): Promise<ReturnType> => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      error: "You must be authenticated.",
    };
  }

  //Only admin can send mail to all users
  if (!session.user.isAdmin) {
    return {
      error: "You are not authorized to perform this action.",
    };
  }

  // TODO: Kitchen Pantry CRM - Email functionality not implemented yet
  console.log('Email functionality disabled for Kitchen Pantry CRM');
  return {
    error: 'Email functionality not available in current version.'
  };
};

export const sendMailToAll = createSafeAction(SendMailToAll, handler);
