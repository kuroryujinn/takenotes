import React, { useCallback, useEffect, useMemo, useState } from 'react';
import NoteForm from '../components/NoteForm';
import NoteList from '../components/NoteList';
import WalletConnect from '../components/WalletConnect';
import {
  connectWallet,
  createNote,
  deleteNote,
  fetchNotes,
  getWalletSession,
  updateNote,
} from '../services/contractService';
import type { Note, NoteDraft, WalletSession } from '../types/note';

export default function HomePage() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<NoteDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Connect Freighter to manage notes.');

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadNotes = useCallback(async (activeSession: WalletSession) => {
    setIsLoadingNotes(true);
    try {
      const fetchedNotes = await fetchNotes(activeSession);
      setNotes(fetchedNotes);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not fetch notes.');
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  const refreshNotesWithRetry = useCallback(
    async (activeSession: WalletSession, expectedNoteId?: number) => {
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const fetchedNotes = await fetchNotes(activeSession);
        setNotes(fetchedNotes);

        if (expectedNoteId === undefined || fetchedNotes.some((note) => note.id === expectedNoteId)) {
          setErrorMessage(null);
          return;
        }

        await wait(900);
      }

      setErrorMessage('Your transaction succeeded, but the new note is not visible yet. Refresh once more in a moment.');
    },
    []
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
      return;
    }

    void loadNotes(session);
  }, [loadNotes, session]);

  const createMode = useMemo(() => editingDraft === null, [editingDraft]);

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

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(`Transaction request opened for note #${draft.id}. Approve it in Freighter to continue.`);

    try {
      const created = await createNote(session, draft);
      if (!created) {
        setErrorMessage('A note with this ID already exists.');
        return;
      }

      setStatusMessage(`Note #${draft.id} created on-chain.`);
      await refreshNotesWithRetry(session, draft.id);
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

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(`Transaction request opened for note #${draft.id}. Approve it in Freighter to continue.`);

    try {
      const updated = await updateNote(session, draft);
      if (!updated) {
        setErrorMessage('Unable to update note. It may not exist anymore.');
        return;
      }

      setStatusMessage(`Note #${draft.id} updated.`);
      setEditingDraft(null);
      await refreshNotesWithRetry(session, draft.id);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete note.');
    } finally {
      setIsSubmitting(false);
      setDeletingNoteId(null);
    }
  };

  const activeMode: 'create' | 'update' = createMode ? 'create' : 'update';

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
          />

          <NoteForm
            mode={activeMode}
            initialNote={editingDraft}
            isSubmitting={isSubmitting}
            onSubmit={activeMode === 'create' ? handleCreate : handleUpdate}
            onCancelEdit={editingDraft ? () => setEditingDraft(null) : undefined}
          />
        </div>

        <NoteList
          notes={notes}
          isLoading={isLoadingNotes}
          isMutating={isSubmitting}
          deletingNoteId={deletingNoteId}
          onEdit={setEditingDraft}
          onDelete={handleDelete}
        />
      </section>
    </main>
  );
}
