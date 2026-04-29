import React, { ClipboardEvent, FormEvent, useEffect, useState } from 'react';
import type { NoteDraft } from '../types/note';
import {
  NOTE_LIMITS,
  sanitizeMultilineText,
  sanitizePastedMultilineText,
  sanitizeSingleLineText,
  sanitizeTags,
} from '../utils/sanitize';

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
  const [tagsValue, setTagsValue] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [priorityValue, setPriorityValue] = useState<string>('0');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialNote) {
      if (mode === 'create') {
        setIdValue('');
        setTitle('');
        setContent('');
        setTagsValue('');
        setCategory('General');
        setIsPinned(false);
        setPriorityValue('0');
      }
      return;
    }

    setIdValue(String(initialNote.id));
    setTitle(initialNote.title);
    setContent(initialNote.content);
    setTagsValue(initialNote.tags.join(', '));
    setCategory(initialNote.category || 'General');
    setIsPinned(initialNote.isPinned);
    setPriorityValue(String(initialNote.priority));
  }, [initialNote, mode]);

  const submitLabel = mode === 'create' ? 'Create Note' : 'Save Changes';

  const handleContentPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const raw = event.clipboardData.getData('text/plain');
    if (!raw) {
      return;
    }

    event.preventDefault();
    const normalizedPaste = sanitizePastedMultilineText(raw);
    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart ?? content.length;
    const selectionEnd = textarea.selectionEnd ?? content.length;

    setContent((currentContent) => {
      const nextContent =
        currentContent.slice(0, selectionStart) + normalizedPaste + currentContent.slice(selectionEnd);

      window.requestAnimationFrame(() => {
        const caret = selectionStart + normalizedPaste.length;
        textarea.selectionStart = caret;
        textarea.selectionEnd = caret;
      });

      return nextContent;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const parsedId = Number(idValue);
    if (!Number.isInteger(parsedId) || parsedId < 0) {
      setLocalError('Note ID must be a non-negative integer.');
      return;
    }

    const sanitizedTitle = sanitizeSingleLineText(title).slice(0, NOTE_LIMITS.titleMaxLength);
    const sanitizedContent = sanitizeMultilineText(content);
    const sanitizedCategory =
      sanitizeSingleLineText(category).slice(0, NOTE_LIMITS.categoryMaxLength) || 'General';
    const sanitizedTags = sanitizeTags(tagsValue);

    if (!sanitizedContent) {
      setLocalError('Note content cannot be empty.');
      return;
    }

    if (sanitizedContent.length > NOTE_LIMITS.contentMaxLength) {
      setLocalError(`Content must be ${NOTE_LIMITS.contentMaxLength} characters or less.`);
      return;
    }

    const parsedPriority = Number(priorityValue);
    if (!Number.isInteger(parsedPriority) || parsedPriority < 0 || parsedPriority > 255) {
      setLocalError('Priority must be an integer between 0 and 255.');
      return;
    }

    await onSubmit({
      id: parsedId,
      title: sanitizedTitle,
      content: sanitizedContent,
      tags: sanitizedTags,
      category: sanitizedCategory,
      isPinned,
      priority: parsedPriority,
    });

    if (mode === 'create') {
      setIdValue('');
      setTitle('');
      setContent('');
      setTagsValue('');
      setCategory('General');
      setIsPinned(false);
      setPriorityValue('0');
    }
  };

  return (
    <section className="panel form-panel">
      <h2>{mode === 'create' ? 'Create Note' : 'Edit Note'}</h2>
      <form onSubmit={handleSubmit} className="note-form">
        <label>
          Note ID
          <input
            className="input"
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
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quick summary"
          />
        </label>

        <label>
          Content
          <textarea
            className="input"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onPaste={handleContentPaste}
            placeholder="Write your note"
            rows={4}
            required
          />
        </label>

        <label>
          Tags (comma separated)
          <input
            className="input"
            value={tagsValue}
            onChange={(event) => setTagsValue(event.target.value)}
            placeholder="work, ideas, urgent"
          />
        </label>

        <label>
          Category
          <input
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="General"
          />
        </label>

        <label>
          Priority (0-255)
          <input
            className="input"
            value={priorityValue}
            onChange={(event) => setPriorityValue(event.target.value)}
            inputMode="numeric"
            placeholder="0"
            required
          />
        </label>

        <label className="container">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
          />
          <span className="checkmark"></span>
          <span>Pin this note</span>
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
