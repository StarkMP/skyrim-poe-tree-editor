import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const STORAGE_KEY = 's3-secret-access-key';

// Cloudflare R2 configuration (without secret key)
const S3_BASE_CONFIG = {
  endpoint: 'https://30a1374c1863d815172af49eb75d9fa2.r2.cloudflarestorage.com',
  region: 'auto',
  credentials: {
    accessKeyId: '48aa7cecd14bdce3093236383ae08b52',
  },
};

const BUCKET_NAME = 'stb-poe-editor';

/**
 * Saves the secret access key to localStorage
 */
export function saveSecretKey(secretKey: string): void {
  localStorage.setItem(STORAGE_KEY, secretKey);
}

/**
 * Gets the secret access key from localStorage
 */
export function getSecretKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Removes the secret access key from localStorage
 */
export function clearSecretKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Creates an S3 client with the provided secret key
 */
export function createS3Client(secretKey: string): S3Client {
  return new S3Client({
    ...S3_BASE_CONFIG,
    credentials: {
      ...S3_BASE_CONFIG.credentials,
      secretAccessKey: secretKey,
    },
  });
}

/**
 * Validates the secret access key by attempting to list objects in the bucket
 * @param secretKey - The secret access key to validate
 * @returns Promise that resolves to true if valid, false otherwise
 */
export async function validateSecretKey(secretKey: string): Promise<boolean> {
  try {
    const client = createS3Client(secretKey);
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1, // Only need to check if we can access the bucket
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('S3 credentials validation failed:', error);
    return false;
  }
}
