import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { createSpyObj } from 'jest-createspyobj';

import { findingSeverity, MallInspectionService } from './mall-inspection.service';
import { ObjectSourceService } from '../object-source/object-source.service';
import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
} from '../../repositories';

const POCKET_MOON = `#VRML V2.0 utf8

WorldInfo {
  title "Pocket Moon Playset"
  info [
    "Made By: BassMekanik"
    "Uploaded: August, 2026"
    "Store: Toy Store"
    "Limited To: UNLIMITED"
    "Mall Price: 75 CC"
  ]
}
DEF Lid Group { children [ Shape { geometry Box {} } ] }
DEF Open TouchSensor {}
DEF Spin TimeSensor {}
`;

function record(overrides: { [key: string]: unknown } = {}) {
  return {
    id: 3339,
    name: 'Pocket Moon Playset',
    directory: 'uuid-moon',
    filename: 'moon.wrl',
    image: 'moon.jpg',
    texture: null,
    member_id: 812,
    price: 75,
    quantity: 25,
    limit: null,
    status: 2,
    mall_expiration: null,
    created_at: '2026-08-20T08:02:43.000Z',
    updated_at: '2026-08-20T08:02:43.000Z',
    description: null,
    ...overrides,
  };
}

describe('MallInspectionService', () => {
  let assetsDir: string;
  let objectRoot: string;
  let originalAssetsDir: string | undefined;
  let objectRepository: jest.Mocked<ObjectRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let mallRepository: jest.Mocked<MallRepository>;
  let objectInstanceRepository: jest.Mocked<ObjectInstanceRepository>;
  let service: MallInspectionService;

  function writeAsset(directory: string, filename: string, contents: Buffer | string): void {
    const target = path.join(objectRoot, directory);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, filename), contents);
  }

  function findingCodes(findings: { code: string }[]): string[] {
    return findings.map(finding => finding.code);
  }

  beforeEach(() => {
    originalAssetsDir = process.env.ASSETS_DIR;
    assetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-inspection-'));
    objectRoot = path.join(assetsDir, 'object');
    fs.mkdirSync(objectRoot, { recursive: true });
    process.env.ASSETS_DIR = assetsDir;

    objectRepository = createSpyObj(ObjectRepository);
    memberRepository = createSpyObj(MemberRepository);
    mallRepository = createSpyObj(MallRepository);
    objectInstanceRepository = createSpyObj(ObjectInstanceRepository);

    memberRepository.findById.mockResolvedValue({ username: 'BassMekanik' } as never);
    mallRepository.getStore.mockResolvedValue([]);
    objectInstanceRepository.countByObjectId.mockResolvedValue(0);

    service = new MallInspectionService(
      objectRepository,
      memberRepository,
      mallRepository,
      objectInstanceRepository,
      new ObjectSourceService(),
    );
  });

  afterEach(() => {
    process.env.ASSETS_DIR = originalAssetsDir;
    fs.rmSync(assetsDir, { recursive: true, force: true });
  });

  it('returns null for an object that does not exist', async () => {
    objectRepository.findById.mockResolvedValue(undefined as never);

    expect(await service.inspect(1)).toBeNull();
  });

  describe('a healthy gzip-compressed upload', () => {
    beforeEach(() => {
      objectRepository.findById.mockResolvedValue(record() as never);
      mallRepository.getStore.mockResolvedValue([{ id: 1205, name: 'Toy Store' }] as never);
      writeAsset('uuid-moon', 'moon.wrl', zlib.gzipSync(Buffer.from(POCKET_MOON)));
      writeAsset('uuid-moon', 'moon.jpg', Buffer.alloc(32));
    });

    it('reports the encoding and both byte counts separately', async () => {
      const inspection = await service.inspect(3339);

      expect(inspection.source.error).toBeNull();
      expect(inspection.source.encoding).toBe('gzip');
      expect(inspection.source.decodedBytes).toBe(Buffer.byteLength(POCKET_MOON));
      expect(inspection.source.storedBytes).toBeLessThan(inspection.source.decodedBytes);
    });

    it('surfaces the WorldInfo without the checker downloading anything', async () => {
      const inspection = await service.inspect(3339);

      expect(inspection.vrml.worldInfo[0].title).toBe('Pocket Moon Playset');
      expect(inspection.vrml.worldInfo[0].info).toContain('Made By: BassMekanik');
    });

    it('compares WorldInfo against the CTR record', async () => {
      const inspection = await service.inspect(3339);
      const verdicts: { [field: string]: string } = {};
      inspection.comparisons.forEach(comparison => {
        verdicts[comparison.field] = comparison.verdict;
      });

      expect(verdicts).toEqual({
        name: 'MATCH',
        creator: 'MATCH',
        price: 'MATCH',
        limit: 'MATCH',
        store: 'MATCH',
      });
    });

    it('raises no findings for a clean object', async () => {
      expect((await service.inspect(3339)).findings).toEqual([]);
    });

    it('exposes public asset urls and never a filesystem path', async () => {
      const inspection = await service.inspect(3339);
      const serialised = JSON.stringify(inspection);

      expect(inspection.object.assets.wrl.url).toBe('/assets/object/uuid-moon/moon.wrl');
      expect(serialised).not.toContain(assetsDir);
      expect(serialised).not.toContain(os.tmpdir());
    });

    it('reports the CTR views the object belongs to', async () => {
      const inspection = await service.inspect(3339);

      expect(inspection.object.ctrViews.pending).toBe(true);
      expect(inspection.object.ctrViews.stocked).toBe(false);
      expect(inspection.object.statusLabel).toBe('Pending');
    });
  });

  describe('rule observations', () => {
    beforeEach(() => {
      objectRepository.findById.mockResolvedValue(record() as never);
    });

    it('reports forbidden nodes that are genuinely present', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Sound { source AudioClip { url "beep.wav" } }
Inline { url "other.wrl" }
DirectionalLight {}
`);

      const findings = (await service.inspect(3339)).findings;

      expect(findingCodes(findings).filter(code => code === 'forbidden_node')).toHaveLength(3);
    });

    it('does not report forbidden nodes that only appear inside comments', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
# there is no Sound { } and no Inline { } in this object
Shape {}
`);

      expect(findingCodes((await service.inspect(3339)).findings))
        .not.toContain('forbidden_node');
    });

    it('reports more than one distinct texture', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "a.jpg" } } }
Shape { appearance Appearance { texture ImageTexture { url "b.jpg" } } }
`);
      writeAsset('uuid-moon', 'a.jpg', Buffer.alloc(8));
      writeAsset('uuid-moon', 'b.jpg', Buffer.alloc(8));

      expect(findingCodes((await service.inspect(3339)).findings))
        .toContain('multiple_textures');
    });

    it('reports a texture the object references but does not ship', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "absent.jpg" } } }
`);

      expect(findingCodes((await service.inspect(3339)).findings)).toContain('texture_missing');
    });

    it('classifies an unreadable source as needing staff review', async () => {
      // Deliberately writes no WRL, so the stored file is genuinely absent.
      const findings = (await service.inspect(3339)).findings;
      const missing = findings.find(finding => finding.code === 'missing');
      expect(missing).toBeDefined();
      // The page could not establish anything below it, so it must not read as a
      // mere warning about the object.
      expect(missing.severity).toBe('needs_staff_review');
    });

    it('classifies an established rule breach as a warning', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "http://x.test/a.jpg" } } }
`);

      const findings = (await service.inspect(3339)).findings;
      const external = findings.find(finding => finding.code === 'external_reference');
      expect(external.severity).toBe('warning');
    });

    it('classifies a fact that decides nothing as information', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "a.jpg" } } }
Shape { appearance Appearance { texture ImageTexture { url "b.jpg" } } }
`);
      writeAsset('uuid-moon', 'a.jpg', Buffer.alloc(8));
      writeAsset('uuid-moon', 'b.jpg', Buffer.alloc(8));

      const findings = (await service.inspect(3339)).findings;
      const multiple = findings.find(finding => finding.code === 'multiple_textures');
      expect(multiple.severity).toBe('info');
    });

    it('gives every finding a severity', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
Shape { appearance Appearance { texture ImageTexture { url "../escape.jpg" } } }
`);

      const findings = (await service.inspect(3339)).findings;
      expect(findings.length).toBeGreaterThan(0);
      findings.forEach(finding => {
        expect(['info', 'warning', 'needs_staff_review']).toContain(finding.severity);
      });
    });

    it('falls back to needing staff review for an unrecognised code', () => {
      expect(findingSeverity('something_the_scanner_invented')).toBe('needs_staff_review');
    });

    it('reports a texture referenced through a subdirectory that does not exist', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "textures/wood.jpg" } } }
`);

      const codes = findingCodes((await service.inspect(3339)).findings);
      expect(codes).toContain('texture_subdirectory');
      // In-directory, so it is not an escape and must not be reported as one.
      expect(codes).not.toContain('external_reference');
    });

    it('stays quiet when a subdirectory texture really is on disk', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "textures/wood.jpg" } } }
`);
      writeAsset(path.join('uuid-moon', 'textures'), 'wood.jpg', Buffer.alloc(8));

      const codes = findingCodes((await service.inspect(3339)).findings);
      expect(codes).not.toContain('texture_subdirectory');
      expect(codes).not.toContain('texture_missing');
    });

    it('reports a parent-traversal texture as external, not as a subdirectory', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "../uuid-other/wood.jpg" } } }
`);

      const codes = findingCodes((await service.inspect(3339)).findings);
      expect(codes).toContain('external_reference');
      expect(codes).not.toContain('texture_subdirectory');
    });

    it('reports an external reference', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
Shape { appearance Appearance { texture ImageTexture { url "http://x.test/a.jpg" } } }
`);

      expect(findingCodes((await service.inspect(3339)).findings))
        .toContain('external_reference');
    });

    it('does not treat an inline Script body as an external reference', async () => {
      writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
DEF Anim Script { url "vrmlscript: function f(a, t) { return a; }" }
`);

      expect(findingCodes((await service.inspect(3339)).findings))
        .not.toContain('external_reference');
    });

    it('reports when the decompressed VRML exceeds the 80 KB rule the upload passed',
      async () => {
        const padding = `\n# ${'x'.repeat(90000)}\n`;
        writeAsset('uuid-moon', 'moon.wrl', zlib.gzipSync(Buffer.from(POCKET_MOON + padding)));

        const findings = (await service.inspect(3339)).findings;

        expect(findingCodes(findings)).toContain('decoded_exceeds_upload_limit');
      });

    it('reports a missing WorldInfo without refusing to render the rest', async () => {
      writeAsset('uuid-moon', 'moon.wrl', '#VRML V2.0 utf8\nShape {}\n');

      const inspection = await service.inspect(3339);

      expect(findingCodes(inspection.findings)).toContain('no_worldinfo');
      expect(inspection.object.name).toBe('Pocket Moon Playset');
      expect(inspection.vrml).not.toBeNull();
    });
  });

  describe('UTF-8 validity', () => {
    beforeEach(() => {
      objectRepository.findById.mockResolvedValue(record() as never);
    });

    it('does not raise an encoding finding for a file that legitimately contains U+FFFD',
      async () => {
        // U+FFFD has a valid UTF-8 encoding of its own (EF BF BD); a creator
        // is allowed to include it, so its mere presence must not be read as
        // proof the stored bytes were malformed.
        writeAsset('uuid-moon', 'moon.wrl', `#VRML V2.0 utf8
WorldInfo { title "Pocket Moon Playset" }
# comment containing a literal replacement character: �
`);

        const inspection = await service.inspect(3339);

        expect(inspection.source.replacementCharacters).toBeGreaterThan(0);
        expect(inspection.source.utf8Valid).toBe(true);
        expect(findingCodes(inspection.findings)).not.toContain('encoding_warnings');
      });

    it('raises the encoding finding for genuinely malformed UTF-8 bytes', async () => {
      writeAsset('uuid-moon', 'moon.wrl', Buffer.concat([
        Buffer.from('#VRML V2.0 utf8\nWorldInfo { title "Pocket Moon Playset" }\n'),
        Buffer.from([0xff, 0xfe, 0xfd]),
      ]));

      const inspection = await service.inspect(3339);

      expect(inspection.source.utf8Valid).toBe(false);
      const finding = inspection.findings.find(f => f.code === 'encoding_warnings');
      expect(finding).toBeDefined();
      expect(finding.severity).toBe('needs_staff_review');
    });
  });

  describe('broken uploads still produce a usable page', () => {
    beforeEach(() => {
      objectRepository.findById.mockResolvedValue(record() as never);
    });

    it('reports a missing file and still returns the CTR record', async () => {
      const inspection = await service.inspect(3339);

      expect(inspection.source.error).toBe('missing');
      expect(inspection.vrml).toBeNull();
      expect(inspection.comparisons).toBeNull();
      expect(findingCodes(inspection.findings)).toEqual(['missing']);
      expect(inspection.object.name).toBe('Pocket Moon Playset');
      expect(inspection.object.assets.thumbnail.url).toBe('/assets/object/uuid-moon/moon.jpg');
    });

    it('reports corrupt gzip and still returns the CTR record', async () => {
      const compressed = zlib.gzipSync(Buffer.from(POCKET_MOON));
      writeAsset('uuid-moon', 'moon.wrl', compressed.slice(0, 20));

      const inspection = await service.inspect(3339);

      expect(inspection.source.error).toBe('gzip_corrupt');
      expect(findingCodes(inspection.findings)).toEqual(['gzip_corrupt']);
      expect(inspection.object.price).toBe(75);
    });
  });

  describe('creator handling', () => {
    it('keeps a null creator null rather than inventing "Deleted User"', async () => {
      objectRepository.findById.mockResolvedValue(record({ member_id: null }) as never);
      writeAsset('uuid-moon', 'moon.wrl', POCKET_MOON);

      const inspection = await service.inspect(3339);

      expect(inspection.object.creator).toEqual({ memberId: null, username: null });
      expect(memberRepository.findById).not.toHaveBeenCalled();
      expect(JSON.stringify(inspection)).not.toContain('Deleted User');
    });
  });
});
