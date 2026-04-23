import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import NoteForm from './NoteForm';
import { NOTE_LIMITS } from '../utils/sanitize';

describe('NoteForm', () => {
  test('sanitizes user input before submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<NoteForm mode="create" isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/note id/i), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: '  Hello\u0000   World  ' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'Line 1\n\n\nLine 2' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: 'one, two, one' } });
    fireEvent.change(screen.getByLabelText(/^category$/i), { target: { value: 'Work' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: '3' } });

    fireEvent.submit(screen.getByRole('button', { name: /create note/i }).closest('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 9,
        title: 'Hello World',
        content: 'Line 1\n\nLine 2',
        tags: ['one', 'two'],
        category: 'Work',
        priority: 3,
      })
    );
  });

  test('blocks oversized content', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const tooLong = 'x'.repeat(NOTE_LIMITS.contentMaxLength + 1);

    render(<NoteForm mode="create" isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/note id/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: tooLong } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: '1' } });

    fireEvent.submit(screen.getByRole('button', { name: /create note/i }).closest('form') as HTMLFormElement);

    expect(await screen.findByText(/characters or less/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
