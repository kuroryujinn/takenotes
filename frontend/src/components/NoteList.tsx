import React from 'react';
import type { Note } from '../types/note';

interface NoteListProps {
  notes: Note[];
  activeAddressLabel: string | null;
  isLoading: boolean;
  isMutating: boolean;
  deletingNoteId: number | null;
  viewingHistoryNoteId: number | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => Promise<void>;
  onViewHistory: (note: Note) => void;
}

function formatTimestamp(unixTimestamp: number): string {
  if (!unixTimestamp) {
    return 'Unknown timestamp';
  }

  return new Date(unixTimestamp * 1000).toLocaleString();
}

function looksLikeIpfsCid(value: string): boolean {
  const normalized = value.trim();
  return normalized.startsWith('cid-') || /^[a-zA-Z0-9]{46,}$/.test(normalized);
}

export default function NoteList({
  notes,
  activeAddressLabel,
  isLoading,
  isMutating,
  deletingNoteId,
  viewingHistoryNoteId,
  onEdit,
  onDelete,
  onViewHistory,
}: NoteListProps) {
  return (
    <section className="panel list-panel">
      <h2>Your Notes</h2>
      {activeAddressLabel ? <p className="muted">Viewing notes for: {activeAddressLabel}</p> : null}
      {activeAddressLabel ? <p className="muted">Active address: {activeAddressLabel}</p> : null}
      {isLoading ? <p className="muted">Loading notes from Soroban...</p> : null}
      {!isLoading && notes.length === 0 ? (
        <p className="muted">No matching notes found. Try clearing search or filters.</p>
      ) : null}

      <div className="note-grid">
        {notes.map((note) => (
          <article key={note.id} className="note-card">
            <header>
              <h3>{note.title || 'Untitled note'}</h3>
              <span>#{note.id}</span>
            </header>
            <div className="meta-row">
              <strong>{note.isPinned ? 'Pinned' : 'Standard'}</strong>
              <span>Priority: {note.priority}</span>
              <span>Category: {note.category || 'General'}</span>
              {note.contentCid && looksLikeIpfsCid(note.contentCid) ? (
                <span>CID: {note.contentCid.slice(0, 16)}...</span>
              ) : null}
            </div>
            <p>{note.content}</p>
            {note.tags.length > 0 ? (
              <div className="tag-list">
                {note.tags.map((tag) => (
                  <span key={`${note.id}-${tag}`} className="tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <footer>
              <small>{formatTimestamp(note.timestamp)}</small>
              <div className="actions-row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onViewHistory(note)}
                  disabled={isMutating}
                >
                  {viewingHistoryNoteId === note.id ? 'Viewing History' : 'History'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onEdit(note)}
                  disabled={isMutating}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(note)}
                  disabled={isMutating}
                >
                  {deletingNoteId === note.id ? 'Requesting...' : 'Delete'}
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
