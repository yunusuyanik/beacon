export function lineNumberForOffset(content: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (content.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

export function lineNumberForMatch(content: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(content);
  if (!match || match.index === undefined) return undefined;
  return lineNumberForOffset(content, match.index);
}
