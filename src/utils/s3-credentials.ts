import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const STORAGE_KEY = 's3-secret-access-key';

const S3_BASE_CONFIG = {
  endpoint: 'https://30a1374c1863d815172af49eb75d9fa2.r2.cloudflarestorage.com',
  region: 'auto',
  credentials: {
    accessKeyId: '48aa7cecd14bdce3093236383ae08b52',
  },
};

const BUCKET_NAME = 'stb-poe-editor';

export function saveSecretKey(secretKey: string): void {
  localStorage.setItem(STORAGE_KEY, secretKey);
}

export function getSecretKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearSecretKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createS3Client(secretKey: string): S3Client {
  return new S3Client({
    ...S3_BASE_CONFIG,
    credentials: {
      ...S3_BASE_CONFIG.credentials,
      secretAccessKey: secretKey,
    },
  });
}

export async function validateSecretKey(secretKey: string): Promise<boolean> {
  try {
    const client = createS3Client(secretKey);
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('S3 credentials validation failed:', error);
    return false;
  }
}
