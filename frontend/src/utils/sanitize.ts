export const NOTE_LIMITS = {
  titleMaxLength: 120,
  contentMaxLength: 10000,
  categoryMaxLength: 40,
  tagMaxLength: 24,
  maxTags: 10,
} as const;

function removeControlCharsExceptNewline(input: string, replacement = ''): string {
  let output = '';

  for (let idx = 0; idx < input.length; idx += 1) {
    const char = input[idx];
    const code = char.charCodeAt(0);
    const isControl = code <= 0x1f || code === 0x7f;

    if (isControl && code !== 0x0a) {
      output += replacement;
      continue;
    }

    output += char;
  }

  return output;
}

export function sanitizeSingleLineText(input: string): string {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return removeControlCharsExceptNewline(normalized, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeMultilineText(input: string): string {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return removeControlCharsExceptNewline(normalized)
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
