import {
  NOTE_LIMITS,
  sanitizeMultilineText,
  sanitizePastedMultilineText,
  sanitizeSingleLineText,
  sanitizeTags,
} from './sanitize';

describe('sanitize utils', () => {
  test('sanitizeSingleLineText removes control chars and collapses spaces', () => {
    expect(sanitizeSingleLineText('  hello\u0000   world\n  ')).toBe('hello world');
  });

  test('sanitizeMultilineText removes control chars and normalizes line breaks', () => {
    const input = 'Line 1\r\n\r\n\r\nLine\u0007 2\n\n\nLine 3';
    expect(sanitizeMultilineText(input)).toBe('Line 1\n\nLine 2\n\nLine 3');
  });

  test('sanitizeTags deduplicates and enforces tag limits', () => {
    const longTag = 'abcdefghijklmnopqrstuvwxyz';
    const tags = sanitizeTags(`work, urgent, work, ${longTag}`);

    expect(tags).toEqual(['work', 'urgent', longTag.slice(0, NOTE_LIMITS.tagMaxLength)]);
  });

  test('sanitizePastedMultilineText removes control chars and normalizes excessive newlines', () => {
    const input = 'Line\u00a01\r\n\r\n\r\n\r\nLine\u0007 2';
    expect(sanitizePastedMultilineText(input)).toBe('Line 1\n\n\nLine 2');
  });
});
