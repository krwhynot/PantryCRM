import { NextRequest, NextResponse } from 'next/server';
// Email processing functionality has been temporarily disabled until Azure Email implementation
// Original implementation used: import Imap from "imap"; 
import axios from "axios";

const imapConfig: Imap.Config = {
  user: process.env.IMAP_USER!,
  password: process.env.IMAP_PASSWORD!,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT ?? "993"),
  tls: true,
};

export async function GET(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
  // Email processing functionality has been temporarily disabled
  // This endpoint will be updated in Task 5 to use Azure Email Services
  
  console.log("Email invoice processing has been migrated to Azure services");
  
  return NextResponse.json(
    {
      message: "Email processing has been migrated to Azure Email Services. See documentation for details.",
      status: "migration_pending"
    },
    { status: 200 }
  );
}

async function checkEmail(imap: Imap): Promise<number> {
  return new Promise((resolve, reject) => {
    let emailsProcessed = 0;

    imap.once("ready", () => {
      console.log("IMAP connection ready");
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("Error opening inbox:", err);
          reject(err);
          return;
        }
        console.log("Inbox opened");

        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            console.error("Error searching for unseen emails:", err);
            reject(err);
            return;
          }
          console.log(`Found ${results.length} unseen emails`);

          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }

          const fetch = imap.fetch(results, { bodies: [""], markSeen: true });

          fetch.on("message", (msg) => {
            console.log("Processing new message");
            let fullMessage = "";

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                fullMessage += chunk.toString("utf8");
              });

              stream.once("end", () => {
                simpleParser(fullMessage, async (err, parsed) => {
                  if (err) {
                    console.error("Error parsing email:", err);
                    return;
                  }
                  console.log("Parsed email:", parsed);
                  const attachments = getAttachments(parsed);
                  console.log(`Found ${attachments.length} attachments`);

                  for (const attachment of attachments) {
                    try {
                      await sendAttachmentToAPI(attachment);
                      emailsProcessed++;
                      console.log(`Processed attachment ${emailsProcessed}`);
                    } catch (error: any) {
                      console.error(
                        "Error sending attachment to Upload API:",
                        error.message
                      );
                    }
                  }
                });
              });
            });
          });

          fetch.once("error", (err) => {
            console.error("Fetch error:", err);
            reject(err);
          });

          fetch.once("end", () => {
            console.log("Finished processing all messages");
            imap.end();
            resolve(emailsProcessed);
          });
        });
      });
    });

    imap.once("error", (err: any) => {
      console.error("IMAP connection error:", err);
      reject(err);
    });

    imap.connect();
  });
}

function getAttachments(parsed: ParsedMail): any[] {
  let attachments = parsed.attachments;

  // Log attachment info
  attachments.forEach((attachment, index) => {
    console.log(`Attachment ${index + 1}:`, {
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      contentDisposition: attachment.contentDisposition,
    });
  });

  return attachments;
}

async function sendAttachmentToAPI(attachment: any) {
  try {
    console.log("Sending attachment to API:", attachment.filename);
    const response = await axios.post(
      "http://localhost:3000/api/upload/cron",
      { file: attachment },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Upload API response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error in sendAttachmentToAPI:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}


