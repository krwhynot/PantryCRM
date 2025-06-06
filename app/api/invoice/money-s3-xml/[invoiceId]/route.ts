import { authOptions } from "@/lib/auth";
import { uploadBlob } from "@/lib/azure-storage";
import { prismadb } from "@/lib/prisma";
import { fillXmlTemplate } from "@/lib/xml-generator";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const fs = require("fs");

export async function GET(req: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  //console.log(myCompany, "myCompany");

  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "There is no inovice ID, invoice ID is mandatory" },
    });
  }

  //Get data for invoice headers
  const myCompany = await prismadb.myAccount.findFirst({});

  //Get data for invoice body
  const invoiceData = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  //This function will generate XML file from template and data
  const xmlString = fillXmlTemplate(invoiceData, myCompany);

  //write xml to file in public folder /public/tmp/[invoiceId].xml
  //fs.writeFileSync(`public/tmp/${invoiceId}.xml`, xmlString);
  //fs.writeFileSync(`public/tmp/${invoiceData}.json`, invoiceData);

  //Store raw XML string in buffer
  const buffer = Buffer.from(xmlString);

  //Upload xml to Azure Storage and return url
  const containerName = process.env.AZURE_STORAGE_XML_CONTAINER || "xml";
  const blobName = `invoice-${invoiceId}.xml`;
  
  await uploadBlob(
    containerName,
    blobName,
    buffer,
    "application/xml"
  );

  //Azure Storage URL for the invoice
  const urlMoneyS3 = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${blobName}`;

  //console.log(urlMoneyS3, "url MoneyS3");

  //Write url to database assigned to invoice
  await prismadb.invoices.update({
    where: {
      id: invoiceId,
    },
    data: {
      money_s3_url: urlMoneyS3,
    },
  });

  return NextResponse.json({ xmlString, invoiceData }, { status: 200 });
}
