/**
 * A minimal, dependency-free lexer for VRML97 source text.
 *
 * This exists because the Mall checker needs to answer questions like "does this
 * object contain a Sound node?" and "what is in its WorldInfo?" without shipping
 * staff to an external VRML editor. Answering those with substring or regular
 * expression matching over the raw file is wrong in both directions: `#` comments
 * and quoted strings (notably `Script` `url` payloads and `WorldInfo` `info`
 * entries) routinely contain node names, and a real node can be split across
 * lines in ways a pattern will miss.
 *
 * So we tokenise first and answer questions over the token stream instead. This
 * is deliberately NOT a parser - it builds no scene graph, resolves no PROTO, and
 * computes no geometry. It only produces the lexical facts a human checker would
 * otherwise read by eye.
 */

/** The lexical classes this tokenizer distinguishes. */
export type VrmlTokenKind = 'word' | 'string' | 'punct';

export interface VrmlToken {
  kind: VrmlTokenKind;
  /**
   * For `string` tokens this is the decoded value with surrounding quotes removed
   * and `\"` / `\\` escapes resolved - never the raw source slice.
   */
  value: string;
  /** Character offset of the token's first character in the source text. */
  index: number;
}

export interface TokenizeOptions {
  /**
   * Upper bound on emitted tokens. Guards against a hostile or pathological
   * upload consuming unbounded CPU. Exceeding it stops tokenisation cleanly
   * rather than throwing.
   */
  maxTokens?: number;
}

export interface TokenizeResult {
  tokens: VrmlToken[];
  /** True when `maxTokens` was hit and the token stream is incomplete. */
  truncated: boolean;
  /** Set when the source ended inside an unterminated quoted string. */
  unterminatedString: boolean;
}

export const DEFAULT_MAX_TOKENS = 500000;

const PUNCTUATION = '{}[]';

/**
 * VRML97 treats the comma as whitespace, so it never becomes a token.
 * Everything else here is ordinary whitespace.
 */
function isWhitespace(character: string): boolean {
  return character === ' '
    || character === '\t'
    || character === '\n'
    || character === '\r'
    || character === '\f'
    || character === ','
    || character === '\v';
}

function isWordBoundary(character: string): boolean {
  return isWhitespace(character)
    || PUNCTUATION.indexOf(character) !== -1
    || character === '"'
    || character === '#';
}

/**
 * Reads a quoted string starting at `start` (the opening quote).
 *
 * Only `\"` and `\\` are treated as escapes, matching VRML97. Any other
 * backslash is a literal backslash, which matters because Windows-authored
 * texture paths are full of them.
 */
function readString(text: string, start: number): { value: string; end: number; closed: boolean } {
  let value = '';
  let position = start + 1;

  while (position < text.length) {
    const character = text[position];

    if (character === '\\') {
      const next = text[position + 1];
      if (next === '"' || next === '\\') {
        value += next;
        position += 2;
        continue;
      }
      value += character;
      position += 1;
      continue;
    }

    if (character === '"') {
      return { value, end: position + 1, closed: true };
    }

    value += character;
    position += 1;
  }

  return { value, end: position, closed: false };
}

/**
 * Splits VRML97 source into words, strings and structural punctuation.
 *
 * Comments are dropped, but only when they genuinely start a comment - a `#`
 * inside a quoted string is data, not a comment, and is preserved.
 */
export function tokenize(text: string, options: TokenizeOptions = {}): TokenizeResult {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const tokens: VrmlToken[] = [];
  let unterminatedString = false;
  let position = 0;

  // A byte order mark would otherwise become part of the first word token.
  if (text.charCodeAt(0) === 0xfeff) {
    position = 1;
  }

  while (position < text.length) {
    const character = text[position];

    if (isWhitespace(character)) {
      position += 1;
      continue;
    }

    if (character === '#') {
      while (position < text.length && text[position] !== '\n') {
        position += 1;
      }
      continue;
    }

    // Checked only once whitespace and comments are already skipped, so the
    // budget is spent on tokens, not on how much trailing filler happens to
    // follow the last one. A file with exactly `maxTokens` real tokens must
    // not be reported truncated just because a blank line or a comment comes
    // after the last of them.
    if (tokens.length >= maxTokens) {
      return { tokens, truncated: true, unterminatedString };
    }

    if (character === '"') {
      const result = readString(text, position);
      tokens.push({ kind: 'string', value: result.value, index: position });
      if (!result.closed) {
        unterminatedString = true;
      }
      position = result.end;
      continue;
    }

    if (PUNCTUATION.indexOf(character) !== -1) {
      tokens.push({ kind: 'punct', value: character, index: position });
      position += 1;
      continue;
    }

    const start = position;
    while (position < text.length && !isWordBoundary(text[position])) {
      position += 1;
    }
    tokens.push({ kind: 'word', value: text.slice(start, position), index: start });
  }

  return { tokens, truncated: false, unterminatedString };
}
