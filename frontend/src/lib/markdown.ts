/**
 * Minimal Markdown parsing for the Standard Terms, shared by the on-screen
 * preview and the PDF. Deliberately line-oriented and conservative: it renders
 * inline **bold**, `[links](url)`, and `#` headings, but leaves numbered clauses
 * as literal text so legal numbering is never altered (as an <ol> would).
 */

export type Segment = { text: string; bold?: boolean; href?: string };

export type MdLine = {
  kind: "heading" | "text" | "blank";
  level: number;
  segments: Segment[];
};

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/** Split a line into text / bold / link segments. */
export function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) segments.push({ text: match[1], bold: true });
    else segments.push({ text: match[2], href: match[3] });
    last = INLINE.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** Parse Markdown into renderable lines (headings, text, and blanks). */
export function parseMarkdownLines(markdown: string): MdLine[] {
  return markdown.split("\n").map((line) => {
    if (!line.trim()) return { kind: "blank", level: 0, segments: [] };
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      return {
        kind: "heading",
        level: heading[1].length,
        segments: parseInline(heading[2]),
      };
    }
    return { kind: "text", level: 0, segments: parseInline(line) };
  });
}
