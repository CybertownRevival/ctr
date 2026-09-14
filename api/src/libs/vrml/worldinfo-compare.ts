import { VrmlScan, WorldInfoNode } from './vrml-scan';

/**
 * Compares the `WorldInfo` a creator embedded in their object against the record
 * CTR actually holds, so a Mall checker can see agreement or disagreement at a
 * glance instead of reading the WRL in an external editor.
 *
 * Everything here is ADVISORY. No verdict blocks, triggers, or influences any
 * moderation action - accept and reject remain entirely a human decision, and a
 * MISMATCH is a prompt to look, not a reason to refuse.
 */

export type ComparisonVerdict = 'MATCH' | 'MISMATCH' | 'NOT_FOUND' | 'UNPARSED';

export type ComparisonField = 'name' | 'creator' | 'price' | 'limit' | 'store';

export interface FieldComparison {
  field: ComparisonField;
  verdict: ComparisonVerdict;
  /** The full `info[]` entry the value came from, verbatim, or null. */
  worldInfoLine: string | null;
  /** The portion after the recognised prefix, verbatim, or null. */
  worldInfoValue: string | null;
  /** What CTR holds, for side-by-side display. */
  ctrValue: string | number | null;
  /** Present when a verdict needs explaining rather than acting on. */
  note?: string;
}

export interface InterpretedWorldInfo {
  title: string | null;
  creator: string | null;
  price: string | null;
  limit: string | null;
  store: string | null;
  /**
   * Extracted for display only. Deliberately never compared against
   * `object.created_at`: CTR's MySQL/Node timezone configuration is unpinned, so
   * a month/year comparison would be unreliable at month boundaries.
   */
  uploaded: string | null;
}

export interface MallObjectFacts {
  name: string | null;
  creatorUsername: string | null;
  price: number | null;
  limit: number | null;
  storeName: string | null;
}

export interface WorldInfoComparison {
  interpreted: InterpretedWorldInfo;
  comparisons: FieldComparison[];
}

/**
 * Recognised `info[]` prefixes, longest-first within each group so that
 * "Mall Price:" wins over "Price:".
 *
 * These conventions were read off real Mall objects (the "Made By:" family) and
 * off the Vivaty Studio template many creators start from (the "Artist:" /
 * "Price:" / "Limit:" family). Editing this table is the single place to change
 * which conventions CTR recognises.
 */
const PREFIXES: { [key: string]: string[] } = {
  creator: ['made by', 'created by', 'creator', 'artist'],
  price: ['mall price', 'price'],
  limit: ['limited to', 'limit'],
  store: ['store'],
  uploaded: ['uploaded', 'date'],
};

const UNLIMITED_WORDS = ['unlimited', 'none', 'no limit', 'n/a'];

interface PrefixMatch {
  line: string;
  value: string;
}

interface PrefixResolution {
  /** First entry carrying the highest-priority label present, or null. */
  match: PrefixMatch | null;
  /** Every entry carrying that same label, in file order. */
  all: PrefixMatch[];
  /** True when those entries disagree, so no single value can be compared. */
  conflicting: boolean;
}

/**
 * Finds every `info[]` entry carrying one of `prefixes`, allowing any
 * surrounding whitespace and any case. The separator colon is optional because
 * real objects are inconsistent about it.
 *
 * Prefixes are tried in order and the first one that matches anything wins, so
 * a more specific label ("Mall Price") still beats a general one ("Price") on
 * the same object. The label must actually end where the prefix does --
 * matching on a bare string prefix let "Storehouse:" register as "Store:".
 */
function findPrefixed(info: string[], prefixes: string[]): PrefixMatch[] {
  for (const prefix of prefixes) {
    const matches: PrefixMatch[] = [];
    for (const line of info) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if (lower.indexOf(prefix) !== 0) {
        continue;
      }
      const rest = trimmed.slice(prefix.length);
      if (rest !== '' && !/^\s*:/.test(rest) && !/^\s/.test(rest)) {
        continue;
      }
      matches.push({ line, value: rest.replace(/^\s*:?\s*/, '') });
    }
    if (matches.length > 0) {
      return matches;
    }
  }
  return [];
}

function resolvePrefixed(info: string[], prefixes: string[]): PrefixResolution {
  const all = findPrefixed(info, prefixes);
  if (all.length === 0) {
    return { match: null, all, conflicting: false };
  }
  const first = normalise(all[0].value);
  return {
    match: all[0],
    all,
    conflicting: all.some(entry => normalise(entry.value) !== first),
  };
}

/**
 * A field declared twice with different values has no answer, only a question.
 * Picking the first silently turns that into a confident verdict, so it is
 * reported as unparseable and handed to staff instead.
 */
function conflicted(
  field: ComparisonField,
  resolution: PrefixResolution,
  ctrValue: string | number | null,
): FieldComparison | null {
  if (!resolution.conflicting) {
    return null;
  }
  const values = resolution.all.map(entry => `"${entry.value}"`).join(', ');
  return {
    field,
    verdict: 'UNPARSED',
    worldInfoLine: resolution.all[0].line,
    worldInfoValue: resolution.all[0].value,
    ctrValue,
    note: `The object declares this field ${resolution.all.length} times with different `
      + `values (${values}), so there is no single value to compare. Staff review required.`,
  };
}

function normalise(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Reads the integer out of a value such as "75", "75 CC", "1,500 CC" or "25 max".
 *
 * Deliberately strict. Scanning for the first digit run reads 75 out of
 * "USD 75.50" and then reports a confident MATCH against a stored 75, which is
 * worse than admitting the entry could not be read. Group separators are
 * accepted because "1,500" otherwise parsed as 1.
 */
const INTEGER_ENTRY = /^([+-]?\d{1,3}(?:,\d{3})+|[+-]?\d+)\s*(?:cc|credits?|max)?$/i;

function parseInteger(value: string): number | null {
  const match = INTEGER_ENTRY.exec(value.trim());
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1].replace(/,/g, ''), 10);
}

function compareText(
  field: ComparisonField,
  resolution: PrefixResolution,
  ctrValue: string | null,
): FieldComparison {
  const conflict = conflicted(field, resolution, ctrValue);
  if (conflict) {
    return conflict;
  }
  const match = resolution.match;
  if (!match) {
    return { field, verdict: 'NOT_FOUND', worldInfoLine: null, worldInfoValue: null, ctrValue };
  }
  if (match.value.trim() === '') {
    return {
      field,
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
      note: 'The entry is present but its value is blank.',
    };
  }
  if (ctrValue === null) {
    return {
      field,
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
      note: 'CTR holds no value to compare against.',
    };
  }
  return {
    field,
    verdict: normalise(match.value) === normalise(ctrValue) ? 'MATCH' : 'MISMATCH',
    worldInfoLine: match.line,
    worldInfoValue: match.value,
    ctrValue,
  };
}

function comparePrice(
  resolution: PrefixResolution,
  ctrPrice: number | null,
): FieldComparison {
  const conflict = conflicted('price', resolution, ctrPrice);
  if (conflict) {
    return conflict;
  }
  const match = resolution.match;
  if (!match) {
    return {
      field: 'price',
      verdict: 'NOT_FOUND',
      worldInfoLine: null,
      worldInfoValue: null,
      ctrValue: ctrPrice,
    };
  }
  const parsed = parseInteger(match.value);
  if (parsed === null) {
    return {
      field: 'price',
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue: ctrPrice,
      note: match.value.trim() === ''
        ? 'The entry is present but its value is blank.'
        : 'No number could be read from the entry.',
    };
  }
  if (ctrPrice === null) {
    return {
      field: 'price',
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue: ctrPrice,
      note: 'CTR holds no price to compare against.',
    };
  }
  return {
    field: 'price',
    verdict: parsed === ctrPrice ? 'MATCH' : 'MISMATCH',
    worldInfoLine: match.line,
    worldInfoValue: match.value,
    ctrValue: ctrPrice,
  };
}

/**
 * Limit needs its own comparison because CTR's own `limit = 0` semantics are
 * unresolved: the Update Limit prompt says "0 makes it Unlimited", but the
 * Out-of-Stock view only treats NULL that way. Rather than pick a side, a stored
 * 0 is reported as UNPARSED with an explanation.
 */
function compareLimit(
  resolution: PrefixResolution,
  ctrLimit: number | null,
): FieldComparison {
  const ctrValue = ctrLimit;

  const conflict = conflicted('limit', resolution, ctrValue);
  if (conflict) {
    return conflict;
  }
  const match = resolution.match;
  if (!match) {
    return {
      field: 'limit',
      verdict: 'NOT_FOUND',
      worldInfoLine: null,
      worldInfoValue: null,
      ctrValue,
    };
  }

  if (ctrLimit === 0) {
    return {
      field: 'limit',
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
      note: 'CTR stores limit = 0, whose meaning is unresolved (the Update Limit prompt '
        + 'calls it unlimited, the Out of Stock view does not). Not compared.',
    };
  }

  const value = match.value.trim();
  if (value === '') {
    return {
      field: 'limit',
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
      note: 'The entry is present but its value is blank.',
    };
  }

  const saysUnlimited = UNLIMITED_WORDS.indexOf(normalise(value)) !== -1;
  if (saysUnlimited) {
    return {
      field: 'limit',
      verdict: ctrLimit === null ? 'MATCH' : 'MISMATCH',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
    };
  }

  const parsed = parseInteger(value);
  if (parsed === null) {
    return {
      field: 'limit',
      verdict: 'UNPARSED',
      worldInfoLine: match.line,
      worldInfoValue: match.value,
      ctrValue,
      note: 'No number and no "unlimited" wording could be read from the entry.',
    };
  }

  return {
    field: 'limit',
    verdict: parsed === ctrLimit ? 'MATCH' : 'MISMATCH',
    worldInfoLine: match.line,
    worldInfoValue: match.value,
    ctrValue,
  };
}

function compareTitle(title: string | null, ctrName: string | null): FieldComparison {
  if (title === null) {
    return {
      field: 'name',
      verdict: 'NOT_FOUND',
      worldInfoLine: null,
      worldInfoValue: null,
      ctrValue: ctrName,
    };
  }
  if (ctrName === null) {
    return {
      field: 'name',
      verdict: 'UNPARSED',
      worldInfoLine: title,
      worldInfoValue: title,
      ctrValue: null,
      note: 'CTR holds no value to compare against.',
    };
  }
  return {
    field: 'name',
    verdict: normalise(title) === normalise(ctrName) ? 'MATCH' : 'MISMATCH',
    worldInfoLine: title,
    worldInfoValue: title,
    ctrValue: ctrName,
  };
}

/**
 * Uses the FIRST WorldInfo node when an object contains more than one. The
 * `multiple_worldinfo` finding from the scanner tells the checker to say so.
 */
export function compareWorldInfo(scan: VrmlScan, facts: MallObjectFacts): WorldInfoComparison {
  const node: WorldInfoNode = scan.worldInfo[0] || { title: null, info: [] };
  const info = node.info;

  const creator = resolvePrefixed(info, PREFIXES.creator);
  const price = resolvePrefixed(info, PREFIXES.price);
  const limit = resolvePrefixed(info, PREFIXES.limit);
  const store = resolvePrefixed(info, PREFIXES.store);
  const uploaded = resolvePrefixed(info, PREFIXES.uploaded);

  return {
    interpreted: {
      title: node.title,
      creator: creator.match ? creator.match.value : null,
      price: price.match ? price.match.value : null,
      limit: limit.match ? limit.match.value : null,
      store: store.match ? store.match.value : null,
      uploaded: uploaded.match ? uploaded.match.value : null,
    },
    comparisons: [
      compareTitle(node.title, facts.name),
      compareText('creator', creator, facts.creatorUsername),
      comparePrice(price, facts.price),
      compareLimit(limit, facts.limit),
      compareText('store', store, facts.storeName),
    ],
  };
}
