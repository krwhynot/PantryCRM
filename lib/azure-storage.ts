"use client";

import { BlobServiceClient } from "@azure/storage-blob";

// Create a simple credential class since the import is causing issues
class StorageSharedKeyCredential {
  accountName: string;
  accountKey: string;

  constructor(accountName: string, accountKey: string) {
    this.accountName = accountName;
    this.accountKey = accountKey;
  }
}

// Azure Storage client setup
if (!process.env.AZURE_STORAGE_ACCOUNT) {
  throw new Error("AZURE_STORAGE_ACCOUNT is not defined");
}
if (!process.env.AZURE_STORAGE_ACCESS_KEY) {
  throw new Error("AZURE_STORAGE_ACCESS_KEY is not defined");
}

// Create a BlobServiceClient using connection string instead of shared key credential
// This avoids the import issues with StorageSharedKeyCredential
const blobServiceClient = new BlobServiceClient(
  `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT};AccountKey=${process.env.AZURE_STORAGE_ACCESS_KEY};EndpointSuffix=core.windows.net`
);

/**
 * Gets a container client
 * @param containerName The name of the container
 */
const getContainerClient = (containerName: string) => {
  return blobServiceClient.getContainerClient(containerName);
};

/**
 * Uploads a file to Azure Blob Storage
 * @param containerName The container to upload to
 * @param blobName The name to give the blob
 * @param content The content to upload
 * @param contentType The content type
 */
const uploadBlob = async (
  containerName: string,
  blobName: string,
  content: Buffer | ArrayBuffer | Blob | string,
  contentType?: string
) => {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  const options = contentType ? { blobHTTPHeaders: { blobContentType: contentType } } : undefined;
  
  await blockBlobClient.upload(content, content.length, options);
  return blockBlobClient.url;
};

/**
 * Deletes a blob from Azure Storage
 * @param containerName The container name
 * @param blobName The blob name
 */
const deleteBlob = async (containerName: string, blobName: string) => {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
};

/**
 * Lists all containers in the storage account
 */
const listContainers = async () => {
  const containers = [];
  for await (const container of blobServiceClient.listContainers()) {
    containers.push(container.name);
  }
  return containers;
};

/**
 * Lists all blobs in a container
 * @param containerName The container to list blobs from
 */
const listBlobs = async (containerName: string) => {
  const containerClient = getContainerClient(containerName);
  const blobs = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    blobs.push({
      name: blob.name,
      contentLength: blob.properties.contentLength,
      contentType: blob.properties.contentType,
      lastModified: blob.properties.lastModified,
    });
  }
  return blobs;
};

/**
 * Generates a SAS URL for a blob
 * @param containerName The container name
 * @param blobName The blob name
 * @param expiryMinutes How many minutes until the URL expires
 */
const generateSasUrl = async (containerName: string, blobName: string, expiryMinutes = 60) => {
  const containerClient = getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  
  // Generate SAS token that's valid for expiryMinutes
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
  
  const sasUrl = await blobClient.generateSasUrl({
    permissions: "r",
    expiresOn: expiryTime
  });
  
  return sasUrl;
};

export {
  blobServiceClient,
  getContainerClient,
  uploadBlob,
  deleteBlob,
  listContainers,
  listBlobs,
  generateSasUrl
};