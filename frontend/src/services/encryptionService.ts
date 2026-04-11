const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const ENCRYPTION_VERSION = 1;
const PBKDF2_ITERATIONS = 210000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedPayload {
  v: number;
  s: string;
  i: string;
  d: string;
}

function toBase64(data: Uint8Array): string {
  let binary = '';
  for (let idx = 0; idx < data.byteLength; idx += 1) {
    binary += String.fromCharCode(data[idx]);
  }
  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let idx = 0; idx < binary.length; idx += 1) {
    bytes[idx] = binary.charCodeAt(idx);
  }

  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

async function deriveAesKey(address: string, secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(`${address}:${secret}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptNoteContent(address: string, secret: string, content: string): Promise<string> {
  const normalizedSecret = secret.trim();
  if (!normalizedSecret) {
    throw new Error('Encryption secret is required.');
  }

  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveAesKey(address, normalizedSecret, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    textEncoder.encode(content)
  );

  const payload: EncryptedPayload = {
    v: ENCRYPTION_VERSION,
    s: toBase64(salt),
    i: toBase64(iv),
    d: toBase64(new Uint8Array(encrypted)),
  };

  return JSON.stringify(payload);
}

export async function decryptNoteContent(address: string, secret: string, encryptedJson: string): Promise<string> {
  const normalizedSecret = secret.trim();
  if (!normalizedSecret) {
    throw new Error('Encryption secret is required for decryption.');
  }

  let payload: EncryptedPayload;

  try {
    payload = JSON.parse(encryptedJson) as EncryptedPayload;
  } catch (error) {
    throw new Error('Encrypted payload format is invalid.');
  }

  if (payload.v !== ENCRYPTION_VERSION || !payload.s || !payload.i || !payload.d) {
    throw new Error('Encrypted payload metadata is missing or unsupported.');
  }

  const salt = fromBase64(payload.s);
  const iv = fromBase64(payload.i);
  const data = fromBase64(payload.d);
  const key = await deriveAesKey(address, normalizedSecret, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    return textDecoder.decode(decrypted);
  } catch (error) {
    throw new Error('Unable to decrypt note content. Verify your encryption secret.');
  }
}