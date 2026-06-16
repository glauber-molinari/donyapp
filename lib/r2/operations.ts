import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2BucketName, getR2Client } from "./client";

/** URL assinada para upload direto (browser → R2, sem passar pela Vercel). */
export async function presignUpload(key: string, contentType: string): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;
  const cmd = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: 300 });
}

/** URL assinada para download com nome de arquivo sugerido. */
export async function presignDownload(key: string, filename: string): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;
  const cmd = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });
  return getSignedUrl(client, cmd, { expiresIn: 3600 });
}

/** Lê os bytes completos de um objeto do R2. */
export async function getObjectBytes(key: string): Promise<Buffer | null> {
  const client = getR2Client();
  if (!client) return null;
  try {
    const cmd = new GetObjectCommand({ Bucket: getR2BucketName(), Key: key });
    const res = await client.send(cmd);
    if (!res.Body) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

/** Grava bytes num objeto do R2. */
export async function putObjectBytes(
  key: string,
  body: Buffer,
  contentType: string
): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;
  try {
    await client.send(
      new PutObjectCommand({ Bucket: getR2BucketName(), Key: key, Body: body, ContentType: contentType })
    );
    return true;
  } catch {
    return false;
  }
}

/** Retorna metadados do objeto (ContentLength, etc.) ou null se não existir. */
export async function headObject(key: string): Promise<{ size: number } | null> {
  const client = getR2Client();
  if (!client) return null;
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: getR2BucketName(), Key: key }));
    return { size: res.ContentLength ?? 0 };
  } catch {
    return null;
  }
}

/** Lista chaves sob um prefixo (paginação automática). */
export async function listObjectKeys(prefix: string): Promise<string[]> {
  const client = getR2Client();
  if (!client) return [];
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client
      .send(
        new ListObjectsV2Command({
          Bucket: getR2BucketName(),
          Prefix: prefix,
          ContinuationToken: token,
        })
      )
      .catch(() => null);
    if (!res) break;
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Remove um único objeto do R2. */
export async function deleteObject(key: string): Promise<void> {
  const client = getR2Client();
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: getR2BucketName(), Key: key })).catch(() => {});
}

/** Remove múltiplos objetos do R2 de uma vez (max 1000 por chamada). */
export async function deleteObjects(keys: string[]): Promise<void> {
  const client = getR2Client();
  if (!client || keys.length === 0) return;
  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }
  await Promise.all(
    batches.map((batch) =>
      client
        .send(
          new DeleteObjectsCommand({
            Bucket: getR2BucketName(),
            Delete: { Objects: batch.map((Key) => ({ Key })) },
          })
        )
        .catch(() => {})
    )
  );
}
