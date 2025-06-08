import { NextRequest, NextResponse } from "next/server";
import { uploadBlob } from "@/lib/azure-storage";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import { getRossumToken } from "@/lib/get-rossum-token";

const FormData = require("form-data");

export async function POST(req: NextRequest, context: { params: Record<string, string> }): Promise<Response> {
  // Parse the request body as JSON instead of FormData
  const { file } = await request.json();

  console.log("CRON JOB - UPLOAD INVOICE");
  console.log("File: ", file);

  if (!file) {
    console.log("Error - no file found");
    return NextResponse.json({ success: false });
  }

  //Rossum integration
  const rossumURL = process.env.ROSSUM_API_URL;
  const queueId = process.env.ROSSUM_QUEUE_ID;
  const queueUploadUrl = `${rossumURL}/uploads?queue=${queueId}`;

  const token = await getRossumToken();

  const buffer = Buffer.from(file.content.data, "base64");

  const form = new FormData();
  form.append("content", buffer, file.filename);

  console.log("FORM form CRON JOB:", form);

  const uploadInvoiceToRossum = await axios.post(queueUploadUrl, form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Response", uploadInvoiceToRossum.data);

  const rossumTask = await axios.get(uploadInvoiceToRossum.data.url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Rossum task: ", rossumTask.data);

  const rossumUploadData = await axios.get(rossumTask.data.content.upload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Rossum upload data: ", rossumUploadData.data);

  const rossumDocument = await axios.get(rossumUploadData.data.documents[0], {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (rossumDocument.status !== 200) {
    throw new Error("Could not get Rossum document");
  }

  console.log("Rossum document: ", rossumDocument.data);

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "invoices";
  const blobName = `${new Date().getTime()}-${file.filename}`;
  console.log("Invoice File Name:", blobName);

  console.log("Uploading to Azure Storage...", blobName);
  try {
    await uploadBlob(
      containerName,
      blobName,
      Buffer.from(file.content.data),
      file.contentType
    );
  } catch (err) {
    console.log("Error - uploading to Azure Storage", err);
  }

  console.log("Creating Item in DB...");
  try {
    // Azure Storage URL for the invoice
    const url = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${blobName}`;
    console.log("URL in Digital Ocean:", url);

    const rossumAnnotationId = rossumDocument.data.annotations[0]
      .split("/")
      .pop();

    console.log("Annotation ID:", rossumAnnotationId);
    //Save the data to the database

    const admin = await prismadb.users.findMany({
      where: {
        is_admin: true,
      },
    });

    await prismadb.invoices.create({
      data: {
        last_updated_by: admin[0].id,
        date_due: new Date(),
        description: "Incoming invoice",
        document_type: "invoice",
        invoice_type: "Taxable document",
        status: "new",
        favorite: false,
        assigned_user_id: admin[0].id,
        invoice_file_url: url,
        invoice_file_mimeType: file.contentType,
        rossum_status: "importing",
        rossum_document_url: rossumDocument.data.annotations[0],
        rossum_document_id: rossumDocument.data.id.toString(),
        rossum_annotation_url: rossumDocument.data.annotations[0],
        rossum_annotation_id: rossumAnnotationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error - storing data to DB", error);
    return NextResponse.json({ success: false });
  }
}


