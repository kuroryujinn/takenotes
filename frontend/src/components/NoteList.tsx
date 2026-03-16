import React from 'react';
import type { Note } from '../types/note';

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  isMutating: boolean;
  deletingNoteId: number | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => Promise<void>;
}

function formatTimestamp(unixTimestamp: number): string {
  if (!unixTimestamp) {
    return 'Unknown timestamp';
  }

  return new Date(unixTimestamp * 1000).toLocaleString();
}

export default function NoteList({
  notes,
  isLoading,
  isMutating,
  deletingNoteId,
  onEdit,
  onDelete,
}: NoteListProps) {
  const orderedNotes = [...notes].sort((left, right) => right.timestamp - left.timestamp);

  return (
    <section className="panel list-panel">
      <h2>Your Notes</h2>
      {isLoading ? <p className="muted">Loading notes from Soroban...</p> : null}
      {!isLoading && orderedNotes.length === 0 ? (
        <p className="muted">No notes yet. Create your first on-chain note.</p>
      ) : null}

      <div className="note-grid">
        {orderedNotes.map((note) => (
          <article key={note.id} className="note-card">
            <header>
              <h3>{note.title || 'Untitled note'}</h3>
              <span>#{note.id}</span>
            </header>
            <p>{note.content}</p>
            <footer>
              <small>{formatTimestamp(note.timestamp)}</small>
              <div className="actions-row">
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
