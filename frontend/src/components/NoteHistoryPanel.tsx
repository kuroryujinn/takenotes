import React from 'react';
import type { NoteHistoryEntry } from '../types/note';

interface NoteHistoryPanelProps {
  noteId: number | null;
  history: NoteHistoryEntry[];
  isLoading: boolean;
}

function formatTimestamp(unixTimestamp: number): string {
  if (!unixTimestamp) {
    return 'Unknown timestamp';
  }

  return new Date(unixTimestamp * 1000).toLocaleString();
}

export default function NoteHistoryPanel({ noteId, history, isLoading }: NoteHistoryPanelProps) {
  return (
    <section className="panel history-panel">
      <h2>Note History</h2>
      {noteId === null ? <p className="muted">Select a note and click History to inspect its versions.</p> : null}
      {noteId !== null ? <p className="muted">Showing immutable history for note #{noteId}.</p> : null}
      {isLoading ? <p className="muted">Loading note history...</p> : null}
      {noteId !== null && !isLoading && history.length === 0 ? (
        <p className="muted">No history found for this note.</p>
      ) : null}

      <ul className="history-list">
        {history
          .slice()
          .sort((left, right) => right.version - left.version)
          .map((entry) => (
            <li key={`${entry.noteId}-${entry.version}`} className="history-item">
              <header>
                <strong>v{entry.version}</strong>
                <span>{entry.action || 'updated'}</span>
              </header>
              <p>{entry.content}</p>
              <small>{formatTimestamp(entry.timestamp)}</small>
            </li>
          ))}
      </ul>
    </section>
  );
}
