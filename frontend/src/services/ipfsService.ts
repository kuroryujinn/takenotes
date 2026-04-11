const IPFS_UPLOAD_URL = process.env.REACT_APP_IPFS_UPLOAD_URL || '';
const IPFS_UPLOAD_TOKEN = process.env.REACT_APP_IPFS_UPLOAD_TOKEN || '';
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io/ipfs';

interface PinataResponse {
  IpfsHash?: string;
}

function sanitizeCid(value: string): string {
  return value.replace(/^ipfs:\/\//i, '').replace(/^\/ipfs\//i, '').trim();
}

export async function uploadEncryptedPayloadToIpfs(payload: string): Promise<string> {
  if (!IPFS_UPLOAD_URL) {
    throw new Error('IPFS upload URL is not configured. Set REACT_APP_IPFS_UPLOAD_URL.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (IPFS_UPLOAD_TOKEN) {
    headers.Authorization = `Bearer ${IPFS_UPLOAD_TOKEN}`;
  }

  const response = await fetch(IPFS_UPLOAD_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataContent: {
        payload,
      },
      pinataMetadata: {
        name: `takenote-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed with status ${response.status}.`);
  }

  const data = (await response.json()) as PinataResponse;
  const cid = sanitizeCid(data.IpfsHash || '');

  if (!cid) {
    throw new Error('IPFS upload succeeded but no CID was returned.');
  }

  return cid;
}

export async function fetchEncryptedPayloadFromIpfs(cidOrUri: string): Promise<string> {
  const cid = sanitizeCid(cidOrUri);
  if (!cid) {
    throw new Error('Invalid IPFS CID.');
  }

  const response = await fetch(`${IPFS_GATEWAY}/${cid}`);

  if (!response.ok) {
    throw new Error(`Unable to fetch IPFS content for CID ${cid}.`);
  }

  const data = (await response.json()) as { payload?: string };
  if (!data.payload) {
    throw new Error('IPFS payload is missing encrypted content.');
  }

  return data.payload;
}