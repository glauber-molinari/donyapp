import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

export function getR2BucketName(): string {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "dony-galleries";
}
