import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { sharedMediaSettings } from './lib/sharedMediaConfig.mjs';
import { planSharedMedia, publishSharedMedia } from './lib/sharedMediaPublisher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--plan');
const settings = sharedMediaSettings(process.env);
if (!settings && !dryRun) {
  console.log('[shared-media] Storage is not activated; local deployment media retained.');
} else {
  const snapshot = settings?.snapshot || process.env.SHARED_MEDIA_SNAPSHOT;
  const plan = await planSharedMedia({ distRoot: path.join(root, 'dist'), publicRoot: path.join(root, 'public'), snapshot });
  const reportDirectory = path.join(root, '.artifacts/shared-media');
  await fs.mkdir(reportDirectory, { recursive: true });
  if (dryRun) {
    await fs.writeFile(path.join(reportDirectory, 'plan.json'), JSON.stringify({ ...plan.release, media: plan.files }, null, 2));
    console.log(JSON.stringify({ ...plan.release, shards: plan.shards.length }));
  } else {
    const required = ['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
    for (const key of required) if (!process.env[key]) throw new Error(`Shared media is activated but ${key} is missing; deployment media retained`);
    if (!/^[a-f0-9]{32}$/.test(process.env.R2_ACCOUNT_ID)) throw new Error('Invalid R2 account ID');
    const bucket = process.env.R2_BUCKET_NAME;
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Invalid dedicated R2 bucket name');
    const client = new S3Client({
      region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
      requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', maxAttempts: 4
    });
    const store = {
      async list() {
        const objects = [];
        let token;
        do {
          const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
          for (const object of result.Contents || []) objects.push({ key: object.Key, size: object.Size, etag: object.ETag });
          token = result.IsTruncated ? result.NextContinuationToken : undefined;
        } while (token);
        return objects;
      },
      async getText(key) {
        try { return await (await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))).Body.transformToString(); }
        catch (error) { if (error.$metadata?.httpStatusCode === 404) return null; throw error; }
      },
      async putIfAbsent(object) {
        try {
          const result = await client.send(new PutObjectCommand({
            Bucket: bucket, Key: object.key,
            Body: object.file ? createReadStream(object.file) : object.body,
            ContentLength: object.size, ContentMD5: Buffer.from(object.md5, 'hex').toString('base64'),
            ContentType: object.body ? 'application/json' : 'application/octet-stream',
            IfNoneMatch: '*', StorageClass: 'STANDARD'
          }));
          return { size: object.size, etag: result.ETag };
        } catch (error) {
          if (error.$metadata?.httpStatusCode !== 412) throw error;
          const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: object.key }));
          return { size: result.ContentLength, etag: result.ETag };
        }
      }
    };
    try {
      const result = await publishSharedMedia(plan, store, { stripOutput: true, onProgress: value => console.log('[shared-media]', JSON.stringify(value)) });
      await fs.writeFile(path.join(reportDirectory, 'published.json'), JSON.stringify(result, null, 2));
      console.log(`[shared-media] Verified ${result.files} paths; ${result.uploaded} new objects, ${result.reused} reused. Removed ${(result.logicalBytes / 1e9).toFixed(2)} GB of deployment copies; public sources retained.`);
    } finally { client.destroy(); }
  }
}
