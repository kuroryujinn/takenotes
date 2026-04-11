import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import type { ActivityEvent, Note, NoteDraft, NoteHistoryEntry, WalletSession } from '../types/note';

const CONTRACT_ID = process.env.REACT_APP_CONTRACT_ID || '';
const LOGGER_CONTRACT_ID = process.env.REACT_APP_LOGGER_CONTRACT_ID || '';
const RPC_URL = process.env.REACT_APP_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.REACT_APP_NETWORK_PASSPHRASE || Networks.TESTNET;

if (!CONTRACT_ID) {
  console.warn('Warning: REACT_APP_CONTRACT_ID is not defined in the .env file.');
}

function createServer(): rpc.Server {
  return new rpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith('http://'),
  });
}

function contract(): Contract {
  return new Contract(CONTRACT_ID);
}

function loggerContract(): Contract | null {
  if (!LOGGER_CONTRACT_ID) {
    return null;
  }

  return new Contract(LOGGER_CONTRACT_ID);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function toAddressScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function normalizeRecord(raw: unknown): Record<string, unknown> {
  if (raw instanceof Map) {
    return Object.fromEntries(raw.entries());
  }

  return raw as Record<string, unknown>;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function isMissingFunctionError(error: unknown, methodName: string): boolean {
  const message = toErrorMessage(error).toLowerCase();
  const escapedName = methodName.toLowerCase();

  return (
    message.includes(escapedName) &&
    (message.includes('unknown') ||
      message.includes('not found') ||
      message.includes('missing') ||
      message.includes('no such'))
  );
}

function isSignatureMismatchError(error: unknown, methodName: string): boolean {
  const message = toErrorMessage(error).toLowerCase();
  const target = methodName.toLowerCase();

  return (
    message.includes(target) &&
    (message.includes('argument') ||
      message.includes('arity') ||
      message.includes('invalid input') ||
      message.includes('type mismatch') ||
      message.includes('xdr'))
  );
}

function toNote(raw: unknown): Note {
  const value = normalizeRecord(raw);
  const contentCid = toText(value.content_cid, toText(value.content, ''));

  return {
    id: toNumber(value.id, 0),
    title: toText(value.title, ''),
    content: toText(value.content, toText(value.text, '')),
    contentCid,
    isEncrypted: contentCid.length > 0,
    tags: toStringArray(value.tags),
    category: toText(value.category, 'General'),
    isPinned: toBoolean(value.is_pinned, false),
    priority: Math.max(0, Math.min(255, toNumber(value.priority, 0))),
    timestamp: toNumber(value.timestamp, 0),
  };
}

function toNoteArray(raw: unknown): Note[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(toNote).filter((note) => Number.isInteger(note.id));
}

function toHistoryEntry(raw: unknown): NoteHistoryEntry {
  const value = normalizeRecord(raw);

  return {
    noteId: toNumber(value.note_id, 0),
    version: toNumber(value.version, 0),
    action: toText(value.action, ''),
    title: toText(value.title, ''),
    content: toText(value.content_cid, toText(value.content, '')),
    tags: toStringArray(value.tags),
    category: toText(value.category, 'General'),
    isPinned: toBoolean(value.is_pinned, false),
    priority: Math.max(0, Math.min(255, toNumber(value.priority, 0))),
    timestamp: toNumber(value.timestamp, 0),
  };
}

function toHistoryArray(raw: unknown): NoteHistoryEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(toHistoryEntry)
    .filter((entry) => Number.isInteger(entry.noteId) && Number.isInteger(entry.version));
}

function toActivityEvent(raw: unknown): ActivityEvent {
  const value = normalizeRecord(raw);

  return {
    noteId: toNumber(value.note_id, 0),
    action: toText(value.action, ''),
    timestamp: toNumber(value.timestamp, 0),
  };
}

function toActivityArray(raw: unknown): ActivityEvent[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(toActivityEvent).filter((entry) => Number.isInteger(entry.noteId));
}

function assertFreighterCall<T extends { error?: { message?: string } }>(result: T): T {
  if (result.error) {
    throw new Error(result.error.message ?? 'Freighter request failed.');
  }

  return result;
}

async function getNetworkPassphrase(): Promise<string> {
  const networkResult = await getNetwork();
  if (networkResult.error || !networkResult.networkPassphrase) {
    return NETWORK_PASSPHRASE;
  }

  return networkResult.networkPassphrase;
}

async function pollTransactionResult(server: rpc.Server, txHash: string): Promise<unknown> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const txResult = await server.getTransaction(txHash);

    if (txResult.status === 'SUCCESS') {
      if (!txResult.returnValue) {
        return undefined;
      }
      return scValToNative(txResult.returnValue);
    }

    if (txResult.status === 'FAILED') {
      throw new Error('Transaction failed during execution.');
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }

  throw new Error('Timed out while waiting for transaction confirmation.');
}

async function buildInvocationTx(
  sourceAddress: string,
  networkPassphrase: string,
  method: string,
  args: xdr.ScVal[]
): Promise<Transaction> {
  const server = createServer();
  const sourceAccount = await server.getAccount(sourceAddress);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .setTimeout(60)
    .addOperation(contract().call(method, ...args))
    .build();

  return server.prepareTransaction(tx);
}

async function invokeWrite(
  session: WalletSession,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const server = createServer();
  const preparedTx = await buildInvocationTx(session.address, session.networkPassphrase, method, args);

  const signed = assertFreighterCall(
    await signTransaction(preparedTx.toXDR(), {
      address: session.address,
      networkPassphrase: session.networkPassphrase,
    })
  );

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, session.networkPassphrase);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new Error('Soroban RPC rejected the transaction.');
  }

  return pollTransactionResult(server, sendResult.hash);
}

async function invokeRead(
  session: WalletSession,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  return invokeReadFromContract(session, contract(), method, args);
}

async function invokeReadFromContract(
  session: WalletSession,
  targetContract: Contract,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const server = createServer();
  const sourceAccount = await server.getAccount(session.address);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: session.networkPassphrase,
  })
    .setTimeout(60)
    .addOperation(targetContract.call(method, ...args))
    .build();

  const simulation = await server.simulateTransaction(tx);
  if ('error' in simulation) {
    throw new Error(simulation.error);
  }

  if (!simulation.result) {
    return [];
  }

  return scValToNative(simulation.result.retval);
}

export async function getWalletSession(): Promise<WalletSession | null> {
  const connectedResult = await isConnected();
  if (connectedResult.error || !connectedResult.isConnected) {
    return null;
  }

  const addressResult = await getAddress();
  if (addressResult.error || !addressResult.address) {
    return null;
  }

  return {
    address: addressResult.address,
    networkPassphrase: await getNetworkPassphrase(),
  };
}

export async function connectWallet(): Promise<WalletSession> {
  try {
    assertFreighterCall(await isConnected());
    const access = assertFreighterCall(await requestAccess());

    return {
      address: access.address,
      networkPassphrase: await getNetworkPassphrase(),
    };
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function fetchNotes(session: WalletSession): Promise<Note[]> {
  const result = await invokeRead(session, 'get_notes', [toAddressScVal(session.address)]);
  return toNoteArray(result);
}

export async function fetchNoteHistory(session: WalletSession, noteId: number): Promise<NoteHistoryEntry[]> {
  const result = await invokeRead(session, 'get_note_history', [
    toAddressScVal(session.address),
    nativeToScVal(noteId, { type: 'u32' }),
  ]);
  return toHistoryArray(result);
}

export async function fetchActivityFeed(session: WalletSession): Promise<ActivityEvent[]> {
  const target = loggerContract();
  if (!target) {
    return [];
  }

  const result = await invokeReadFromContract(session, target, 'get_events', [toAddressScVal(session.address)]);
  return toActivityArray(result).sort((left, right) => right.timestamp - left.timestamp);
}

export async function createNote(session: WalletSession, draft: NoteDraft): Promise<boolean> {
  try {
    const result = await invokeWrite(session, 'create_note', [
      toAddressScVal(session.address),
      nativeToScVal(draft.id, { type: 'u32' }),
      nativeToScVal(draft.title, { type: 'string' }),
      nativeToScVal(draft.content, { type: 'string' }),
      nativeToScVal(draft.tags),
      nativeToScVal(draft.category, { type: 'string' }),
      nativeToScVal(draft.isPinned),
      nativeToScVal(draft.priority, { type: 'u32' }),
    ]);

    // Legacy contracts may return void for write methods; treat successful submission as created.
    if (result === undefined || result === null) {
      return true;
    }

    return Boolean(result);
  } catch (error) {
    // Backward compatibility: older deployments may expose only create_note(user,id,title,content)
    // or add_note(user,id,text).
    if (!(isMissingFunctionError(error, 'create_note') || isSignatureMismatchError(error, 'create_note'))) {
      throw error;
    }

    try {
      await invokeWrite(session, 'create_note', [
        toAddressScVal(session.address),
        nativeToScVal(draft.id, { type: 'u32' }),
        nativeToScVal(draft.title, { type: 'string' }),
        nativeToScVal(draft.content, { type: 'string' }),
      ]);

      return true;
    } catch (legacyError) {
      if (!isSignatureMismatchError(legacyError, 'create_note')) {
        throw legacyError;
      }
    }

    await invokeWrite(session, 'add_note', [
      toAddressScVal(session.address),
      nativeToScVal(draft.id, { type: 'u32' }),
      nativeToScVal(draft.content, { type: 'string' }),
    ]);

    return true;
  }
}

export async function updateNote(session: WalletSession, draft: NoteDraft): Promise<boolean> {
  try {
    const result = await invokeWrite(session, 'update_note', [
      toAddressScVal(session.address),
      nativeToScVal(draft.id, { type: 'u32' }),
      nativeToScVal(draft.title, { type: 'string' }),
      nativeToScVal(draft.content, { type: 'string' }),
      nativeToScVal(draft.tags),
      nativeToScVal(draft.category, { type: 'string' }),
      nativeToScVal(draft.isPinned),
      nativeToScVal(draft.priority, { type: 'u32' }),
    ]);

    return Boolean(result);
  } catch (error) {
    if (isMissingFunctionError(error, 'update_note') || isSignatureMismatchError(error, 'update_note')) {
      throw new Error(
        'This deployed contract does not support metadata-aware note updates yet. Please redeploy the latest contract.'
      );
    }
    throw error;
  }
}

export async function deleteNote(session: WalletSession, noteId: number): Promise<boolean> {
  try {
    const result = await invokeWrite(session, 'delete_note', [
      toAddressScVal(session.address),
      nativeToScVal(noteId, { type: 'u32' }),
    ]);

    return Boolean(result);
  } catch (error) {
    if (isMissingFunctionError(error, 'delete_note')) {
      throw new Error('This deployed contract does not support note deletion yet. Please redeploy the latest contract.');
    }
    throw error;
  }
}
