import { Service } from 'typedi';

import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
} from '../../repositories';
import {
  compareWorldInfo,
  ctrViewsFor,
  CtrViews,
  externalReferences,
  escapesObjectDirectory,
  FieldComparison,
  InterpretedWorldInfo,
  scanVrml,
  statusLabel,
  statusName,
  summariseNodeCounts,
  textureReferences,
  ViewpointFact,
  VrmlUrlReference,
  WorldInfoNode,
} from '../../libs';
import {
  ObjectSourceEncoding,
  ObjectSourceError,
  ObjectSourceService,
} from '../object-source/object-source.service';

/**
 * Assembles everything a Mall staff member needs to review one uploaded object
 * on a single screen: the CTR record, the counts, the stored file's real shape,
 * its WorldInfo, and where the two disagree.
 *
 * All of it is read-only, and every finding is advisory. Nothing here decides,
 * blocks or performs a moderation action.
 */

/** The 80 KB ceiling `ObjectController.add` enforces, for reference in findings. */
const WRL_UPLOAD_LIMIT_BYTES = 81920;

/** Nodes the Mall rules forbid outright, so their mere presence is worth saying. */
const FORBIDDEN_NODES = ['Inline', 'EXTERNPROTO', 'Sound', 'DirectionalLight'];

/** Cap on how many referenced textures we check for existence on disk. */
const MAX_TEXTURE_EXISTENCE_CHECKS = 10;

export interface InspectionAsset {
  filename: string | null;
  url: string | null;
}

/**
 * How much a finding should move a checker.
 *
 * The distinction that matters on this page is not "how bad" but "can the page
 * be believed". `needs_staff_review` means the inspection could not establish
 * the facts shown below it, so the staff member has to look at the file or the
 * asset themselves rather than trusting this screen. `warning` means the facts
 * WERE established and they show a problem with the object. `info` is a fact
 * worth surfacing that decides nothing on its own.
 *
 * None of these gate an action; the checker still accepts or rejects by hand.
 */
export type InspectionSeverity = 'info' | 'warning' | 'needs_staff_review';

export interface InspectionFinding {
  code: string;
  message: string;
  severity: InspectionSeverity;
}

/**
 * Severity per finding code, in one place so it cannot drift between the sites
 * that raise findings.
 *
 * Anything absent is treated as `needs_staff_review` -- an unrecognised scanner
 * warning is precisely the case where we do not know what we are looking at,
 * and silently downgrading it to `info` would be the one dishonest option.
 */
const FINDING_SEVERITY: { [code: string]: InspectionSeverity } = {
  // The source could not be read, so nothing below it was established.
  not_configured: 'needs_staff_review',
  outside_assets_root: 'needs_staff_review',
  missing: 'needs_staff_review',
  too_large: 'needs_staff_review',
  gzip_corrupt: 'needs_staff_review',
  gzip_too_large: 'needs_staff_review',
  unreadable: 'needs_staff_review',
  // The scan ran but could not finish, so the facts shown are incomplete.
  malformed_vrml: 'needs_staff_review',
  too_complex: 'needs_staff_review',
  encoding_warnings: 'needs_staff_review',
  // The comparison had to pick one of several WorldInfo nodes; which one is
  // authoritative is a judgement only a person can make.
  multiple_worldinfo: 'needs_staff_review',

  // Established facts that show something wrong with the object itself.
  bad_header: 'warning',
  no_worldinfo: 'warning',
  forbidden_node: 'warning',
  external_reference: 'warning',
  decoded_exceeds_upload_limit: 'warning',
  texture_missing: 'warning',
  texture_subdirectory: 'warning',
  texture_not_recorded: 'warning',

  // True, worth seeing, and not a violation on its own.
  multiple_textures: 'info',
};

export function findingSeverity(code: string): InspectionSeverity {
  return FINDING_SEVERITY[code] || 'needs_staff_review';
}

/**
 * What the helpers below produce. Severity is stamped once, at the point the
 * findings are assembled, so no site that raises a finding can pick a severity
 * that disagrees with `FINDING_SEVERITY`.
 */
type RawFinding = Pick<InspectionFinding, 'code' | 'message'>;

export interface InspectionSource {
  encoding: ObjectSourceEncoding | null;
  storedBytes: number | null;
  decodedBytes: number | null;
  sha256: string | null;
  replacementCharacters: number;
  utf8Valid: boolean;
  error: ObjectSourceError | null;
}

export interface InspectionVrml {
  header: string | null;
  headerIsVrml97: boolean;
  worldInfo: WorldInfoNode[];
  nodeCounts: { [nodeType: string]: number };
  protoDefinitions: string[];
  externProtoDefinitions: string[];
  textureReferences: VrmlUrlReference[];
  externalReferences: VrmlUrlReference[];
  viewpoints: ViewpointFact[];
  warnings: string[];
}

export interface MallObjectInspection {
  object: {
    id: number;
    name: string | null;
    assetDirectory: string | null;
    creator: { memberId: number | null; username: string | null };
    price: number | null;
    quantity: number | null;
    limit: number | null;
    sold: number;
    status: number;
    statusName: string;
    statusLabel: string;
    store: { id: number; name: string } | null;
    ctrViews: CtrViews;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
    mallExpiration: Date | string | null;
    description: string | null;
    assets: {
      thumbnail: InspectionAsset;
      wrl: InspectionAsset;
      texture: InspectionAsset | null;
    };
  };
  source: InspectionSource;
  /** Null when the source could not be decoded, so there was nothing to scan. */
  vrml: InspectionVrml | null;
  interpreted: InterpretedWorldInfo | null;
  comparisons: FieldComparison[] | null;
  findings: InspectionFinding[];
}

function assetUrl(directory: string | null, filename: string | null): string | null {
  if (!directory || !filename) {
    return null;
  }
  return `/assets/object/${directory}/${filename}`;
}

@Service()
export class MallInspectionService {
  constructor(
    private objectRepository: ObjectRepository,
    private memberRepository: MemberRepository,
    private mallRepository: MallRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private objectSourceService: ObjectSourceService,
  ) {}

  /**
   * Builds the full inspection payload, or null when no such object exists.
   *
   * A file that cannot be read or parsed never fails the call - the CTR record,
   * the thumbnail and the viewer must still be usable when an upload is broken,
   * because that is exactly when a checker most needs to look at it.
   */
  public async inspect(objectId: number): Promise<MallObjectInspection | null> {
    const record = await this.objectRepository.findById(objectId);
    if (!record) {
      return null;
    }

    const [member, stores, sold] = await Promise.all([
      record.member_id ? this.memberRepository.findById(record.member_id) : Promise.resolve(null),
      this.mallRepository.getStore(record.id),
      this.objectInstanceRepository.countByObjectId(record.id),
    ]);

    const store = stores && stores[0] ? { id: stores[0].id, name: stores[0].name } : null;
    const limit = record.limit === undefined ? null : record.limit;

    const source = await this.objectSourceService.readSource({
      directory: record.directory,
      filename: record.filename,
    });

    const findings: RawFinding[] = [];
    let vrml: InspectionVrml | null = null;
    let interpreted: InterpretedWorldInfo | null = null;
    let comparisons: FieldComparison[] | null = null;

    if (source.error !== null) {
      findings.push(this.describeSourceError(source.error));
    } else if (source.text !== null) {
      const scan = scanVrml(source.text);
      const textures = textureReferences(scan);

      vrml = {
        header: scan.header,
        headerIsVrml97: scan.headerIsVrml97,
        worldInfo: scan.worldInfo,
        nodeCounts: summariseNodeCounts(scan),
        protoDefinitions: scan.protoDefinitions,
        externProtoDefinitions: scan.externProtoDefinitions,
        textureReferences: textures,
        externalReferences: externalReferences(scan),
        viewpoints: scan.viewpoints,
        warnings: scan.warnings,
      };

      const comparison = compareWorldInfo(scan, {
        name: record.name ?? null,
        creatorUsername: member ? member.username : null,
        price: record.price ?? null,
        limit,
        storeName: store ? store.name : null,
      });
      interpreted = comparison.interpreted;
      comparisons = comparison.comparisons;

      findings.push(...this.describeScanWarnings(scan.warnings));
      findings.push(...this.describeRuleObservations(vrml, source.decodedBytes));
      findings.push(...await this.checkTextureFiles(record.directory, textures, record.texture));

      if (!source.utf8Valid) {
        // `replacementCharacters` is reported alongside as context, not as the
        // proof: U+FFFD has a valid UTF-8 encoding of its own, so a creator
        // legitimately including it would not make `utf8Valid` false.
        findings.push({
          code: 'encoding_warnings',
          message: source.replacementCharacters > 0
            ? `The file is not valid UTF-8: ${source.replacementCharacters} `
              + 'character(s) could not be decoded.'
            : 'The file is not valid UTF-8.',
        });
      }
    }

    return {
      object: {
        id: record.id,
        name: record.name ?? null,
        assetDirectory: record.directory ?? null,
        creator: {
          memberId: record.member_id ?? null,
          username: member ? member.username : null,
        },
        price: record.price ?? null,
        quantity: record.quantity ?? null,
        limit,
        sold,
        status: record.status,
        statusName: statusName(record.status),
        statusLabel: statusLabel(record.status),
        store,
        ctrViews: ctrViewsFor({
          status: record.status,
          sold,
          quantity: record.quantity,
          limit,
        }),
        createdAt: (record as never)['created_at'] ?? null,
        updatedAt: (record as never)['updated_at'] ?? null,
        mallExpiration: record.mall_expiration ?? null,
        description: (record as never)['description'] ?? null,
        assets: {
          thumbnail: {
            filename: record.image ?? null,
            url: assetUrl(record.directory, record.image),
          },
          wrl: {
            filename: record.filename ?? null,
            url: assetUrl(record.directory, record.filename),
          },
          texture: record.texture
            ? { filename: record.texture, url: assetUrl(record.directory, record.texture) }
            : null,
        },
      },
      source: {
        encoding: source.encoding,
        storedBytes: source.storedBytes,
        decodedBytes: source.decodedBytes,
        sha256: source.sha256,
        replacementCharacters: source.replacementCharacters,
        utf8Valid: source.utf8Valid,
        error: source.error,
      },
      vrml,
      interpreted,
      comparisons,
      findings: findings.map(finding => ({
        ...finding,
        severity: findingSeverity(finding.code),
      })),
    };
  }

  /** The decoded VRML text, for the raw-source pane and the download action. */
  public async readSourceText(objectId: number): Promise<{
    text: string | null;
    error: ObjectSourceError | 'not_found' | null;
  }> {
    const record = await this.objectRepository.findById(objectId);
    if (!record) {
      return { text: null, error: 'not_found' };
    }

    const source = await this.objectSourceService.readSource({
      directory: record.directory,
      filename: record.filename,
    });

    return { text: source.text, error: source.error };
  }

  private describeSourceError(error: ObjectSourceError): RawFinding {
    const messages: { [key in ObjectSourceError]: string } = {
      not_configured: 'The server asset directory is not configured, so the file '
        + 'could not be read.',
      outside_assets_root: 'The stored path for this object resolves outside the asset '
        + 'directory and was refused.',
      missing: 'The stored WRL file is missing from disk.',
      too_large: 'The stored WRL file is larger than the inspection limit and was not read.',
      gzip_corrupt: 'The stored WRL looks gzip-compressed but could not be decompressed.',
      gzip_too_large: 'The stored WRL decompresses to more than the inspection limit '
        + 'and was refused.',
      unreadable: 'The stored WRL file could not be read.',
    };
    return { code: error, message: messages[error] };
  }

  private describeScanWarnings(warnings: string[]): RawFinding[] {
    const messages: { [code: string]: string } = {
      bad_header: 'The first line is not "#VRML V2.0 utf8".',
      no_worldinfo: 'The object has no WorldInfo node. The Mall rules require one.',
      multiple_worldinfo: 'The object has more than one WorldInfo node. The comparison '
        + 'below uses the first.',
      malformed_vrml: 'The VRML is malformed (an unterminated string or unbalanced braces). '
        + 'The facts below may be incomplete.',
      too_complex: 'The file exceeded the scanner budget, so the facts below are incomplete.',
    };
    return warnings.map(code => ({
      code,
      message: messages[code] || `Scanner reported: ${code}.`,
    }));
  }

  /**
   * Observations against documented Mall rules that can be established from the
   * file alone. These are statements about what is in the object; they are not
   * verdicts, and they never gate an action.
   */
  private describeRuleObservations(
    vrml: InspectionVrml,
    decodedBytes: number | null,
  ): RawFinding[] {
    const findings: RawFinding[] = [];

    FORBIDDEN_NODES.forEach(node => {
      const count = vrml.nodeCounts[node] || 0;
      if (count > 0) {
        findings.push({
          code: 'forbidden_node',
          message: `Contains ${count} ${node} node(s), which the Mall rules do not allow.`,
        });
      }
    });

    if ((vrml.nodeCounts.hAnim || 0) > 0) {
      findings.push({
        code: 'forbidden_node',
        message: `Contains ${vrml.nodeCounts.hAnim} H-Anim node(s), which the Mall rules `
          + 'do not allow.',
      });
    }

    if (vrml.textureReferences.length > 1) {
      const names = vrml.textureReferences.map(reference => reference.value).join(', ');
      findings.push({
        code: 'multiple_textures',
        message: `References ${vrml.textureReferences.length} distinct textures (${names}). `
          + 'The Mall rules allow one.',
      });
    }

    vrml.externalReferences.forEach(reference => {
      findings.push({
        code: 'external_reference',
        message: `References "${reference.value}" outside the object's own directory.`,
      });
    });

    if (decodedBytes !== null && decodedBytes > WRL_UPLOAD_LIMIT_BYTES) {
      findings.push({
        code: 'decoded_exceeds_upload_limit',
        message: `The VRML is ${decodedBytes} bytes once decompressed, above the `
          + `${WRL_UPLOAD_LIMIT_BYTES}-byte rule. Upload validation measures the compressed `
          + 'size, so this passed on upload. Reported for information only.',
      });
    }

    return findings;
  }

  /** Confirms that locally-referenced textures actually sit beside the WRL. */
  private async checkTextureFiles(
    directory: string,
    textures: VrmlUrlReference[],
    recordedTexture: string | null,
  ): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // A subdirectory reference such as `textures/wood.jpg` is still inside the
    // object's own directory, so it is not an external reference -- but uploads
    // are stored flat (`ObjectService.uploadObjectFiles` creates the one object
    // directory and writes every file directly into it), so nothing ever puts a
    // file there. Checking it alongside the bare filenames is what turns that
    // into a finding instead of silence.
    const checkable = textures
      .filter(reference => reference.kind === 'local'
        || (reference.kind === 'relative' && !escapesObjectDirectory(reference.value)))
      .slice(0, MAX_TEXTURE_EXISTENCE_CHECKS);

    for (const reference of checkable) {
      const metadata = await this.objectSourceService.readAssetMetadata({
        directory,
        filename: reference.value,
      });
      // Only absence is reported. An unreadable or misconfigured asset root is
      // a server problem, not something the uploader can fix, and saying "not
      // stored with it" there would be a false accusation.
      if (metadata.error !== 'missing') {
        continue;
      }
      if (reference.kind === 'relative') {
        findings.push({
          code: 'texture_subdirectory',
          message: `The object references "${reference.value}" in a subdirectory. Object `
            + 'files are stored side by side, so this texture will not be found.',
        });
      } else {
        findings.push({
          code: 'texture_missing',
          message: `The object references "${reference.value}" but that file is not stored `
            + 'with it.',
        });
      }
    }

    if (textures.length > 0 && !recordedTexture) {
      findings.push({
        code: 'texture_not_recorded',
        message: 'The object references a texture but no texture file was uploaded '
          + 'alongside it.',
      });
    }

    return findings;
  }
}
