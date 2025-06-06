import { authOptions } from "@/lib/auth";
import { deleteBlob } from "@/lib/azure-storage";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

//Get single invoice data
export async function GET(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoice = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  return NextResponse.json({ invoice }, { status: 200 });
}

//Delete single invoice by invoiceId
export async function DELETE(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoiceData = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoiceData) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  try {
    // Delete files from Azure Storage
    const invoiceContainer = process.env.AZURE_STORAGE_CONTAINER_NAME || "invoices";
    const rossumContainer = process.env.AZURE_STORAGE_ROSSUM_CONTAINER || "rossum";
    const xmlContainer = process.env.AZURE_STORAGE_XML_CONTAINER || "xml";

    // Delete invoice file from Azure
    if (invoiceData?.invoice_file_url) {
      const blobName = invoiceData?.invoice_file_url?.split("/").slice(-1)[0];
      await deleteBlob(invoiceContainer, `invoices/${blobName}`);
      console.log("Success - invoice deleted from Azure Storage");
    }

    // Delete rossum annotation files from Azure - JSON
    if (invoiceData?.rossum_annotation_json_url) {
      const blobName = invoiceData?.rossum_annotation_json_url?.split("/").slice(-1)[0];
      await deleteBlob(rossumContainer, `rossum/${blobName}`);
      console.log("Success - rossum annotation json deleted from Azure Storage");
    }

    // Delete rossum annotation files from Azure - XML
    if (invoiceData?.rossum_annotation_xml_url) {
      const blobName = invoiceData?.rossum_annotation_xml_url?.split("/").slice(-1)[0];
      await deleteBlob(rossumContainer, `rossum/${blobName}`);
      console.log("Success - rossum annotation xml deleted from Azure Storage");
    }

    // Delete money S3 xml document file from Azure
    if (invoiceData?.money_s3_url) {
      const blobName = invoiceData?.money_s3_url?.split("/").slice(-1)[0];
      await deleteBlob(xmlContainer, `xml/${blobName}`);
      console.log("Success - money xml deleted from Azure Storage");
    }

    //Delete invoice from database
    const invoice = await prismadb.invoices.delete({
      where: {
        id: invoiceId,
      },
    });
    console.log("Invoice deleted from database");
    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err) {
    console.log("Error", err);
    return NextResponse.json({
      status: 500,
      body: { error: "Something went wrong while delete invoice" },
    });
  }
}
