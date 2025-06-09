"use server";

import dayjs from "dayjs";
import axios from "axios";

import { prismadb } from "@/lib/prisma";
import resendHelper from "@/lib/resend";
// import AiTasksReportEmail from "@/emails/AiTasksReport";

export async function getUserAiTasks(session: any) {
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();

  const today = dayjs().startOf("day");
  const nextWeek = dayjs().add(7, "day").startOf("day");

  let prompt = "";

  const user = await prismadb.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) return { message: "No user found" };

  // TODO: Kitchen Pantry CRM - Task fetching functionality disabled due to missing Prisma 'Task' model
  console.log('Task fetching disabled in getUserAiTasks: Prisma model for tasks is missing.');
  const getTaskPastDue: any[] = [];
  const getTaskPastDueInSevenDays: any[] = [];

  /* Original implementation commented out due to missing Prisma model
  const getTaskPastDue = await prismadb.task.findMany({
    where: {
      AND: [
        {
          user: session.user.id,
          taskStatus: "ACTIVE",
          dueDateAt: {
            lte: new Date(),
          },
        },
      ],
    },
  });

  const getTaskPastDueInSevenDays = await prismadb.task.findMany({
    where: {
      AND: [
        {
          user: session.user.id,
          taskStatus: "ACTIVE",
          dueDateAt: {
            //lte: dayjs().add(7, "day").toDate(),
            gt: today.toDate(), // Due date is greater than or equal to today
            lt: nextWeek.toDate(), // Due date is less than next week (not including today)
          },
        },
      ],
    },
  });
  */

  // The original check might not be meaningful anymore if tasks are always empty arrays due to disabled functionality.
  // However, keeping it won't harm as ![] is false.
  if (!getTaskPastDue || !getTaskPastDueInSevenDays) {
    // This condition will likely not be met if the arrays are initialized as empty.
    // Consider if this log/return is still desired if task model is permanently removed.
    console.log("No tasks found (or task functionality disabled).");
    // return { message: "No tasks found (or task functionality disabled)" }; 
  }

  // TODO: Kitchen Pantry CRM - Language selection disabled due to missing 'userLanguage' field in Prisma User model.
  // Defaulting to English prompt.
  console.log("User language selection disabled in getUserAiTasks: 'userLanguage' field missing in User model. Defaulting to English.");
  prompt = `Hi, Iam ${process.env.NEXT_PUBLIC_APP_URL} API Bot.
      \n\n
      There are ${getTaskPastDue.length} tasks past due and ${
        getTaskPastDueInSevenDays.length
      } tasks due in the next 7 days.
      \n\n
      Details today tasks: ${JSON.stringify(getTaskPastDue, null, 2)}
      \n\n
      Details next 7 days tasks: ${JSON.stringify(
        getTaskPastDueInSevenDays,
        null,
        2
      )}
    
      \n\n
      At the end, write a managerial summary and add a link ${process.env.NEXT_PUBLIC_APP_URL + "/projects/dashboard"} as a link to the task details. At the end of the managerial summary add. 1 tip for managerial skills in the field of project management and time management, 2-3 sentences with a positive mood and support, finally wish a nice working day and information that this message was generated using artificial intelligence OpenAi.
      \n\n
      The final result must be in MDX format.
      `;

  /* Original language switch (user.userLanguage) and case "cz" commented out due to missing 'userLanguage' field.
  switch (user.userLanguage) {
    case "en":
      prompt = `Hi, Iam ${process.env.NEXT_PUBLIC_APP_URL} API Bot.
      \n\n
      There are ${getTaskPastDue.length} tasks past due and ${
        getTaskPastDueInSevenDays.length
      } tasks due in the next 7 days.
      \n\n
      Details today tasks: ${JSON.stringify(getTaskPastDue, null, 2)}
      \n\n
      Details next 7 days tasks: ${JSON.stringify(
        getTaskPastDueInSevenDays,
        null,
        2
      )}
    
      \n\n
      At the end, write a managerial summary and add a link ${process.env.NEXT_PUBLIC_APP_URL + "/projects/dashboard"} as a link to the task details. At the end of the managerial summary add. 1 tip for managerial skills in the field of project management and time management, 2-3 sentences with a positive mood and support, finally wish a nice working day and information that this message was generated using artificial intelligence OpenAi.
      \n\n
      The final result must be in MDX format.
      `;
      break;
    case "cz":
      prompt = `Jako profesionální asistentka Emma s perfektní znalostí projektového řízení, který má na starosti projekty na adrese${
        process.env.NEXT_PUBLIC_APP_URL
      }, připrave manažerské shrnutí o úkolech včetně jejich detailů a termínů. Vše musí být perfektně česky a výstižně.
      \n\n
      Zde jsou informace k úkolům:
      \n\n
      Informace o projektu: Počet úkolů které jsou k řešení dnes: ${
        getTaskPastDue.length
      }, Počet úkolů, které musí být vyřešeny nejpozději do sedmi dnů: ${
        getTaskPastDueInSevenDays.length
      }.
      \n\n
      Detailní informace v JSON formátu k úkolům, které musí být hotové dnes: ${JSON.stringify(
        getTaskPastDue,
        null,
        2
      )}
      \n\n
      Detailní informace k úkolům, které musí být hotové během následujících sedmi dní: ${JSON.stringify(
        getTaskPastDueInSevenDays,
        null,
        2
      )}
    
      \n\n
      Na konec napiš manažerské shrnutí a přidej odkaz ${
        process.env.NEXT_PUBLIC_APP_URL + "/projects/dashboard"
      } jako odkaz na detail k úkolům . Na konci manažerského shrnutí přidej. 1 tip na manažerskou dovednost z oblasti projektového řízení a timemanagementu, 2-3 věty s pozitivním naladěním a podporou, nakonec popřej hezký pracovní den a infomaci, že tato zpráva byla vygenerována pomocí umělé inteligence OpenAi.
      \n\n
      Finální výsledek musí být v MDX formátu.
      `;
      break;
  }
  */

  if (!prompt) return { message: "No prompt found" };

  const getAiResponse = await axios
    .post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/openai/create-chat-completion`,
      {
        prompt: prompt,
        userId: session.user.id,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => res.data);

  //console.log(getAiResponse, "getAiResponse");
  //console.log(getAiResponse.response.message.content, "getAiResponse");

  //skip if api response is error
  if (getAiResponse.error) {
    console.log("Error from OpenAI API");
  } else {
    // Email sending temporarily disabled
    // try {
    //   // Use the migrated resend helper that doesn't require parameters
    //   // This is a temporary solution until Task 7 implements Azure Communication Services
    //   const data = await resend.emails.send();
    //   //console.log(data, "Email sent");
    // } catch (error) {
    //   console.log(error, "Error from get-user-ai-tasks");
    // }
  }

  return { user: user.email };
}
