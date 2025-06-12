import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

export async function POST(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  // Check if current user is admin
  const currentUser = await prismadb.user.findFirst({
    where: { email: session.user.email }
  });

  if (currentUser?.role !== "admin") {
    return new NextResponse("Unauthorized - Admin access required", { status: 403 });
  }

  try {
    const user = await prismadb.user.update({
      where: {
        id: params.userId,
      },
      data: {
        userStatus: "ACTIVE",
      },
    });

    let message;

    switch (user.userLanguage) {
      case "en":
        message = `You account has been activated in ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${user.email} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      case "cz":
        message = `Váš účet v aplikaci ${process.env.NEXT_PUBLIC_APP_NAME} byl aktivován. \n\n Vaše uživatelské jméno je: ${user.email} \n\n  Prosím přihlašte se na ${process.env.NEXT_PUBLIC_APP_URL} \n\n Děkujeme \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      default:
        message = `You account has been activated in ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${user.email} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
    }

    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Invitation to ${process.env.NEXT_PUBLIC_APP_NAME}`,
      text: message,
    });

    return NextResponse.json(user);
  } catch (error) {
    return new NextResponse("Initial error", { status: 500 });
  }
}
