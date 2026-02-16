import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "https://s3.filebase.com",
  credentials: {
    accessKeyId: "87D1271B741FFE6D9AD9",
    secretAccessKey: "6eKRaiDvXD6lVqwdFRmI3X6RuUfCjMg6c1IKBNSy",
  },
  forcePathStyle: true,
});

export interface FilebaseUploadResult {
  cid: string;
  url: string;
}

export async function uploadFileToFilebase(
  file: File,
  bucketName: string = "doe-finch-challenge",
): Promise<FilebaseUploadResult> {
  const sanitizedName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-\.]/g, "");

  const fileKey = `uploads/${Date.now()}-${sanitizedName}`;

  // Convert File to ArrayBuffer for browser compatibility
  const arrayBuffer = await file.arrayBuffer();
  const body = new Uint8Array(arrayBuffer);

  const uploadParams = {
    Bucket: bucketName,
    Key: fileKey,
    Body: body,
    ContentType: file.type,
    ACL: "public-read" as ObjectCannedACL,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: {
      "x-amz-meta-cid": "true",
    },
  };

  try {
    // Step 1: Upload the file
    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(uploadCommand);

    // Step 2: Retrieve the object metadata to get the proper CID
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const headData = await s3Client.send(headCommand);

    // Get CID from metadata (Filebase-specific)
    const cid =
      headData.Metadata?.["cid"] || headData.Metadata?.["x-amz-meta-cid"];

    if (!cid) {
      throw new Error("Valid CID not found in response");
    }

    // Verify CID format
    if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafybei[A-Za-z0-9]{44}$/.test(cid)) {
      throw new Error(`Invalid CID format: ${cid}`);
    }

    return {
      cid,
      url: `https://ipfs.filebase.io/ipfs/${cid}`,
    };
  } catch (error) {
    console.error("Upload error details:", error);
    throw new Error(
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
