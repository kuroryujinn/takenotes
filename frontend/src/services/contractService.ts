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
import type { Note, NoteDraft, WalletSession } from '../types/note';

const CONTRACT_ID =
  process.env.REACT_APP_CONTRACT_ID ??
  'CD5QHPRT5A2T2CCE2FBEMBZY7NI5D6AVASBFKSFQN3TTKF4Z3JW62CDE';
const RPC_URL = process.env.REACT_APP_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.REACT_APP_NETWORK_PASSPHRASE ?? Networks.TESTNET;

function createServer(): rpc.Server {
  return new rpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith('http://'),
  });
}

function contract(): Contract {
  return new Contract(CONTRACT_ID);
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

function toNote(raw: unknown): Note {
  const value = normalizeRecord(raw);

  return {
    id: toNumber(value.id, 0),
    title: toText(value.title, ''),
    content: toText(value.content, toText(value.text, '')),
    timestamp: toNumber(value.timestamp, 0),
  };
}

function toNoteArray(raw: unknown): Note[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(toNote).filter((note) => Number.isInteger(note.id));
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
  const server = createServer();
  const sourceAccount = await server.getAccount(session.address);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: session.networkPassphrase,
  })
    .setTimeout(60)
    .addOperation(contract().call(method, ...args))
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

export async function createNote(session: WalletSession, draft: NoteDraft): Promise<boolean> {
  try {
    const result = await invokeWrite(session, 'create_note', [
      toAddressScVal(session.address),
      nativeToScVal(draft.id, { type: 'u32' }),
      nativeToScVal(draft.title, { type: 'string' }),
      nativeToScVal(draft.content, { type: 'string' }),
    ]);

    // Legacy contracts may return void for write methods; treat successful submission as created.
    if (result === undefined || result === null) {
      return true;
    }

    return Boolean(result);
  } catch (error) {
    // Backward compatibility: older deployments only have add_note(user, id, text).
    if (!isMissingFunctionError(error, 'create_note')) {
      throw error;
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
    ]);

    return Boolean(result);
  } catch (error) {
    if (isMissingFunctionError(error, 'update_note')) {
      throw new Error('This deployed contract does not support note updates yet. Please redeploy the latest contract.');
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
