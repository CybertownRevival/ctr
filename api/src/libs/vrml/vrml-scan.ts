import { tokenize, VrmlToken } from './vrml-tokenizer';

/**
 * Extracts the lexical facts a Mall checker would otherwise read by hand, by
 * walking the token stream produced by `tokenize`.
 *
 * Scope note: this is not a VRML engine. It does not instantiate PROTOs, resolve
 * USE references, compose Transforms or compute geometry, so it deliberately
 * reports nothing about an object's bounding box, lowest Y, or centring - those
 * remain a human judgement against the Mall reference grid in the viewer.
 */

export const VRML97_HEADER = '#VRML V2.0 utf8';

/** How a `url`-ish field value resolves, from the Mall rules' point of view. */
export type VrmlUrlKind =
  | 'local'
  | 'relative'
  | 'absolute'
  | 'external'
  | 'data'
  | 'script'
  | 'empty';

/**
 * Schemes that carry an inline script body rather than a network reference.
 *
 * Real Mall objects use these heavily - a `Script` node's `url` is normally the
 * ECMAScript source itself. Classifying them as external would wrongly accuse
 * ordinary animated objects of breaking the "textures shall not be linked to an
 * external source" rule.
 */
const INLINE_SCRIPT_SCHEMES = ['javascript', 'vrmlscript', 'ecmascript'];

export interface VrmlUrlReference {
  /** Enclosing node type, or null for a reference outside any node (e.g. EXTERNPROTO). */
  node: string | null;
  field: string;
  value: string;
  kind: VrmlUrlKind;
}

export interface WorldInfoNode {
  title: string | null;
  info: string[];
}

export interface ViewpointFact {
  defName: string | null;
  description: string | null;
}

export interface VrmlScan {
  /** The file's first line verbatim, or null for an empty file. */
  header: string | null;
  headerIsVrml97: boolean;
  /**
   * Scene-level WorldInfo only. A PROTO body is a template, not part of the
   * instantiated scene, so metadata declared inside one must never stand in as
   * the object's own -- see `protoWorldInfo`.
   */
  worldInfo: WorldInfoNode[];
  /** WorldInfo declared inside a PROTO body. Reported, never compared against. */
  protoWorldInfo: WorldInfoNode[];
  /** Raw count of every node type opened, keyed by type name. */
  nodeCounts: { [nodeType: string]: number };
  protoDefinitions: string[];
  externProtoDefinitions: string[];
  urls: VrmlUrlReference[];
  viewpoints: ViewpointFact[];
  /** Machine-readable findings; see FINDING_* below. */
  warnings: string[];
  truncated: boolean;
}

/**
 * The fixed key set the export contract and checker render. Kept explicit and
 * ordered so the export stays deterministic across releases.
 */
export const SUMMARISED_NODE_TYPES = [
  'ImageTexture',
  'PixelTexture',
  'MovieTexture',
  'PROTO',
  'EXTERNPROTO',
  'Inline',
  'Script',
  'Sound',
  'AudioClip',
  'DirectionalLight',
  'PointLight',
  'SpotLight',
  'Billboard',
  'Viewpoint',
  'TouchSensor',
  'ProximitySensor',
  'TimeSensor',
  'Anchor',
] as const;

/** H-Anim container nodes, which the Mall rules forbid. Summed as `hAnim`. */
export const H_ANIM_NODE_TYPES = ['Humanoid', 'Joint', 'Segment', 'Site', 'Displacer'];

/** Node types whose `url` values are texture references. */
const TEXTURE_NODE_TYPES = ['ImageTexture', 'MovieTexture'];

export const FINDING_BAD_HEADER = 'bad_header';
export const FINDING_NO_WORLDINFO = 'no_worldinfo';
export const FINDING_MULTIPLE_WORLDINFO = 'multiple_worldinfo';
export const FINDING_MALFORMED_VRML = 'malformed_vrml';
export const FINDING_TRUNCATED = 'too_complex';

interface Frame {
  /** null for a brace block that is not a node body (a PROTO body, for example). */
  type: string | null;
  /** True when this frame is a PROTO body, or is nested anywhere inside one. */
  proto: boolean;
}

function isNodeTypeName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function isUrlField(name: string): boolean {
  return /url$/i.test(name);
}

/** Classifies a url value the way the Mall texture rules care about. */
export function classifyUrl(value: string): VrmlUrlKind {
  const trimmed = value.trim();
  if (trimmed === '') {
    return 'empty';
  }
  const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(trimmed);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    if (INLINE_SCRIPT_SCHEMES.indexOf(name) !== -1) {
      return 'script';
    }
    return name === 'data' ? 'data' : 'external';
  }
  if (trimmed.charAt(0) === '/' || trimmed.charAt(0) === '\\') {
    return 'absolute';
  }
  if (trimmed.indexOf('/') !== -1 || trimmed.indexOf('\\') !== -1) {
    return 'relative';
  }
  return 'local';
}

/**
 * Whether a relative reference resolves outside the object's own directory.
 *
 * `classifyUrl` calls both `textures/wood.jpg` and `../wood.jpg` relative, but
 * only the second one leaves the directory, and that difference is the whole
 * point of the external-reference rule.
 */
export function escapesObjectDirectory(value: string): boolean {
  const parts = value.trim().split(/[\\/]+/);
  let depth = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      depth -= 1;
      if (depth < 0) {
        return true;
      }
    } else {
      depth += 1;
    }
  }
  return false;
}

function isPunct(token: VrmlToken | undefined, value: string): boolean {
  return !!token && token.kind === 'punct' && token.value === value;
}

/**
 * Reads either a single SFString or an MFString `[ ... ]` block starting at
 * `start`, returning the strings found and the index just past the value.
 * Non-string tokens inside a list are skipped rather than treated as an error.
 */
function readStringValue(
  tokens: VrmlToken[],
  start: number,
): { values: string[]; next: number } {
  const token = tokens[start];
  if (!token) {
    return { values: [], next: start };
  }

  if (token.kind === 'string') {
    return { values: [token.value], next: start + 1 };
  }

  if (isPunct(token, '[')) {
    const values: string[] = [];
    let depth = 0;
    let position = start;

    while (position < tokens.length) {
      const current = tokens[position];
      if (current.kind === 'punct' && current.value === '[') {
        depth += 1;
      } else if (current.kind === 'punct' && current.value === ']') {
        depth -= 1;
        if (depth === 0) {
          return { values, next: position + 1 };
        }
      } else if (current.kind === 'string') {
        values.push(current.value);
      }
      position += 1;
    }

    return { values, next: position };
  }

  return { values: [], next: start };
}

/** Skips a balanced `[ ... ]` block, used to step over a PROTO interface. */
function skipBracketBlock(tokens: VrmlToken[], start: number): number {
  if (!isPunct(tokens[start], '[')) {
    return start;
  }
  let depth = 0;
  let position = start;
  while (position < tokens.length) {
    const current = tokens[position];
    if (current.kind === 'punct' && current.value === '[') {
      depth += 1;
    } else if (current.kind === 'punct' && current.value === ']') {
      depth -= 1;
      if (depth === 0) {
        return position + 1;
      }
    }
    position += 1;
  }
  return position;
}

function readHeader(text: string): string | null {
  if (text === '') {
    return null;
  }
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const newline = withoutBom.search(/\r?\n/);
  const line = newline === -1 ? withoutBom : withoutBom.slice(0, newline);
  return line.replace(/\s+$/, '');
}

export function scanVrml(text: string): VrmlScan {
  const { tokens, truncated, unterminatedString } = tokenize(text);

  const header = readHeader(text);
  const worldInfo: WorldInfoNode[] = [];
  // Parallel to `worldInfo`: field writes still target the most recent record,
  // so PROTO-local nodes have to be collected, then separated at the end.
  const worldInfoIsProto: boolean[] = [];
  let pendingProtoBody = false;
  const nodeCounts: { [nodeType: string]: number } = {};
  const protoDefinitions: string[] = [];
  const externProtoDefinitions: string[] = [];
  const urls: VrmlUrlReference[] = [];
  const viewpoints: ViewpointFact[] = [];
  const stack: Frame[] = [];
  const inProtoBody = (): boolean => stack.length > 0 && stack[stack.length - 1].proto;

  let pendingDefName: string | null = null;
  let unbalanced = false;
  let index = 0;

  const countNode = (type: string): void => {
    nodeCounts[type] = (nodeCounts[type] || 0) + 1;
  };

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.kind === 'punct') {
      if (token.value === '{') {
        // A brace not introduced by a node name - a PROTO body, for instance.
        stack.push({ type: null, proto: pendingProtoBody || inProtoBody() });
        pendingProtoBody = false;
      } else if (token.value === '}') {
        if (stack.length === 0) {
          unbalanced = true;
        } else {
          stack.pop();
        }
      }
      index += 1;
      continue;
    }

    if (token.kind === 'string') {
      index += 1;
      continue;
    }

    const word = token.value;

    if (word === 'DEF') {
      const next = tokens[index + 1];
      pendingDefName = next && next.kind === 'word' ? next.value : null;
      index += next ? 2 : 1;
      continue;
    }

    if (word === 'USE') {
      index += tokens[index + 1] ? 2 : 1;
      continue;
    }

    if (word === 'PROTO' || word === 'EXTERNPROTO') {
      const nameToken = tokens[index + 1];
      const name = nameToken && nameToken.kind === 'word' ? nameToken.value : '';
      countNode(word);
      let position = nameToken ? index + 2 : index + 1;
      position = skipBracketBlock(tokens, position);

      if (word === 'PROTO') {
        protoDefinitions.push(name);
        // The brace that follows the interface opens the template body.
        pendingProtoBody = true;
      } else {
        externProtoDefinitions.push(name);
        // An EXTERNPROTO's url list follows its interface with no field name,
        // and is exactly the kind of external reference the rules forbid.
        const external = readStringValue(tokens, position);
        external.values.forEach(value => {
          urls.push({ node: word, field: 'url', value, kind: classifyUrl(value) });
        });
        position = external.next;
      }

      index = position;
      continue;
    }

    if (isPunct(tokens[index + 1], '{')) {
      if (isNodeTypeName(word)) {
        countNode(word);
      }
      if (word === 'Viewpoint') {
        viewpoints.push({ defName: pendingDefName, description: null });
      }
      if (word === 'WorldInfo') {
        worldInfo.push({ title: null, info: [] });
        worldInfoIsProto.push(inProtoBody());
      }
      stack.push({ type: word, proto: inProtoBody() });
      pendingDefName = null;
      index += 2;
      continue;
    }

    const frame = stack.length > 0 ? stack[stack.length - 1] : null;
    const frameType = frame ? frame.type : null;

    if (frameType === 'WorldInfo' && (word === 'title' || word === 'info')) {
      const value = readStringValue(tokens, index + 1);
      const current = worldInfo[worldInfo.length - 1];
      if (current) {
        if (word === 'title') {
          current.title = value.values.length > 0 ? value.values[0] : null;
        } else {
          current.info = current.info.concat(value.values);
        }
      }
      index = value.next > index ? value.next : index + 1;
      continue;
    }

    if (frameType === 'Viewpoint' && word === 'description') {
      const value = readStringValue(tokens, index + 1);
      const current = viewpoints[viewpoints.length - 1];
      if (current) {
        current.description = value.values.length > 0 ? value.values[0] : null;
      }
      index = value.next > index ? value.next : index + 1;
      continue;
    }

    if (isUrlField(word)) {
      const value = readStringValue(tokens, index + 1);
      value.values.forEach(entry => {
        urls.push({ node: frameType, field: word, value: entry, kind: classifyUrl(entry) });
      });
      index = value.next > index ? value.next : index + 1;
      continue;
    }

    index += 1;
  }

  const sceneWorldInfo = worldInfo.filter((_node, i) => !worldInfoIsProto[i]);
  const protoWorldInfo = worldInfo.filter((_node, i) => worldInfoIsProto[i]);

  const warnings: string[] = [];
  if (header === null || header !== VRML97_HEADER) {
    warnings.push(FINDING_BAD_HEADER);
  }
  if (sceneWorldInfo.length === 0) {
    warnings.push(FINDING_NO_WORLDINFO);
  }
  if (sceneWorldInfo.length > 1) {
    warnings.push(FINDING_MULTIPLE_WORLDINFO);
  }
  // An open stack is expected when scanning stopped at the token budget, so it
  // only means malformed input if the file was read to the end.
  if (unterminatedString || unbalanced || (stack.length > 0 && !truncated)) {
    warnings.push(FINDING_MALFORMED_VRML);
  }
  if (truncated) {
    warnings.push(FINDING_TRUNCATED);
  }

  return {
    header,
    headerIsVrml97: header === VRML97_HEADER,
    worldInfo: sceneWorldInfo,
    protoWorldInfo,
    nodeCounts,
    protoDefinitions,
    externProtoDefinitions,
    urls,
    viewpoints,
    warnings,
    truncated,
  };
}

/**
 * Projects the raw node counts onto the fixed, ordered key set the checker and
 * the export contract publish, so both stay deterministic as the scanner grows.
 */
export function summariseNodeCounts(scan: VrmlScan): { [nodeType: string]: number } {
  const summary: { [nodeType: string]: number } = {};
  SUMMARISED_NODE_TYPES.forEach(type => {
    summary[type] = scan.nodeCounts[type] || 0;
  });
  summary.hAnim = H_ANIM_NODE_TYPES.reduce(
    (total, type) => total + (scan.nodeCounts[type] || 0),
    0,
  );
  return summary;
}

/** Distinct texture references, in first-seen order. */
export function textureReferences(scan: VrmlScan): VrmlUrlReference[] {
  const seen: { [value: string]: true } = {};
  return scan.urls.filter(reference => {
    if (TEXTURE_NODE_TYPES.indexOf(reference.node || '') === -1) {
      return false;
    }
    if (seen[reference.value]) {
      return false;
    }
    seen[reference.value] = true;
    return true;
  });
}

/** Every reference that leaves the object's own directory. */
export function externalReferences(scan: VrmlScan): VrmlUrlReference[] {
  return scan.urls.filter(
    reference => reference.kind === 'external'
      || reference.kind === 'absolute'
      || (reference.kind === 'relative' && escapesObjectDirectory(reference.value)),
  );
}
