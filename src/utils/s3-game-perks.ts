import { PutObjectCommand } from '@aws-sdk/client-s3';

import { GamePerksData } from '@/types';

import { BUCKET_NAME, createS3Client, PUBLIC_URL_BASE } from './s3-credentials';

export const GAME_PERKS_FILENAME = 'game-perks.json';

export const GAME_PERKS_PUBLIC_URL = `${PUBLIC_URL_BASE}/${GAME_PERKS_FILENAME}`;

export function validateGamePerksData(data: unknown): string[] {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return ['Некорректная структура данных: ожидается объект с перками'];
  }

  const errors: string[] = [];

  for (const [perkId, perk] of Object.entries(data)) {
    if (typeof perk !== 'object' || perk === null || Array.isArray(perk)) {
      errors.push(`Перк "${perkId}": значение должно быть объектом`);
      continue;
    }

    const { name, description } = perk as Record<string, unknown>;

    if (typeof name !== 'string') {
      errors.push(`Перк "${perkId}": отсутствует строковое поле "name"`);
    }

    if (typeof description !== 'string') {
      errors.push(`Перк "${perkId}": отсутствует строковое поле "description"`);
    }
  }

  return errors;
}

export async function fetchGamePerksFromS3(): Promise<GamePerksData | null> {
  try {
    const response = await fetch(`${GAME_PERKS_PUBLIC_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as unknown;
    const errors = validateGamePerksData(data);

    if (errors.length > 0) {
      console.error('Invalid game perks data from S3:', errors);
      return null;
    }

    return data as GamePerksData;
  } catch (error) {
    console.error('Failed to fetch game perks from S3:', error);
    return null;
  }
}

export async function uploadGamePerksToS3(data: GamePerksData, secretKey: string): Promise<string> {
  const s3Client = createS3Client(secretKey);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: GAME_PERKS_FILENAME,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json; charset=utf-8',
  });

  await s3Client.send(command);

  return GAME_PERKS_PUBLIC_URL;
}
