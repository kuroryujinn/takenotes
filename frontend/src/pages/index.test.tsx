import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from './index';
import type { ActivityEvent, Note, NoteHistoryEntry, WalletSession } from '../types/note';

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn().mockReturnValue([]),
    addPage: jest.fn(),
    line: jest.fn(),
    save: jest.fn(),
  }));
});

jest.mock('../services/contractService', () => ({
  connectWallet: jest.fn(),
  createNote: jest.fn(),
  deleteNote: jest.fn(),
  fetchActivityFeed: jest.fn(),
  fetchNoteHistory: jest.fn(),
  fetchNotes: jest.fn(),
  getWalletSession: jest.fn(),
  updateNote: jest.fn(),
}));

jest.mock('../services/encryptionService', () => ({
  decryptNoteContent: jest.fn(),
  encryptNoteContent: jest.fn(),
}));

jest.mock('../services/ipfsService', () => ({
  fetchEncryptedPayloadFromIpfs: jest.fn(),
  uploadEncryptedPayloadToIpfs: jest.fn(),
}));

import {
  createNote,
  deleteNote,
  fetchActivityFeed,
  fetchNoteHistory,
  fetchNotes,
  getWalletSession,
  updateNote,
} from '../services/contractService';
import { decryptNoteContent, encryptNoteContent } from '../services/encryptionService';
import { fetchEncryptedPayloadFromIpfs, uploadEncryptedPayloadToIpfs } from '../services/ipfsService';

const mockedCreateNote = createNote as jest.MockedFunction<typeof createNote>;
const mockedDeleteNote = deleteNote as jest.MockedFunction<typeof deleteNote>;
const mockedFetchActivityFeed = fetchActivityFeed as jest.MockedFunction<typeof fetchActivityFeed>;
const mockedFetchNoteHistory = fetchNoteHistory as jest.MockedFunction<typeof fetchNoteHistory>;
const mockedFetchNotes = fetchNotes as jest.MockedFunction<typeof fetchNotes>;
const mockedGetWalletSession = getWalletSession as jest.MockedFunction<typeof getWalletSession>;
const mockedUpdateNote = updateNote as jest.MockedFunction<typeof updateNote>;
const mockedDecryptNoteContent = decryptNoteContent as jest.MockedFunction<typeof decryptNoteContent>;
const mockedEncryptNoteContent = encryptNoteContent as jest.MockedFunction<typeof encryptNoteContent>;
const mockedFetchEncryptedPayloadFromIpfs =
  fetchEncryptedPayloadFromIpfs as jest.MockedFunction<typeof fetchEncryptedPayloadFromIpfs>;
const mockedUploadEncryptedPayloadToIpfs =
  uploadEncryptedPayloadToIpfs as jest.MockedFunction<typeof uploadEncryptedPayloadToIpfs>;

const session: WalletSession = {
  address: 'GTESTWALLETADDRESS123',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

const sessionTwo: WalletSession = {
  address: 'GSECONDWALLETADDRESS999',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

function looksLikeIpfsCid(value: string): boolean {
  return /^[a-zA-Z0-9]{46,}$/.test(value.trim());
}

describe('HomePage interactions', () => {
  let notesState: Note[];
  let activityState: ActivityEvent[];

  beforeEach(() => {
    notesState = [];
    activityState = [];

    mockedGetWalletSession.mockResolvedValue(session);
    mockedFetchNotes.mockImplementation(async () => [...notesState]);
    mockedFetchActivityFeed.mockImplementation(async () => [...activityState]);
    mockedFetchNoteHistory.mockResolvedValue([]);

    mockedEncryptNoteContent.mockResolvedValue('encrypted-content');
    mockedUploadEncryptedPayloadToIpfs.mockResolvedValue('cid-new');
    mockedFetchEncryptedPayloadFromIpfs.mockResolvedValue('encrypted-content');
    mockedDecryptNoteContent.mockResolvedValue('Decrypted content');

    mockedCreateNote.mockImplementation(async (_sessionArg, draft) => {
      const isEncrypted = looksLikeIpfsCid(draft.content);
      notesState = [
        ...notesState,
        {
          id: draft.id,
          title: draft.title,
          content: isEncrypted ? '' : draft.content,
          contentCid: draft.content,
          isEncrypted,
          tags: draft.tags,
          category: draft.category,
          isPinned: draft.isPinned,
          priority: draft.priority,
          timestamp: 1000,
        },
      ];
      activityState = [{ noteId: draft.id, action: 'Note Created', timestamp: 1000 }, ...activityState];
      return true;
    });

    mockedUpdateNote.mockImplementation(async (_sessionArg, draft) => {
      const isEncrypted = looksLikeIpfsCid(draft.content);
      notesState = notesState.map((note) =>
        note.id === draft.id
          ? {
              ...note,
              title: draft.title,
              content: isEncrypted ? '' : draft.content,
              contentCid: draft.content,
              isEncrypted,
              tags: draft.tags,
              category: draft.category,
              isPinned: draft.isPinned,
              priority: draft.priority,
              timestamp: 2000,
            }
          : note
      );
      activityState = [{ noteId: draft.id, action: 'Note Updated', timestamp: 2000 }, ...activityState];
      return true;
    });

    mockedDeleteNote.mockImplementation(async (_sessionArg, noteId) => {
      notesState = notesState.filter((note) => note.id !== noteId);
      activityState = [{ noteId, action: 'Note Deleted', timestamp: 3000 }, ...activityState];
      return true;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('supports create, update, and delete flows with reflected UI changes', async () => {
    const user = userEvent;
    render(<HomePage />);

    await screen.findByText(/wallet connected:/i);

    await user.type(screen.getByLabelText(/encryption secret/i), 'my-secret');

    await user.type(screen.getByLabelText(/note id/i), '1');
    await user.type(screen.getByLabelText(/^title$/i), 'First Note');
    await user.type(screen.getByLabelText(/content/i), 'Original content');
    await user.type(screen.getByLabelText(/tags/i), 'work,urgent');
    const formPanel = screen.getByRole('heading', { name: /create note/i }).closest('section') as HTMLElement;
    await user.clear(within(formPanel).getByLabelText(/^category$/i));
    await user.type(within(formPanel).getByLabelText(/^category$/i), 'Work');
    await user.type(screen.getByLabelText(/priority/i), '5');

    await user.click(screen.getByRole('button', { name: /create note/i }));

    expect(await screen.findByRole('heading', { name: 'First Note' })).toBeInTheDocument();
    expect(await screen.findByText('Decrypted content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(await screen.findByRole('heading', { name: /edit note/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('First Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Decrypted content')).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/^title$/i);
    const contentInput = screen.getByLabelText(/content/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'First Note Updated');
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'First Note Updated' })).toBeInTheDocument();
    expect(await screen.findByText(/viewing notes for:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(await screen.findByText(/no matching notes found/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'First Note Updated' })).not.toBeInTheDocument();
  });

  test('creates a note without ipfs when upload is unavailable', async () => {
    const user = userEvent;
    mockedUploadEncryptedPayloadToIpfs.mockRejectedValueOnce(
      new Error('IPFS upload URL is not configured. Set REACT_APP_IPFS_UPLOAD_URL.')
    );

    render(<HomePage />);

    await screen.findByText(/wallet connected:/i);

    await user.type(screen.getByLabelText(/encryption secret/i), 'my-secret');
    await user.type(screen.getByLabelText(/note id/i), '7');
    await user.type(screen.getByLabelText(/^title$/i), 'Offline Ready');
    await user.type(screen.getByLabelText(/content/i), 'Plaintext content for testnet users');
    await user.type(screen.getByLabelText(/priority/i), '1');

    await user.click(screen.getByRole('button', { name: /create note/i }));

    expect(await screen.findByRole('heading', { name: 'Offline Ready' })).toBeInTheDocument();
    expect(await screen.findByText('Plaintext content for testnet users')).toBeInTheDocument();
    expect(mockedCreateNote).toHaveBeenCalledWith(
      session,
      expect.objectContaining({
        id: 7,
        title: 'Offline Ready',
        content: 'Plaintext content for testnet users',
      })
    );
    expect(screen.queryByText(/ipfs upload url is not configured/i)).not.toBeInTheDocument();
  });

  test('renders activity feed and note history from contract data', async () => {
    const user = userEvent;

    notesState = [
      {
        id: 5,
        title: 'History Note',
        content: '',
        contentCid: 'cid-history',
        isEncrypted: true,
        tags: ['history'],
        category: 'Journal',
        isPinned: false,
        priority: 2,
        timestamp: 1234,
      },
    ];

    activityState = [{ noteId: 5, action: 'Note Updated', timestamp: 2234 }];

    const historyEntries: NoteHistoryEntry[] = [
      {
        noteId: 5,
        version: 1,
        action: 'created',
        title: 'History Note',
        content: 'cid-history-v1',
        tags: ['history'],
        category: 'Journal',
        isPinned: false,
        priority: 2,
        timestamp: 1234,
      },
      {
        noteId: 5,
        version: 2,
        action: 'updated',
        title: 'History Note',
        content: 'cid-history-v2',
        tags: ['history', 'edited'],
        category: 'Journal',
        isPinned: true,
        priority: 6,
        timestamp: 2234,
      },
    ];

    mockedFetchNoteHistory.mockResolvedValue(historyEntries);

    render(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'History Note' })).toBeInTheDocument();
    expect(await screen.findByText(/note updated/i)).toBeInTheDocument();
    expect(screen.getByText(/on note #5/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /history/i }));
    expect(await screen.findByRole('button', { name: /viewing history/i })).toBeInTheDocument();

    expect(await screen.findByText(/showing immutable history for note #5/i)).toBeInTheDocument();
    expect(await screen.findByText('v2')).toBeInTheDocument();
    expect(await screen.findByText('v1')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedFetchNoteHistory).toHaveBeenCalledWith(session, 5);
    });
  });

  test('refresh wallet now switches visible notes to refreshed wallet session', async () => {
    const user = userEvent;
    let activeSession = session;
    let walletOneNotes: Note[] = [
      {
        id: 1,
        title: 'Wallet One Note',
        content: 'one',
        contentCid: '',
        isEncrypted: false,
        tags: [],
        category: 'General',
        isPinned: false,
        priority: 0,
        timestamp: 100,
      },
    ];
    const walletTwoNotes: Note[] = [
      {
        id: 2,
        title: 'Wallet Two Note',
        content: 'two',
        contentCid: '',
        isEncrypted: false,
        tags: [],
        category: 'General',
        isPinned: false,
        priority: 0,
        timestamp: 200,
      },
    ];

    mockedGetWalletSession.mockImplementation(async () => activeSession);
    mockedFetchNotes.mockImplementation(async (sessionArg) =>
      sessionArg.address === session.address ? [...walletOneNotes] : [...walletTwoNotes]
    );

    render(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Wallet One Note' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Wallet Two Note' })).not.toBeInTheDocument();

    activeSession = sessionTwo;
    walletOneNotes = [];

    fireEvent(window, new Event('focus'));

    expect(await screen.findByRole('heading', { name: 'Wallet Two Note' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Wallet One Note' })).not.toBeInTheDocument();
    expect(await screen.findByText(/active address:/i)).toBeInTheDocument();
  });
});
