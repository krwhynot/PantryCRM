import { User } from "@prisma/client";

import { prismadb } from "./prisma";
import sendEmail from "./sendmail";

export async function newUserNotify(newUser: User) {
  const admins = await prismadb.user.findMany({
    where: {
      is_admin: true,
    },
  });

  admins.forEach(async (admin: User) => {
    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: admin.email,
      subject: `New User Registration with PENDING state`,
      text: `New User Registered: ${newUser.name} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL}/admin/users and activate them. \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`,
    });

    console.log("Email sent to admin");
  });
}


