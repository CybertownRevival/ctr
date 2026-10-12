import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

import {
  MAX_DECODED_BYTES,
  MAX_STORED_BYTES,
  ObjectSourceService,
} from './object-source.service';

const VRML = '#VRML V2.0 utf8\nWorldInfo { title "Fixture" }\n';

describe('ObjectSourceService', () => {
  let assetsDir: string;
  let objectRoot: string;
  let originalAssetsDir: string | undefined;
  let service: ObjectSourceService;

  function writeObject(directory: string, filename: string, contents: Buffer | string): void {
    const target = path.join(objectRoot, directory);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, filename), contents);
  }

  beforeEach(() => {
    originalAssetsDir = process.env.ASSETS_DIR;
    assetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-object-source-'));
    objectRoot = path.join(assetsDir, 'object');
    fs.mkdirSync(objectRoot, { recursive: true });
    process.env.ASSETS_DIR = assetsDir;
    service = new ObjectSourceService();
  });

  afterEach(() => {
    process.env.ASSETS_DIR = originalAssetsDir;
    fs.rmSync(assetsDir, { recursive: true, force: true });
  });

  describe('readSource - plain VRML', () => {
    it('reads an uncompressed .wrl and reports identity encoding', async () => {
      writeObject('uuid-a', 'a.wrl', VRML);

      const result = await service.readSource({ directory: 'uuid-a', filename: 'a.wrl' });

      expect(result.error).toBeNull();
      expect(result.encoding).toBe('identity');
      expect(result.text).toBe(VRML);
      expect(result.storedBytes).toBe(Buffer.byteLength(VRML));
      expect(result.decodedBytes).toBe(Buffer.byteLength(VRML));
      expect(result.replacementCharacters).toBe(0);
      expect(result.utf8Valid).toBe(true);
      expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('readSource - gzip stored under a .wrl name', () => {
    it('decompresses transparently and reports both sizes separately', async () => {
      const compressed = zlib.gzipSync(Buffer.from(VRML));
      writeObject('uuid-b', 'b.wrl', compressed);

      const result = await service.readSource({ directory: 'uuid-b', filename: 'b.wrl' });

      expect(result.error).toBeNull();
      expect(result.encoding).toBe('gzip');
      expect(result.text).toBe(VRML);
      expect(result.storedBytes).toBe(compressed.length);
      expect(result.decodedBytes).toBe(Buffer.byteLength(VRML));
      expect(result.storedBytes).not.toBe(result.decodedBytes);
    });

    it('hashes the stored bytes, not the decompressed ones', async () => {
      const compressed = zlib.gzipSync(Buffer.from(VRML));
      writeObject('uuid-c', 'c.wrl', compressed);
      writeObject('uuid-d', 'd.wrl', VRML);

      const gzipResult = await service.readSource({ directory: 'uuid-c', filename: 'c.wrl' });
      const plainResult = await service.readSource({ directory: 'uuid-d', filename: 'd.wrl' });

      expect(gzipResult.text).toBe(plainResult.text);
      expect(gzipResult.sha256).not.toBe(plainResult.sha256);
    });
  });

  describe('readSource - failure modes are values, never throws', () => {
    it('reports a missing file', async () => {
      const result = await service.readSource({ directory: 'nope', filename: 'nope.wrl' });

      expect(result.error).toBe('missing');
      expect(result.text).toBeNull();
    });

    it('reports a corrupt gzip member', async () => {
      const compressed = zlib.gzipSync(Buffer.from(VRML));
      writeObject('uuid-e', 'e.wrl', compressed.slice(0, compressed.length - 12));

      const result = await service.readSource({ directory: 'uuid-e', filename: 'e.wrl' });

      expect(result.error).toBe('gzip_corrupt');
      expect(result.encoding).toBe('gzip');
      expect(result.storedBytes).toBeGreaterThan(0);
      expect(result.text).toBeNull();
    });

    it('reports gzip magic followed by garbage as corrupt', async () => {
      writeObject('uuid-f', 'f.wrl', Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x01, 0x02, 0x03]));

      expect((await service.readSource({ directory: 'uuid-f', filename: 'f.wrl' })).error)
        .toBe('gzip_corrupt');
    });

    it('refuses a small gzip that inflates past the ceiling', async () => {
      const bomb = zlib.gzipSync(Buffer.alloc(MAX_DECODED_BYTES + 1024, 0x41));
      expect(bomb.length).toBeLessThan(MAX_STORED_BYTES);
      writeObject('uuid-g', 'g.wrl', bomb);

      const result = await service.readSource({ directory: 'uuid-g', filename: 'g.wrl' });

      expect(result.error).toBe('gzip_too_large');
      expect(result.text).toBeNull();
    });

    it('refuses an oversized stored file without reading it', async () => {
      writeObject('uuid-h', 'h.wrl', Buffer.alloc(MAX_STORED_BYTES + 1, 0x41));

      const result = await service.readSource({ directory: 'uuid-h', filename: 'h.wrl' });

      expect(result.error).toBe('too_large');
      expect(result.storedBytes).toBe(MAX_STORED_BYTES + 1);
      expect(result.text).toBeNull();
    });

    it('reports a directory where a file was expected', async () => {
      fs.mkdirSync(path.join(objectRoot, 'uuid-i', 'i.wrl'), { recursive: true });

      expect((await service.readSource({ directory: 'uuid-i', filename: 'i.wrl' })).error)
        .toBe('missing');
    });

    it('reports a missing ASSETS_DIR rather than resolving against the process cwd',
      async () => {
        delete process.env.ASSETS_DIR;

        expect((await service.readSource({ directory: 'uuid-a', filename: 'a.wrl' })).error)
          .toBe('not_configured');
      });

    it('counts replacement characters for invalid UTF-8 but still returns the text',
      async () => {
        writeObject('uuid-j', 'j.wrl', Buffer.concat([
          Buffer.from('#VRML V2.0 utf8\n'),
          Buffer.from([0xff, 0xfe, 0xfd]),
        ]));

        const result = await service.readSource({ directory: 'uuid-j', filename: 'j.wrl' });

        expect(result.error).toBeNull();
        expect(result.replacementCharacters).toBeGreaterThan(0);
        expect(result.text).toContain('#VRML V2.0 utf8');
      });

    it('reports genuinely malformed bytes as invalid UTF-8', async () => {
      // 0xff, 0xfe and 0xfd are not valid UTF-8 lead bytes at all -- there is
      // no legitimate character these bytes could be encoding.
      writeObject('uuid-j', 'j.wrl', Buffer.concat([
        Buffer.from('#VRML V2.0 utf8\n'),
        Buffer.from([0xff, 0xfe, 0xfd]),
      ]));

      const result = await service.readSource({ directory: 'uuid-j', filename: 'j.wrl' });

      expect(result.utf8Valid).toBe(false);
    });

    it('does not mistake a literal U+FFFD for invalid UTF-8', async () => {
      // The replacement character itself has a valid UTF-8 encoding (EF BF
      // BD), so a creator including it on purpose must not be flagged as if
      // the file were malformed.
      const withReplacementCharacter = `${VRML}# � literal replacement character\n`;
      writeObject('uuid-k', 'k.wrl', withReplacementCharacter);

      const result = await service.readSource({ directory: 'uuid-k', filename: 'k.wrl' });

      expect(result.error).toBeNull();
      expect(result.replacementCharacters).toBeGreaterThan(0);
      expect(result.utf8Valid).toBe(true);
      expect(result.text).toBe(withReplacementCharacter);
    });

    it('reports malformed UTF-8 the same way through a gzip-decoded source', async () => {
      const malformed = Buffer.concat([
        Buffer.from('#VRML V2.0 utf8\n'),
        Buffer.from([0xff, 0xfe, 0xfd]),
      ]);
      writeObject('uuid-l', 'l.wrl', zlib.gzipSync(malformed));

      const result = await service.readSource({ directory: 'uuid-l', filename: 'l.wrl' });

      expect(result.error).toBeNull();
      expect(result.encoding).toBe('gzip');
      expect(result.utf8Valid).toBe(false);
    });

    it('confirms a literal U+FFFD stays valid through a gzip-decoded source', async () => {
      const withReplacementCharacter = Buffer.from(`${VRML}# � literal\n`, 'utf8');
      writeObject('uuid-m', 'm.wrl', zlib.gzipSync(withReplacementCharacter));

      const result = await service.readSource({ directory: 'uuid-m', filename: 'm.wrl' });

      expect(result.error).toBeNull();
      expect(result.encoding).toBe('gzip');
      expect(result.utf8Valid).toBe(true);
    });
  });

  describe('resolveAssetPath - containment', () => {
    it('resolves an ordinary object path inside the asset root', () => {
      const resolved = service.resolveAssetPath({ directory: 'uuid-a', filename: 'a.wrl' });

      expect(resolved).toEqual({ path: path.join(objectRoot, 'uuid-a', 'a.wrl'), error: null });
    });

    it('never returns a path alongside an error, so callers cannot confuse the two', () => {
      const refused = service.resolveAssetPath({ directory: '../../etc', filename: 'passwd' });

      expect(refused.path).toBeNull();
      expect(refused.error).toBe('outside_assets_root');
    });

    it('refuses a directory that climbs out with ..', () => {
      expect(service.resolveAssetPath({ directory: '../../etc', filename: 'passwd' }).error)
        .toBe('outside_assets_root');
      expect(service.resolveAssetPath({ directory: '..', filename: 'x.wrl' }).error)
        .toBe('outside_assets_root');
    });

    it('refuses a filename that climbs out with ..', () => {
      expect(
        service.resolveAssetPath({ directory: 'uuid-a', filename: '../../../etc/passwd' }).error,
      ).toBe('outside_assets_root');
    });

    it('refuses an absolute filename that escapes the root entirely', () => {
      expect(service.resolveAssetPath({ directory: 'uuid-a', filename: '/etc/passwd' }).error)
        .toBe('outside_assets_root');
    });

    it('refuses a SIBLING directory whose name merely starts with the root name', () => {
      // `<assets>/object-evil/x.wrl` begins with `<assets>/object`, so a naive
      // startsWith containment check would wrongly admit it.
      const escape = service.resolveAssetPath({
        directory: `..${path.sep}object-evil`,
        filename: 'x.wrl',
      });

      expect(escape.error).toBe('outside_assets_root');
    });

    it('refuses the asset root itself', () => {
      expect(service.resolveAssetPath({ directory: '.', filename: '.' }).error)
        .toBe('outside_assets_root');
    });

    it('refuses an empty directory or filename', () => {
      expect(service.resolveAssetPath({ directory: '', filename: 'a.wrl' }).error).toBe('missing');
      expect(service.resolveAssetPath({ directory: 'uuid-a', filename: '' }).error)
        .toBe('missing');
    });

    it('does not read anything outside the root even via readSource', async () => {
      const outside = path.join(assetsDir, 'object-evil');
      fs.mkdirSync(outside, { recursive: true });
      fs.writeFileSync(path.join(outside, 'x.wrl'), 'SECRET');

      const result = await service.readSource({
        directory: `..${path.sep}object-evil`,
        filename: 'x.wrl',
      });

      expect(result.error).toBe('outside_assets_root');
      expect(result.text).toBeNull();
    });
  });

  describe('readAssetMetadata', () => {
    it('returns size and hash for a thumbnail', async () => {
      writeObject('uuid-k', 'k.jpg', Buffer.alloc(64, 0x7f));

      const result = await service.readAssetMetadata({
        directory: 'uuid-k',
        filename: 'k.jpg',
      });

      expect(result.error).toBeNull();
      expect(result.bytes).toBe(64);
      expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    });

    it('reports a missing asset without throwing', async () => {
      const result = await service.readAssetMetadata({
        directory: 'uuid-k',
        filename: 'absent.jpg',
      });

      expect(result.error).toBe('missing');
      expect(result.bytes).toBeNull();
    });

    it('applies the same containment rule', async () => {
      const result = await service.readAssetMetadata({
        directory: '../../etc',
        filename: 'passwd',
      });

      expect(result.error).toBe('outside_assets_root');
    });
  });

  describe('containment - the filesystem, not just the string', () => {
    /** A file deliberately outside the assets root, the thing an escape reaches. */
    function writeSecret(contents = 'TOP SECRET\n'): string {
      const secret = path.join(assetsDir, 'secret.wrl');
      fs.writeFileSync(secret, contents);
      return secret;
    }

    it('still rejects lexical traversal out of the root', async () => {
      writeSecret();

      const result = await service.readSource({ directory: '..', filename: 'secret.wrl' });

      expect(result.error).toBe('outside_assets_root');
      expect(result.text).toBeNull();
    });

    it('still rejects a sibling directory that merely shares the root prefix', async () => {
      const sibling = `${objectRoot}-evil`;
      fs.mkdirSync(sibling, { recursive: true });
      fs.writeFileSync(path.join(sibling, 'x.wrl'), VRML);

      const result = await service.readSource({
        directory: `../${path.basename(objectRoot)}-evil`,
        filename: 'x.wrl',
      });

      expect(result.error).toBe('outside_assets_root');
    });

    it('rejects a file symlink pointing outside the root', async () => {
      const secret = writeSecret();
      fs.mkdirSync(path.join(objectRoot, 'uuid-link'), { recursive: true });
      fs.symlinkSync(secret, path.join(objectRoot, 'uuid-link', 'a.wrl'));

      const result = await service.readSource({ directory: 'uuid-link', filename: 'a.wrl' });

      expect(result.error).toBe('outside_assets_root');
      expect(result.text).toBeNull();
    });

    it('rejects a directory symlink pointing outside the root', async () => {
      const outside = path.join(assetsDir, 'elsewhere');
      fs.mkdirSync(outside, { recursive: true });
      fs.writeFileSync(path.join(outside, 'a.wrl'), 'TOP SECRET\n');
      fs.symlinkSync(outside, path.join(objectRoot, 'uuid-dir'));

      const result = await service.readSource({ directory: 'uuid-dir', filename: 'a.wrl' });

      expect(result.error).toBe('outside_assets_root');
    });

    it('allows a symlink that stays inside the root', async () => {
      writeObject('uuid-real', 'a.wrl', VRML);
      fs.mkdirSync(path.join(objectRoot, 'uuid-alias'), { recursive: true });
      fs.symlinkSync(
        path.join(objectRoot, 'uuid-real', 'a.wrl'),
        path.join(objectRoot, 'uuid-alias', 'a.wrl'),
      );

      const result = await service.readSource({ directory: 'uuid-alias', filename: 'a.wrl' });

      expect(result.error).toBeNull();
      expect(result.text).toBe(VRML);
    });

    it('keeps working when ASSETS_DIR is itself a symlink', async () => {
      // The deployment mounts assets through a link; the configured path and the
      // real path differ for every file, which must not read as an escape.
      const realAssets = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-real-assets-'));
      fs.mkdirSync(path.join(realAssets, 'object', 'uuid-a'), { recursive: true });
      fs.writeFileSync(path.join(realAssets, 'object', 'uuid-a', 'a.wrl'), VRML);

      const linked = path.join(os.tmpdir(), `ctr-linked-assets-${process.pid}`);
      fs.rmSync(linked, { recursive: true, force: true });
      fs.symlinkSync(realAssets, linked);
      process.env.ASSETS_DIR = linked;

      try {
        const result = await new ObjectSourceService()
          .readSource({ directory: 'uuid-a', filename: 'a.wrl' });

        expect(result.error).toBeNull();
        expect(result.text).toBe(VRML);
      } finally {
        fs.rmSync(linked, { recursive: true, force: true });
        fs.rmSync(realAssets, { recursive: true, force: true });
      }
    });

    it('reports an absent file as missing rather than as an escape', async () => {
      const result = await service.readSource({ directory: 'uuid-a', filename: 'nope.wrl' });

      expect(result.error).toBe('missing');
    });

    it('reports a dangling symlink as missing rather than as an escape', async () => {
      fs.mkdirSync(path.join(objectRoot, 'uuid-dangle'), { recursive: true });
      fs.symlinkSync(
        path.join(assetsDir, 'does-not-exist.wrl'),
        path.join(objectRoot, 'uuid-dangle', 'a.wrl'),
      );

      const result = await service.readSource({ directory: 'uuid-dangle', filename: 'a.wrl' });

      expect(result.error).toBe('missing');
    });

    it('reads an ordinary file inside the root exactly as before', async () => {
      writeObject('uuid-a', 'a.wrl', VRML);

      const result = await service.readSource({ directory: 'uuid-a', filename: 'a.wrl' });

      expect(result.error).toBeNull();
      expect(result.text).toBe(VRML);
    });

    it('applies the same containment to asset metadata reads', async () => {
      const secret = writeSecret();
      fs.mkdirSync(path.join(objectRoot, 'uuid-link'), { recursive: true });
      fs.symlinkSync(secret, path.join(objectRoot, 'uuid-link', 't.jpg'));

      const meta = await service.readAssetMetadata({
        directory: 'uuid-link',
        filename: 't.jpg',
      });

      expect(meta.error).toBe('outside_assets_root');
      expect(meta.sha256).toBeNull();
    });
  });

});
