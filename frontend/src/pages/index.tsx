import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import ActivityFeed from '../components/ActivityFeed';
import NoteForm from '../components/NoteForm';
import NoteHistoryPanel from '../components/NoteHistoryPanel';
import NoteList from '../components/NoteList';
import NotesToolbar from '../components/NotesToolbar';
import WalletConnect from '../components/WalletConnect';
import '../styles/toggle.css';
import '../styles/viewmode.css';
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

function looksLikeIpfsCid(value: string): boolean {
  const normalized = value.trim();
  return normalized.startsWith('cid-') || /^[a-zA-Z0-9]{46,}$/.test(normalized);
}

export default function HomePage() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [isLoadingActivityFeed, setIsLoadingActivityFeed] = useState<boolean>(false);
  const [historyNoteId, setHistoryNoteId] = useState<number | null>(null);
  const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);
  const [isLoadingNoteHistory, setIsLoadingNoteHistory] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [requireManualReconnect, setRequireManualReconnect] = useState<boolean>(false);
  
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<NoteDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [encryptionSecret, setEncryptionSecret] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('takenotes:dark');
      return raw === '1';
    } catch {
      return false;
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Connect Freighter to manage notes.');
  const notesRequestIdRef = useRef(0);
  const activityRequestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);

  const formatAddress = (address: string): string => `${address.slice(0, 6)}...${address.slice(-6)}`;

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const hydrateReadableNotes = useCallback(
    async (rawNotes: Note[], activeSession: WalletSession): Promise<Note[]> => {
      return Promise.all(
        rawNotes.map(async (note) => {
          const cid = (note.contentCid || note.content || '').trim();

          if (!cid || !looksLikeIpfsCid(cid)) {
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

  const hydrateReadableHistoryEntries = useCallback(
    async (rawHistory: NoteHistoryEntry[], activeSession: WalletSession): Promise<NoteHistoryEntry[]> => {
      return Promise.all(
        rawHistory.map(async (entry) => {
          const cid = (entry.content || '').trim();

          if (!cid || !looksLikeIpfsCid(cid)) {
            return entry;
          }

          if (!encryptionSecret.trim()) {
            return {
              ...entry,
              content: '[Encrypted version. Enter your encryption secret to decrypt.]',
            };
          }

          try {
            const encryptedPayload = await fetchEncryptedPayloadFromIpfs(cid);
            const decryptedContent = await decryptNoteContent(activeSession.address, encryptionSecret, encryptedPayload);

            return {
              ...entry,
              content: decryptedContent,
            };
          } catch {
            return {
              ...entry,
              content: '[Unable to decrypt this version. Verify your encryption secret.]',
            };
          }
        })
      );
    },
    [encryptionSecret]
  );

  const loadNotes = useCallback(async (activeSession: WalletSession) => {
    const requestId = notesRequestIdRef.current + 1;
    notesRequestIdRef.current = requestId;
    setIsLoadingNotes(true);

    try {
      const fetchedNotes = await fetchNotes(activeSession);
      const readableNotes = await hydrateReadableNotes(fetchedNotes, activeSession);

      if (requestId !== notesRequestIdRef.current) {
        return;
      }

      setNotes(readableNotes);
      setErrorMessage(null);
    } catch (error) {
      if (requestId !== notesRequestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Could not fetch notes.');
    } finally {
      if (requestId !== notesRequestIdRef.current) {
        return;
      }

      setIsLoadingNotes(false);
    }
  }, [hydrateReadableNotes]);

  const loadActivityFeed = useCallback(async (activeSession: WalletSession) => {
    const requestId = activityRequestIdRef.current + 1;
    activityRequestIdRef.current = requestId;
    setIsLoadingActivityFeed(true);

    try {
      const events = await fetchActivityFeed(activeSession);

      if (requestId !== activityRequestIdRef.current) {
        return;
      }

      setActivityFeed(events);
    } catch {
      if (requestId !== activityRequestIdRef.current) {
        return;
      }

      setActivityFeed([]);
    } finally {
      if (requestId !== activityRequestIdRef.current) {
        return;
      }

      setIsLoadingActivityFeed(false);
    }
  }, []);

  const loadNoteHistory = useCallback(async (activeSession: WalletSession, noteId: number) => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    setIsLoadingNoteHistory(true);

    try {
      const history = await fetchNoteHistory(activeSession, noteId);
      const readableHistory = await hydrateReadableHistoryEntries(history, activeSession);

      if (requestId !== historyRequestIdRef.current) {
        return;
      }

      setNoteHistory(readableHistory);
      setErrorMessage(null);
    } catch {
      if (requestId !== historyRequestIdRef.current) {
        return;
      }

      setNoteHistory([]);
      setErrorMessage('Could not load note history for this note.');
    } finally {
      if (requestId !== historyRequestIdRef.current) {
        return;
      }

      setIsLoadingNoteHistory(false);
    }
  }, [hydrateReadableHistoryEntries]);

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

  const syncSessionFromWallet = useCallback(async (allowDisconnect = false): Promise<WalletSession | null> => {
    if (requireManualReconnect) {
      return null;
    }

    const latestSession = await getWalletSession();

    if (!latestSession && !allowDisconnect) {
      return null;
    }

    setSession((currentSession) => {
      if (!latestSession) {
        if (currentSession) {
          setStatusMessage('Wallet disconnected. Connect Freighter to manage notes.');
        }

        return null;
      }

      if (!currentSession || currentSession.address !== latestSession.address) {
        setStatusMessage(`Wallet connected: ${formatAddress(latestSession.address)}.`);
        setErrorMessage(null);
        return latestSession;
      }

      return currentSession;
    });
    return latestSession;
  }, [requireManualReconnect]);

  useEffect(() => {
    setNotes([]);
    setActivityFeed([]);
    setHistoryNoteId(null);
    setNoteHistory([]);
    setEditingDraft(null);
    setActiveTag('');
    setActiveCategory('');
  }, [session?.address]);

  useEffect(() => {
    void syncSessionFromWallet(true);

    // Apply persisted theme
    if (isDark) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        void syncSessionFromWallet();
      }
    };

    window.addEventListener('focus', handleVisibilitySync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      window.removeEventListener('focus', handleVisibilitySync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [isDark, syncSessionFromWallet]);

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

  useEffect(() => {
    try {
      localStorage.setItem('takenotes:dark', isDark ? '1' : '0');
    } catch {}

    if (isDark) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  }, [isDark]);

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
      // allow auto-sync again when user actively connects
      setRequireManualReconnect(false);
      const connectedSession = await connectWallet();
      setSession(connectedSession);
      setStatusMessage(`Wallet connected: ${formatAddress(connectedSession.address)}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not connect wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // require manual reconnect so the session won't be re-detected automatically
      setRequireManualReconnect(true);
      setSession(null);
      setNotes([]);
      setActivityFeed([]);
      setHistoryNoteId(null);
      setNoteHistory([]);
      setEditingDraft(null);
      setActiveTag('');
      setActiveCategory('');
      setStatusMessage('Wallet disconnected. You must reconnect to continue.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletConnectionToggle = async (nextConnected: boolean) => {
    if (nextConnected) {
      if (session) {
        return;
      }
      await handleConnectWallet();
      return;
    }

    if (!session) {
      return;
    }

    await handleDisconnectWallet();
  };

  // Refresh functionality is handled via the wallet toggle; no separate refresh button.

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
      let contentReference = draft.content;

      try {
        contentReference = await uploadEncryptedPayloadToIpfs(encryptedPayload);
      } catch (uploadError) {
        const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);

        if (!uploadErrorMessage.toLowerCase().includes('ipfs upload url is not configured')) {
          throw uploadError;
        }
      }

      const created = await createNote(session, {
        ...draft,
        content: contentReference,
      });
      if (!created) {
        setErrorMessage('A note with this ID already exists.');
        return;
      }

      setStatusMessage(
        contentReference === draft.content
          ? `Note #${draft.id} created on-chain without IPFS.`
          : `Note #${draft.id} created on-chain with encrypted IPFS content.`
      );
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
      let contentReference = draft.content;

      try {
        contentReference = await uploadEncryptedPayloadToIpfs(encryptedPayload);
      } catch (uploadError) {
        const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);

        if (!uploadErrorMessage.toLowerCase().includes('ipfs upload url is not configured')) {
          throw uploadError;
        }
      }

      const updated = await updateNote(session, {
        ...draft,
        content: contentReference,
      });
      if (!updated) {
        setErrorMessage('Unable to update note. It may not exist anymore.');
        return;
      }

      setStatusMessage(contentReference === draft.content ? `Note #${draft.id} updated without IPFS.` : `Note #${draft.id} updated.`);
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
    setStatusMessage(`Loading history for note #${note.id}...`);
    await loadNoteHistory(session, note.id);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <h1>TakeNotes</h1>
        <p>Securely store personal notes with wallet-authenticated blockchain transactions.</p>
        <div className="hero-controls" style={{ marginTop: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <label className="switch">
              <input
                className="mode-switch"
                type="checkbox"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
                aria-label={isDark ? 'Disable dark mode' : 'Enable dark mode'}
              />
              <span className="slider">
                <span className="sun" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" fill="#ffd43b" />
                    <g stroke="#ffd43b" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1.5" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22.5" />
                      <line x1="1.5" y1="12" x2="4" y2="12" />
                      <line x1="20" y1="12" x2="22.5" y2="12" />
                      <line x1="4.7" y1="4.7" x2="6.5" y2="6.5" />
                      <line x1="17.5" y1="17.5" x2="19.3" y2="19.3" />
                      <line x1="4.7" y1="19.3" x2="6.5" y2="17.5" />
                      <line x1="17.5" y1="6.5" x2="19.3" y2="4.7" />
                    </g>
                  </svg>
                </span>
                <span className="moon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 13.6A9 9 0 1 1 10.4 3a7 7 0 1 0 10.6 10.6z" />
                  </svg>
                </span>
              </span>
            </label>
          </div>
          <span style={{ marginLeft: 8, fontWeight: 700 }}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
      </section>

      <section className="status-row">
        <p>{statusMessage}</p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="layout-grid">
        <div>
          <WalletConnect
            address={session?.address ?? null}
            isTogglingConnection={isConnecting}
            isRefreshing={false}
            onToggleConnection={handleWalletConnectionToggle}
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
          activeAddressLabel={session ? formatAddress(session.address) : null}
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
