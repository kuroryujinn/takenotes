import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import ActivityFeed from '../components/ActivityFeed';
import NoteForm from '../components/NoteForm';
import NoteHistoryPanel from '../components/NoteHistoryPanel';
import NoteList from '../components/NoteList';
import NotesToolbar from '../components/NotesToolbar';
import WalletConnect from '../components/WalletConnect';
import {
  connectWallet,
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
import type { ActivityEvent, Note, NoteDraft, NoteHistoryEntry, WalletSession } from '../types/note';

export default function HomePage() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [isLoadingActivityFeed, setIsLoadingActivityFeed] = useState<boolean>(false);
  const [historyNoteId, setHistoryNoteId] = useState<number | null>(null);
  const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);
  const [isLoadingNoteHistory, setIsLoadingNoteHistory] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<NoteDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [encryptionSecret, setEncryptionSecret] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Connect Freighter to manage notes.');

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const hydrateReadableNotes = useCallback(
    async (rawNotes: Note[], activeSession: WalletSession): Promise<Note[]> => {
      return Promise.all(
        rawNotes.map(async (note) => {
          const cid = (note.contentCid || note.content || '').trim();

          if (!cid) {
            return note;
          }

          if (!encryptionSecret.trim()) {
            return {
              ...note,
              content: '[Encrypted note. Enter your encryption secret to decrypt.]',
              contentCid: cid,
              isEncrypted: true,
            };
          }

          try {
            const encryptedPayload = await fetchEncryptedPayloadFromIpfs(cid);
            const decryptedContent = await decryptNoteContent(activeSession.address, encryptionSecret, encryptedPayload);

            return {
              ...note,
              content: decryptedContent,
              contentCid: cid,
              isEncrypted: true,
            };
          } catch {
            return {
              ...note,
              content: '[Unable to decrypt note. Verify your encryption secret.]',
              contentCid: cid,
              isEncrypted: true,
            };
          }
        })
      );
    },
    [encryptionSecret]
  );

  const loadNotes = useCallback(async (activeSession: WalletSession) => {
    setIsLoadingNotes(true);
    try {
      const fetchedNotes = await fetchNotes(activeSession);
      const readableNotes = await hydrateReadableNotes(fetchedNotes, activeSession);
      setNotes(readableNotes);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not fetch notes.');
    } finally {
      setIsLoadingNotes(false);
    }
  }, [hydrateReadableNotes]);

  const loadActivityFeed = useCallback(async (activeSession: WalletSession) => {
    setIsLoadingActivityFeed(true);
    try {
      const events = await fetchActivityFeed(activeSession);
      setActivityFeed(events);
    } catch {
      setActivityFeed([]);
    } finally {
      setIsLoadingActivityFeed(false);
    }
  }, []);

  const loadNoteHistory = useCallback(async (activeSession: WalletSession, noteId: number) => {
    setIsLoadingNoteHistory(true);
    try {
      const history = await fetchNoteHistory(activeSession, noteId);
      setNoteHistory(history);
    } catch {
      setNoteHistory([]);
    } finally {
      setIsLoadingNoteHistory(false);
    }
  }, []);

  const refreshNotesWithRetry = useCallback(
    async (activeSession: WalletSession, expectedNoteId?: number) => {
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const fetchedNotes = await fetchNotes(activeSession);
        const readableNotes = await hydrateReadableNotes(fetchedNotes, activeSession);
        setNotes(readableNotes);

        if (expectedNoteId === undefined || readableNotes.some((note) => note.id === expectedNoteId)) {
          setErrorMessage(null);
          return;
        }

        await wait(900);
      }

      setErrorMessage('Your transaction succeeded, but the new note is not visible yet. Refresh once more in a moment.');
    },
    [hydrateReadableNotes]
  );

  useEffect(() => {
    let disposed = false;

    const hydrateSession = async () => {
      const existingSession = await getWalletSession();
      if (!disposed && existingSession) {
        setSession(existingSession);
        setStatusMessage('Wallet successfully connected.');
      }
    };

    void hydrateSession();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setNotes([]);
      setActivityFeed([]);
      setHistoryNoteId(null);
      setNoteHistory([]);
      return;
    }

    void loadNotes(session);
    void loadActivityFeed(session);
  }, [loadActivityFeed, loadNotes, session]);

  const createMode = useMemo(() => editingDraft === null, [editingDraft]);

  const availableTags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort((left, right) => left.localeCompare(right)),
    [notes]
  );

  const availableCategories = useMemo(
    () =>
      Array.from(new Set(notes.map((note) => note.category || 'General'))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [notes]
  );

  const visibleNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...notes]
      .filter((note) => {
        const matchesSearch =
          query.length === 0 ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query));

        const matchesTag = activeTag.length === 0 || note.tags.includes(activeTag);
        const matchesCategory = activeCategory.length === 0 || (note.category || 'General') === activeCategory;

        return matchesSearch && matchesTag && matchesCategory;
      })
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }

        if (left.priority !== right.priority) {
          return right.priority - left.priority;
        }

        return right.timestamp - left.timestamp;
      });
  }, [activeCategory, activeTag, notes, searchTerm]);

  const triggerDownload = (blob: Blob, fileName: string) => {
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(href);
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(visibleNotes, null, 2);
    triggerDownload(new Blob([payload], { type: 'application/json' }), 'takenotes-export.json');
    setStatusMessage(`Exported ${visibleNotes.length} notes as JSON.`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    let cursorY = 18;

    doc.setFontSize(16);
    doc.text('TakeNotes Export', 14, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    visibleNotes.forEach((note, index) => {
      const lines = doc.splitTextToSize(
        `#${note.id} ${note.title || 'Untitled'}\nCategory: ${note.category || 'General'}\nPriority: ${note.priority} | Pinned: ${
          note.isPinned ? 'Yes' : 'No'
        }\nTags: ${note.tags.length > 0 ? note.tags.join(', ') : 'None'}\n${note.content}`,
        180
      );

      if (cursorY + lines.length * 5 > 280) {
        doc.addPage();
        cursorY = 16;
      }

      doc.text(lines, 14, cursorY);
      cursorY += lines.length * 5 + 4;

      if (index !== visibleNotes.length - 1) {
        doc.line(14, cursorY - 2, 196, cursorY - 2);
      }
    });

    doc.save('takenotes-export.pdf');
    setStatusMessage(`Exported ${visibleNotes.length} notes as PDF.`);
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const connectedSession = await connectWallet();
      setSession(connectedSession);
      setStatusMessage('Wallet successfully connected.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not connect wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreate = async (draft: NoteDraft) => {
    if (!session) {
      setErrorMessage('Connect wallet before creating notes.');
      return;
    }

    if (!encryptionSecret.trim()) {
      setErrorMessage('Enter your encryption secret before creating notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(`Transaction request opened for note #${draft.id}. Approve it in Freighter to continue.`);

    try {
      const encryptedPayload = await encryptNoteContent(session.address, encryptionSecret, draft.content);
      const cid = await uploadEncryptedPayloadToIpfs(encryptedPayload);
      const created = await createNote(session, {
        ...draft,
        content: cid,
      });
      if (!created) {
        setErrorMessage('A note with this ID already exists.');
        return;
      }

      setStatusMessage(`Note #${draft.id} created on-chain with encrypted IPFS content.`);
      await refreshNotesWithRetry(session, draft.id);
      await loadActivityFeed(session);

      if (historyNoteId === draft.id) {
        await loadNoteHistory(session, draft.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (draft: NoteDraft) => {
    if (!session) {
      setErrorMessage('Connect wallet before updating notes.');
      return;
    }

    if (!encryptionSecret.trim()) {
      setErrorMessage('Enter your encryption secret before updating notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(`Transaction request opened for note #${draft.id}. Approve it in Freighter to continue.`);

    try {
      const encryptedPayload = await encryptNoteContent(session.address, encryptionSecret, draft.content);
      const cid = await uploadEncryptedPayloadToIpfs(encryptedPayload);
      const updated = await updateNote(session, {
        ...draft,
        content: cid,
      });
      if (!updated) {
        setErrorMessage('Unable to update note. It may not exist anymore.');
        return;
      }

      setStatusMessage(`Note #${draft.id} updated.`);
      setEditingDraft(null);
      await refreshNotesWithRetry(session, draft.id);
      await loadActivityFeed(session);

      if (historyNoteId === draft.id) {
        await loadNoteHistory(session, draft.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (note: Note) => {
    if (!session) {
      setErrorMessage('Connect wallet before deleting notes.');
      return;
    }

    setIsSubmitting(true);
    setDeletingNoteId(note.id);
    setErrorMessage(null);
    setStatusMessage(`Transaction request opened for note #${note.id}. Approve it in Freighter to continue.`);

    try {
      const deleted = await deleteNote(session, note.id);
      if (!deleted) {
        setErrorMessage('Unable to delete note.');
        return;
      }

      setStatusMessage(`Note #${note.id} deleted.`);
      setNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote.id !== note.id));
      if (editingDraft?.id === note.id) {
        setEditingDraft(null);
      }
      await refreshNotesWithRetry(session);
      await loadActivityFeed(session);

      if (historyNoteId === note.id) {
        await loadNoteHistory(session, note.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete note.');
    } finally {
      setIsSubmitting(false);
      setDeletingNoteId(null);
    }
  };

  const activeMode: 'create' | 'update' = createMode ? 'create' : 'update';

  const handleViewHistory = async (note: Note) => {
    if (!session) {
      setErrorMessage('Connect wallet before viewing note history.');
      return;
    }

    setHistoryNoteId(note.id);
    await loadNoteHistory(session, note.id);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <h1>TakeNotes</h1>
        <p>Securely store personal notes with wallet-authenticated blockchain transactions.</p>
      </section>

      <section className="status-row">
        <p>{statusMessage}</p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="layout-grid">
        <div>
          <WalletConnect
            address={session?.address ?? null}
            isConnecting={isConnecting}
            onConnect={handleConnectWallet}
            encryptionSecret={encryptionSecret}
            onEncryptionSecretChange={setEncryptionSecret}
          />

          <NoteForm
            mode={activeMode}
            initialNote={editingDraft}
            isSubmitting={isSubmitting}
            onSubmit={activeMode === 'create' ? handleCreate : handleUpdate}
            onCancelEdit={editingDraft ? () => setEditingDraft(null) : undefined}
          />

          <NotesToolbar
            searchTerm={searchTerm}
            activeTag={activeTag}
            activeCategory={activeCategory}
            availableTags={availableTags}
            availableCategories={availableCategories}
            visibleCount={visibleNotes.length}
            totalCount={notes.length}
            onSearchTermChange={setSearchTerm}
            onTagChange={setActiveTag}
            onCategoryChange={setActiveCategory}
            onExportJson={handleExportJson}
            onExportPdf={handleExportPdf}
          />
        </div>

        <NoteList
          notes={visibleNotes}
          isLoading={isLoadingNotes}
          isMutating={isSubmitting}
          deletingNoteId={deletingNoteId}
          viewingHistoryNoteId={historyNoteId}
          onEdit={setEditingDraft}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
        />

        <div>
          <NoteHistoryPanel noteId={historyNoteId} history={noteHistory} isLoading={isLoadingNoteHistory} />
          <ActivityFeed events={activityFeed} isLoading={isLoadingActivityFeed} />
        </div>
      </section>
    </main>
  );
}
