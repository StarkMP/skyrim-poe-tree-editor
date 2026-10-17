const REPLACEMENT_CHAR = '\uFFFD';

// Byte order marks of the supported encodings (hex shown in comments)
const BOM_ENCODINGS: Array<{ bytes: number[]; encoding: string }> = [
  { bytes: [239, 187, 191], encoding: 'utf8' }, // EF BB BF
  { bytes: [255, 254], encoding: 'utf-16le' }, // FF FE
  { bytes: [254, 255], encoding: 'utf-16be' }, // FE FF
];

// Fallback single-byte encodings for Cyrillic text, tried in order
const FALLBACK_ENCODINGS = ['windows-1251', 'koi8-r'];

export type DecodedTextFile = {
  text: string;
  encoding: string;
};

function startsWithBytes(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) return false;
  return prefix.every((byte, index) => bytes[index] === byte);
}

/**
 * Reads a file and decodes its bytes into a UTF-8 string.
 * Detects the source encoding by BOM, then by strict UTF-8 validation,
 * then falls back to common Cyrillic single-byte encodings.
 */
export async function decodeTextFile(file: File): Promise<DecodedTextFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 1. Encoding by byte order mark
  for (const { bytes: prefix, encoding } of BOM_ENCODINGS) {
    if (startsWithBytes(bytes, prefix)) {
      return { text: new TextDecoder(encoding).decode(bytes), encoding };
    }
  }

  // 2. Strict UTF-8 (throws on invalid byte sequences)
  try {
    return {
      text: new TextDecoder('utf8', { fatal: true }).decode(bytes),
      encoding: 'utf8',
    };
  } catch {
    // Not valid UTF-8, continue with fallbacks
  }

  // 3. Fallback encodings, pick the first that decodes without replacement characters
  for (const encoding of FALLBACK_ENCODINGS) {
    const text = new TextDecoder(encoding).decode(bytes);

    if (!text.includes(REPLACEMENT_CHAR)) {
      return { text, encoding };
    }
  }

  throw new Error(
    'Не удалось определить кодировку файла. Сохраните файл в UTF-8 или Windows-1251.'
  );
}

/**
 * Decodes a JSON file into a UTF-8 text and parses it.
 * Throws a human-readable error when the encoding or JSON is invalid.
 */
export async function decodeAndParseJsonFile(
  file: File
): Promise<DecodedTextFile & { data: unknown }> {
  const { text, encoding } = await decodeTextFile(file);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Ошибка парсинга JSON: файл повреждён или имеет неверный формат');
  }

  return { text, encoding, data };
}
