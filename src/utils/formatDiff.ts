import { DiffResult } from '../commands/diff';

export interface FormatOptions {
  color?: boolean;
  showUnchanged?: boolean;
}

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';

function colorize(text: string, colorCode: string, useColor: boolean): string {
  return useColor ? `${colorCode}${text}${RESET}` : text;
}

export function formatDiff(diff: DiffResult, options: FormatOptions = {}): string {
  const { color = true, showUnchanged = false } = options;
  const lines: string[] = [];

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    lines.push(colorize('✔ No differences found.', GRAY, color));
    return lines.join('\n');
  }

  for (const key of diff.added) {
    lines.push(colorize(`+ ${key}`, GREEN, color));
  }

  for (const key of diff.removed) {
    lines.push(colorize(`- ${key}`, RED, color));
  }

  for (const key of diff.changed) {
    lines.push(colorize(`~ ${key}`, YELLOW, color));
  }

  if (showUnchanged) {
    for (const key of diff.unchanged) {
      lines.push(colorize(`  ${key}`, GRAY, color));
    }
  }

  const summary = [
    diff.added.length > 0 ? `${diff.added.length} added` : '',
    diff.removed.length > 0 ? `${diff.removed.length} removed` : '',
    diff.changed.length > 0 ? `${diff.changed.length} changed` : '',
  ]
    .filter(Boolean)
    .join(', ');

  lines.push('');
  lines.push(colorize(`Summary: ${summary}`, GRAY, color));

  return lines.join('\n');
}
