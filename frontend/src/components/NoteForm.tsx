import React, { FormEvent, useEffect, useState } from 'react';
import type { NoteDraft } from '../types/note';

interface NoteFormProps {
  mode: 'create' | 'update';
  initialNote?: NoteDraft | null;
  isSubmitting: boolean;
  onSubmit: (draft: NoteDraft) => Promise<void>;
  onCancelEdit?: () => void;
}

export default function NoteForm({
  mode,
  initialNote,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}: NoteFormProps) {
  const [idValue, setIdValue] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialNote) {
      if (mode === 'create') {
        setIdValue('');
        setTitle('');
        setContent('');
      }
      return;
    }

    setIdValue(String(initialNote.id));
    setTitle(initialNote.title);
    setContent(initialNote.content);
  }, [initialNote, mode]);

  const submitLabel = mode === 'create' ? 'Create Note' : 'Save Changes';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const parsedId = Number(idValue);
    if (!Number.isInteger(parsedId) || parsedId < 0) {
      setLocalError('Note ID must be a non-negative integer.');
      return;
    }

    if (!content.trim()) {
      setLocalError('Note content cannot be empty.');
      return;
    }

    await onSubmit({
      id: parsedId,
      title: title.trim(),
      content: content.trim(),
    });

    if (mode === 'create') {
      setIdValue('');
      setTitle('');
      setContent('');
    }
  };

  return (
    <section className="panel form-panel">
      <h2>{mode === 'create' ? 'Create Note' : 'Edit Note'}</h2>
      <form onSubmit={handleSubmit} className="note-form">
        <label>
          Note ID
          <input
            value={idValue}
            onChange={(event) => setIdValue(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 1"
            required
            disabled={mode === 'update'}
          />
        </label>

        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quick summary"
          />
        </label>

        <label>
          Content
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your note"
            rows={4}
            required
          />
        </label>

        {localError ? <p className="error-text">{localError}</p> : null}

        <div className="actions-row">
          <button type="submit" className="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
          {mode === 'update' && onCancelEdit ? (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
