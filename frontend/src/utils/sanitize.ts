export const NOTE_LIMITS = {
  titleMaxLength: 120,
  contentMaxLength: 10000,
  categoryMaxLength: 40,
  tagMaxLength: 24,
  maxTags: 10,
} as const;

const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeSingleLineText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeMultilineText(input: string): string {
  return input
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeTags(input: string): string[] {
  const unique = new Set<string>();

  input
    .split(',')
    .map(sanitizeSingleLineText)
    .filter((tag) => tag.length > 0)
    .forEach((tag) => {
      if (unique.size < NOTE_LIMITS.maxTags) {
        unique.add(tag.slice(0, NOTE_LIMITS.tagMaxLength));
      }
    });

  return Array.from(unique);
}
