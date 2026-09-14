import { DEFAULT_MAX_TOKENS, tokenize } from './vrml-tokenizer';

function values(text: string): string[] {
  return tokenize(text).tokens.map(token => token.value);
}

function kinds(text: string): string[] {
  return tokenize(text).tokens.map(token => token.kind);
}

describe('tokenize', () => {
  it('splits words, strings and structural punctuation', () => {
    expect(values('Shape { appearance "x" }')).toEqual(['Shape', '{', 'appearance', 'x', '}']);
    expect(kinds('Shape { "x" }')).toEqual(['word', 'punct', 'string', 'punct']);
  });

  it('treats commas as whitespace, as VRML97 does', () => {
    expect(values('translation 0, -1.75, 0')).toEqual(['translation', '0', '-1.75', '0']);
  });

  it('drops comments', () => {
    expect(values('# a Sound node lives here\nShape {}')).toEqual(['Shape', '{', '}']);
  });

  it('drops a trailing comment with no newline after it', () => {
    expect(values('Shape {} # Sound')).toEqual(['Shape', '{', '}']);
  });

  it('preserves a # that appears inside a string', () => {
    expect(values('info "colour #ff0000 and a Sound"'))
      .toEqual(['info', 'colour #ff0000 and a Sound']);
  });

  it('resolves \\" and \\\\ escapes and strips the surrounding quotes', () => {
    expect(values('info "he said \\"hi\\""')).toEqual(['info', 'he said "hi"']);
    expect(values('info "back\\\\slash"')).toEqual(['info', 'back\\slash']);
  });

  it('leaves any other backslash literal, as Windows texture paths rely on', () => {
    expect(values('url "textures\\wood.jpg"')).toEqual(['url', 'textures\\wood.jpg']);
  });

  it('reports an unterminated string without throwing', () => {
    const result = tokenize('info "never closed');

    expect(result.unterminatedString).toBe(true);
    expect(result.tokens[1]).toEqual(
      expect.objectContaining({ kind: 'string', value: 'never closed' }),
    );
  });

  it('handles CRLF and LF line endings identically', () => {
    expect(values('#VRML V2.0 utf8\r\nShape {}\r\n'))
      .toEqual(values('#VRML V2.0 utf8\nShape {}\n'));
  });

  it('strips a leading byte order mark', () => {
    expect(values('﻿Shape {}')).toEqual(['Shape', '{', '}']);
  });

  it('does not treat unbalanced braces as an error', () => {
    expect(values('Group { children [ Shape {')).toEqual(
      ['Group', '{', 'children', '[', 'Shape', '{'],
    );
  });

  it('records the source offset of each token', () => {
    const [first, second] = tokenize('  Shape {').tokens;

    expect(first.index).toBe(2);
    expect(second.index).toBe(8);
  });

  it('stops cleanly at maxTokens instead of running unbounded', () => {
    const result = tokenize('a b c d e f', { maxTokens: 3 });

    expect(result.truncated).toBe(true);
    expect(result.tokens).toHaveLength(3);
  });

  it('defaults to a bounded token budget', () => {
    expect(DEFAULT_MAX_TOKENS).toBeGreaterThan(0);
    expect(tokenize('Shape {}').truncated).toBe(false);
  });

  describe('the budget check ignores trailing non-tokens', () => {
    // `a b c` is exactly 3 tokens with maxTokens: 3, so nothing was cut off
    // in any of these -- the budget was reached exactly at EOF, not before
    // it, and reporting `truncated` for any of them would be a false
    // positive a checker page or export would show as data loss that never
    // happened.
    it('reports complete at exactly maxTokens with nothing following', () => {
      const result = tokenize('a b c', { maxTokens: 3 });

      expect(result.truncated).toBe(false);
      expect(result.tokens).toHaveLength(3);
    });

    it('reports complete at exactly maxTokens followed only by whitespace', () => {
      const result = tokenize('a b c   \n\t  ', { maxTokens: 3 });

      expect(result.truncated).toBe(false);
      expect(result.tokens).toHaveLength(3);
    });

    it('reports complete at exactly maxTokens followed only by a comment', () => {
      const result = tokenize('a b c # trailing comment, not a token', { maxTokens: 3 });

      expect(result.truncated).toBe(false);
      expect(result.tokens).toHaveLength(3);
    });

    it('still reports truncated when one real token follows the budget', () => {
      const result = tokenize('a b c d', { maxTokens: 3 });

      expect(result.truncated).toBe(true);
      expect(result.tokens).toHaveLength(3);
    });

    it('still reports truncated when a real token follows trailing whitespace', () => {
      const result = tokenize('a b c   d', { maxTokens: 3 });

      expect(result.truncated).toBe(true);
      expect(result.tokens).toHaveLength(3);
    });
  });
});
