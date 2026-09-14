import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import util, { TextDecoder } from 'util';
import zlib from 'zlib';
import { Service } from 'typedi';

/**
 * Decompression off the event loop.
 *
 * The synchronous form blocks the whole API for the duration of every inflate,
 * and the export walks the entire catalogue one object at a time -- thousands of
 * consecutive stalls that no other request can interleave with. The async form
 * enforces `maxOutputLength` exactly the same way (verified on the deployed
 * node 14.21.3: a 64 MiB zero-fill bomb is refused with ERR_BUFFER_TOO_LARGE
 * before allocation), so the gzip-bomb guard below is unchanged.
 */
const gunzip = util.promisify(zlib.gunzip);

/**
 * Reads the bytes CTR already stores for a Mall object, so staff can inspect an
 * upload without downloading it and decompressing it by hand.
 *
 * Why this exists at all: `ObjectService.uploadObjectFiles` always writes the
 * upload with a `.wrl` extension, but many creators export gzip-compressed VRML
 * (every pending object on production currently is). The name says `.wrl`, the
 * bytes say gzip, and nothing server-side has ever looked. This service is the
 * one place that resolves that.
 *
 * Nothing here ever modifies, recompresses or rewrites an upload. The stored
 * original is preserved exactly; decompression is a read-time projection only.
 */

export type ObjectSourceError =
  | 'not_configured'
  | 'outside_assets_root'
  | 'missing'
  | 'too_large'
  | 'gzip_corrupt'
  | 'gzip_too_large'
  | 'unreadable';

export type ObjectSourceEncoding = 'identity' | 'gzip';

export interface ObjectAssetReference {
  directory: string;
  filename: string;
}

export interface ObjectSourceResult {
  /** How the bytes are stored on disk. Null when the source could not be read. */
  encoding: ObjectSourceEncoding | null;
  /** Size on disk - the same number upload validation measured. */
  storedBytes: number | null;
  /** Size of the actual VRML payload. Differs from storedBytes for gzip uploads. */
  decodedBytes: number | null;
  /** Hex SHA-256 of the STORED bytes, so it identifies the file as uploaded. */
  sha256: string | null;
  text: string | null;
  /**
   * Count of literal U+FFFD in the decoded text. Kept as neutral information
   * only: U+FFFD has a valid UTF-8 encoding (`EF BF BD`) and a creator is
   * allowed to include it on purpose, so this count is NOT proof the source
   * bytes were malformed -- `utf8Valid` is.
   */
  replacementCharacters: number;
  /**
   * Whether the STORED bytes are valid UTF-8, decided from the bytes
   * themselves via a fatal decode, not from whether U+FFFD shows up in the
   * result. `true` whenever no bytes were decoded at all (failure results),
   * since nothing was found invalid.
   */
  utf8Valid: boolean;
  error: ObjectSourceError | null;
}

export interface ObjectAssetMetadata {
  bytes: number | null;
  sha256: string | null;
  error: ObjectSourceError | null;
}

/**
 * Deliberately a discriminated result rather than `string | ObjectSourceError`.
 * The error type is itself a union of string literals, so a `typeof === 'string'`
 * guard on a combined return type is always true and silently turns an error
 * sentinel into a filesystem path.
 */
export interface ResolvedAssetPath {
  path: string | null;
  error: ObjectSourceError | null;
}

/**
 * Upload validation already caps a `.wrl` at 80 KB, so a stored file above 1 MiB
 * means something is wrong rather than merely large.
 */
export const MAX_STORED_BYTES = 1024 * 1024;

/**
 * Decompression ceiling. The largest real object observed inflates about 5.4x
 * (79,639 stored to 429,379 decoded); a deliberately crafted upload could reach
 * three orders of magnitude, so this is the guard against that.
 */
export const MAX_DECODED_BYTES = 4 * 1024 * 1024;

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

const REPLACEMENT_CHARACTER = '�';

function failure(error: ObjectSourceError): ObjectSourceResult {
  return {
    encoding: null,
    storedBytes: null,
    decodedBytes: null,
    sha256: null,
    text: null,
    replacementCharacters: 0,
    utf8Valid: true,
    error,
  };
}

function countReplacementCharacters(text: string): number {
  let count = 0;
  let index = text.indexOf(REPLACEMENT_CHARACTER);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(REPLACEMENT_CHARACTER, index + 1);
  }
  return count;
}

/**
 * Decodes bytes as UTF-8 and reports whether they actually were UTF-8.
 *
 * `fatal: true` is what makes this trustworthy: a plain `buffer.toString('utf8')`
 * silently substitutes U+FFFD for anything it cannot decode and never reports
 * that it happened, which is indistinguishable from a file that legitimately
 * contains that character. A fatal decode throws instead, so validity comes
 * from the bytes, not from counting a character that has a valid encoding of
 * its own. On failure the text is still produced (non-fatal) so a checker can
 * see it and decide, but `valid` is what the finding must key off.
 */
function decodeUtf8(buffer: Buffer): { text: string; valid: boolean } {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { text, valid: true };
  } catch (error) {
    return { text: buffer.toString('utf8'), valid: false };
  }
}

@Service()
export class ObjectSourceService {

  private getAssetsRoot(): string {
    return process.env.ASSETS_DIR || '';
  }

  /**
   * Resolves an object asset path and proves it stays inside the object asset
   * root.
   *
   * Containment is checked with `path.relative`, deliberately NOT with a
   * `startsWith` prefix comparison. A prefix check is wrong twice over: it admits
   * a sibling directory whose name merely begins with the root's name
   * (`.../object-evil/x` starts with `.../object`), and it is not separator-aware.
   *
   * Callers only ever pass values taken from the database, never from a request,
   * but the check is unconditional so that stays true no matter who calls it.
   */
  public resolveAssetPath(reference: ObjectAssetReference): ResolvedAssetPath {
    const assetsRoot = this.getAssetsRoot();
    if (!assetsRoot) {
      return { path: null, error: 'not_configured' };
    }
    if (!reference.directory || !reference.filename) {
      return { path: null, error: 'missing' };
    }

    const root = path.resolve(assetsRoot, 'object');
    const target = path.resolve(root, reference.directory, reference.filename);
    const relative = path.relative(root, target);

    if (
      relative === ''
      || relative === '..'
      || relative.indexOf(`..${path.sep}`) === 0
      || path.isAbsolute(relative)
    ) {
      return { path: null, error: 'outside_assets_root' };
    }

    return { path: target, error: null };
  }

  /**
   * Containment as the filesystem actually sees it.
   *
   * `resolveAssetPath` only compares strings, so it stops `../` in a database
   * value but not a symlink sitting inside the root that points somewhere else
   * entirely. Both paths are canonicalised and compared, which also means a
   * legitimately symlinked ASSETS_DIR keeps working: the root is resolved the
   * same way the candidate is, so the two agree.
   *
   * A target that does not exist is reported as missing, not as an escape --
   * absence is not an attack.
   */
  public async resolveRealAssetPath(
    reference: ObjectAssetReference,
  ): Promise<ResolvedAssetPath> {
    const lexical = this.resolveAssetPath(reference);
    if (lexical.error !== null || lexical.path === null) {
      return lexical;
    }

    const realRoot = await this.canonicalise(path.resolve(this.getAssetsRoot(), 'object'));
    if (realRoot.error !== null || realRoot.path === null) {
      return { path: null, error: realRoot.error };
    }

    const realTarget = await this.canonicalise(lexical.path);
    if (realTarget.error !== null || realTarget.path === null) {
      return { path: null, error: realTarget.error };
    }

    const relative = path.relative(realRoot.path, realTarget.path);
    if (
      relative === ''
      || relative === '..'
      || relative.indexOf(`..${path.sep}`) === 0
      || path.isAbsolute(relative)
    ) {
      return { path: null, error: 'outside_assets_root' };
    }

    return { path: realTarget.path, error: null };
  }

  private async canonicalise(target: string): Promise<ResolvedAssetPath> {
    try {
      return { path: await fs.realpath(target), error: null };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return {
        path: null,
        error: code === 'ENOENT' || code === 'ENOTDIR' ? 'missing' : 'unreadable',
      };
    }
  }

  /** Size and hash of any object asset (thumbnail, texture) without decoding it. */
  public async readAssetMetadata(reference: ObjectAssetReference): Promise<ObjectAssetMetadata> {
    const resolved = await this.resolveRealAssetPath(reference);
    if (resolved.error !== null) {
      return { bytes: null, sha256: null, error: resolved.error };
    }

    let stats;
    try {
      stats = await fs.stat(resolved.path);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return {
        bytes: null,
        sha256: null,
        error: code === 'ENOENT' || code === 'ENOTDIR' ? 'missing' : 'unreadable',
      };
    }

    if (!stats.isFile()) {
      return { bytes: null, sha256: null, error: 'missing' };
    }
    if (stats.size > MAX_STORED_BYTES) {
      return { bytes: stats.size, sha256: null, error: 'too_large' };
    }

    try {
      const buffer = await fs.readFile(resolved.path);
      return {
        bytes: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        error: null,
      };
    } catch (error) {
      return { bytes: stats.size, sha256: null, error: 'unreadable' };
    }
  }

  /**
   * Reads a stored WRL, transparently decompressing it when the bytes are gzip,
   * and reports both sizes separately so the difference stays visible.
   *
   * Every failure mode is returned as a value. Nothing throws, because a single
   * unreadable upload must never take down a checker page or an export.
   */
  public async readSource(reference: ObjectAssetReference): Promise<ObjectSourceResult> {
    const resolved = await this.resolveRealAssetPath(reference);
    if (resolved.error !== null) {
      return failure(resolved.error);
    }

    let stats;
    try {
      stats = await fs.stat(resolved.path);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return failure(code === 'ENOENT' || code === 'ENOTDIR' ? 'missing' : 'unreadable');
    }

    if (!stats.isFile()) {
      return failure('missing');
    }
    if (stats.size > MAX_STORED_BYTES) {
      const result = failure('too_large');
      result.storedBytes = stats.size;
      return result;
    }

    let stored: Buffer;
    try {
      stored = await fs.readFile(resolved.path);
    } catch (error) {
      return failure('unreadable');
    }

    const sha256 = crypto.createHash('sha256').update(stored).digest('hex');
    const isGzip = stored.length >= 2
      && stored[0] === GZIP_MAGIC_0
      && stored[1] === GZIP_MAGIC_1;

    let decoded: Buffer;
    if (isGzip) {
      try {
        decoded = await gunzip(stored, { maxOutputLength: MAX_DECODED_BYTES });
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        const tooLarge = code === 'ERR_BUFFER_TOO_LARGE'
          || /maxOutputLength|Cannot create a string longer/i.test(String(error));
        return {
          encoding: 'gzip',
          storedBytes: stored.length,
          decodedBytes: null,
          sha256,
          text: null,
          replacementCharacters: 0,
          utf8Valid: true,
          error: tooLarge ? 'gzip_too_large' : 'gzip_corrupt',
        };
      }

      // Belt and braces: if a runtime ever ignores maxOutputLength, refuse the
      // oversized result rather than passing it on to the scanner.
      if (decoded.length > MAX_DECODED_BYTES) {
        return {
          encoding: 'gzip',
          storedBytes: stored.length,
          decodedBytes: decoded.length,
          sha256,
          text: null,
          replacementCharacters: 0,
          utf8Valid: true,
          error: 'gzip_too_large',
        };
      }
    } else {
      decoded = stored;
    }

    const { text, valid } = decodeUtf8(decoded);

    return {
      encoding: isGzip ? 'gzip' : 'identity',
      storedBytes: stored.length,
      decodedBytes: decoded.length,
      sha256,
      text,
      replacementCharacters: countReplacementCharacters(text),
      utf8Valid: valid,
      error: null,
    };
  }
}
