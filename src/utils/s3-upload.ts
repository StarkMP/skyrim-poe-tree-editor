import { PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

import { createS3Client } from './s3-credentials';

const BUCKET_NAME = 'stb-poe-editor';
const PUBLIC_URL_BASE = 'https://data.poe-tree-editor.skytb.ru';

/**
 * Validates image dimensions
 * @param file - The image file to validate
 * @param requiredWidth - Required width (if specified)
 * @param requiredHeight - Required height (if specified)
 * @param maxWidth - Maximum width (if specified)
 * @param maxHeight - Maximum height (if specified)
 * @returns Promise that resolves if validation passes
 * @throws Error if validation fails
 */
async function validateImageDimensions(
  file: File,
  options?: {
    requiredWidth?: number;
    requiredHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;

      // Check required dimensions
      if (options?.requiredWidth && width !== options.requiredWidth) {
        reject(
          new Error(
            `Ширина изображения должна быть ${options.requiredWidth}px (текущая: ${width}px)`
          )
        );
        return;
      }

      if (options?.requiredHeight && height !== options.requiredHeight) {
        reject(
          new Error(
            `Высота изображения должна быть ${options.requiredHeight}px (текущая: ${height}px)`
          )
        );
        return;
      }

      // Check max dimensions
      if (options?.maxWidth && width > options.maxWidth) {
        reject(
          new Error(
            `Ширина изображения не должна превышать ${options.maxWidth}px (текущая: ${width}px)`
          )
        );
        return;
      }

      if (options?.maxHeight && height > options.maxHeight) {
        reject(
          new Error(
            `Высота изображения не должна превышать ${options.maxHeight}px (текущая: ${height}px)`
          )
        );
        return;
      }

      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось загрузить изображение для проверки размеров'));
    };

    img.src = url;
  });
}

/**
 * Uploads an icon file to S3 storage
 * @param file - The image file to upload
 * @param secretKey - The S3 secret access key
 * @param options - Optional validation options for image dimensions
 * @returns Promise with the public URL of the uploaded file
 * @throws Error if upload fails
 */
export async function uploadIconToS3(
  file: File,
  secretKey: string,
  options?: {
    requiredWidth?: number;
    requiredHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<string> {
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Неподдерживаемый формат файла. Используйте PNG или JPG.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 5MB.');
  }

  // Validate image dimensions if options provided
  if (options) {
    await validateImageDimensions(file, options);
  }

  // Generate unique filename
  const uniqueId = nanoid(8);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const filename = `${uniqueId}.${extension}`;

  try {
    // Create S3 client with the provided secret key
    const s3Client = createS3Client(secretKey);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${PUBLIC_URL_BASE}/${filename}`;
    return publicUrl;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Ошибка при загрузке файла. Попробуйте еще раз.');
  }
}
