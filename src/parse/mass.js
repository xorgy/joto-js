/**
 * Light-weight unit parsing of mass strings into whit.
 *
 * This module is intended to offer parsing functions that cover common mass parsing needs for
 * typesetting, for architectural and mechanical specification, or for general engineering use.
 *
 * In this workspace, `WHIT` is defined as 1⁄3200 µg. This allows common divisions of the
 * international pound (ounces, dram, grains) and tenths of a microgram to be represented
 * interchangeably as integers.
 *
 * ## Examples
 * ```js
 * import { KILOGRAM, OUNCE, POUND } from "@xorgy/joto/constants/mass";
 * import { parseDim } from "@xorgy/joto/parse/mass";
 *
 * console.assert(parseDim("2kg") === 2 * KILOGRAM);
 * console.assert(parseDim("5lb 3oz") === 5 * POUND + 3 * OUNCE);
 * ```
 *
 * @module joto/parse/mass
 */

import * as c from "../constants/mass.js";
import {
  isGroupSeparatorCharCode,
  stripTrailingAsciiDigits,
  trimEndJotoWhitespace,
  trimEndJotoWhitespaceIndex,
  trimTrailingAsciiZeroes,
} from "../_internal/parse-helpers.js";

/**
 * A parse result used by the diagnostic parsing APIs.
 *
 * @template T
 * @template E
 * @typedef {{ ok: true, value: T } | { ok: false, error: E }} Result
 */

/**
 * Parse error codes for mass parsing.
 *
 * @typedef {"Empty"|"NoUnit"|"EmptyQuantity"|"TooBig"|"TooPrecise"|"InvalidCompound"} MassParseErrorCode
 */

/**
 * A mass parse error.
 *
 * The `index` field is a UTF-16 code unit index (like `String.prototype.slice`) into the trimmed
 * input string.
 *
 * @typedef {{
 *   code: MassParseErrorCode,
 *   index: number,
 *   unit?: number,
 *   inferior?: number,
 *   found?: number,
 *   expected?: number
 * }} MassParseError
 */

/**
 * Unit type for parsing.
 *
 * These are distinct from the constants in `joto/constants/mass` in the sense that they are
 * meant to represent parsing/generating behavior, and not numeric behavior.
 *
 * @readonly
 * @typedef {object} MassUnitEnum
 * @property {number} Whit Whit — 1⁄3200 µg.
 * @property {number} Microgram Microgram.
 * @property {number} Milligram Milligram.
 * @property {number} Gram Gram.
 * @property {number} Kilogram Kilogram.
 * @property {number} Megagram Megagram — tonne/metric ton.
 * @property {number} Dram Dram — exactly 1⁄16 of an ounce.
 * @property {number} Ounce Ounce — exactly 1⁄16 of a pound.
 * @property {number} Pound Pound — defined in the International Yard and Pound agreement.
 * @property {number} Stone Stone — exactly 14 pounds.
 * @property {number} LongHundredweight Long hundredweight — exactly 8 stone or 112 pounds.
 * @property {number} LongTon Long ton — exactly 20 long hundredweight.
 * @property {number} ShortHundredweight Short hundredweight — exactly 100 pounds.
 * @property {number} ShortTon Short ton — exactly 20 short hundredweight.
 * @property {number} Grain Grain — exactly 1⁄7000 of a pound.
 * @property {number} Pennyweight Pennyweight — exactly 24 grain.
 * @property {number} TroyOunce Troy ounce — exactly 20 pennyweight (480 grain).
 */
export const Unit = Object.freeze({
  Whit: c.WHIT,
  Microgram: c.MICROGRAM,
  Milligram: c.MILLIGRAM,
  Gram: c.GRAM,
  Kilogram: c.KILOGRAM,
  Megagram: c.MEGAGRAM,
  Dram: c.DRAM,
  Ounce: c.OUNCE,
  Pound: c.POUND,
  Stone: c.STONE,
  LongHundredweight: c.LONG_HUNDREDWEIGHT,
  LongTon: c.LONG_TON,
  ShortHundredweight: c.SHORT_HUNDREDWEIGHT,
  ShortTon: c.SHORT_TON,
  Grain: c.GRAIN,
  Pennyweight: c.PENNYWEIGHT,
  TroyOunce: c.TROY_OUNCE,
});

function isAsciiDigitCharCode(c) {
  return c >= 0x30 && c <= 0x39;
}

/**
 * Canonical abbreviation for a unit.
 *
 * This is the preferred abbreviation for display contexts where Unicode is appropriate.
 *
 * @param {number} unit
 * @returns {string}
 */
export function abbr(unit) {
  switch (unit) {
    case Unit.Whit:
      return "wt";
    case Unit.Microgram:
      return "\u00b5g";
    case Unit.Milligram:
      return "mg";
    case Unit.Gram:
      return "g";
    case Unit.Kilogram:
      return "kg";
    case Unit.Megagram:
      return "t";
    case Unit.Dram:
      return "dr";
    case Unit.Ounce:
      return "oz";
    case Unit.Pound:
      return "lb";
    case Unit.Stone:
      return "st";
    case Unit.LongHundredweight:
      return "cwt.l";
    case Unit.LongTon:
      return "tn.l";
    case Unit.ShortHundredweight:
      return "cwt";
    case Unit.ShortTon:
      return "tn";
    case Unit.Grain:
      return "gr";
    case Unit.Pennyweight:
      return "dwt";
    case Unit.TroyOunce:
      return "ozt";
    default:
      return "";
  }
}

/**
 * Canonical ASCII abbreviation for a unit.
 *
 * @param {number} unit
 * @returns {string}
 */
export function asciiAbbr(unit) {
  switch (unit) {
    case Unit.Whit:
      return "wt";
    case Unit.Microgram:
      return "ug";
    case Unit.Milligram:
      return "mg";
    case Unit.Gram:
      return "g";
    case Unit.Kilogram:
      return "kg";
    case Unit.Megagram:
      return "t";
    case Unit.Dram:
      return "dr";
    case Unit.Ounce:
      return "oz";
    case Unit.Pound:
      return "lb";
    case Unit.Stone:
      return "st";
    case Unit.LongHundredweight:
      return "cwt_l";
    case Unit.LongTon:
      return "tn_l";
    case Unit.ShortHundredweight:
      return "cwt";
    case Unit.ShortTon:
      return "tn";
    case Unit.Grain:
      return "gr";
    case Unit.Pennyweight:
      return "dwt";
    case Unit.TroyOunce:
      return "ozt";
    default:
      return "";
  }
}

function maxDecimalDigits(u) {
  switch (u) {
    case Unit.Microgram:
      return 2;
    case Unit.Milligram:
      return 5;
    case Unit.Gram:
      return 8;
    case Unit.Kilogram:
      return 11;
    case Unit.Megagram:
      return 14;
    case Unit.Ounce:
    case Unit.Pound:
    case Unit.Stone:
    case Unit.LongHundredweight:
      return 3;
    case Unit.LongTon:
      return 4;
    case Unit.ShortHundredweight:
      return 5;
    case Unit.ShortTon:
      return 6;
    case Unit.TroyOunce:
      return 1;
    default:
      return 0;
  }
}

function leastSignificantDigitValue(u) {
  const digits = maxDecimalDigits(u);
  if (digits === 0) return u;
  return Math.trunc(u / 10 ** digits);
}

function superior(u) {
  return u === Unit.Ounce ? Unit.Pound : null;
}

function stripUnitAt(s, end, out) {
  if (s.endsWith("ozt", end)) return ((out.restEnd = end - 3), (out.unit = Unit.TroyOunce), true);
  if (s.endsWith("dwt", end)) return ((out.restEnd = end - 3), (out.unit = Unit.Pennyweight), true);
  if (s.endsWith("cwt", end)) return ((out.restEnd = end - 3), (out.unit = Unit.ShortHundredweight), true);

  if (s.endsWith("cwt.l", end) || s.endsWith("cwt_l", end)) {
    return ((out.restEnd = end - 5), (out.unit = Unit.LongHundredweight), true);
  }
  if (s.endsWith("tn.l", end) || s.endsWith("tn_l", end)) {
    return ((out.restEnd = end - 4), (out.unit = Unit.LongTon), true);
  }

  if (s.endsWith("lb", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Pound), true);
  if (s.endsWith("st", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Stone), true);
  if (s.endsWith("tn", end)) return ((out.restEnd = end - 2), (out.unit = Unit.ShortTon), true);
  if (s.endsWith("dr", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Dram), true);
  if (s.endsWith("oz", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Ounce), true);
  if (s.endsWith("gr", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Grain), true);

  if (s.endsWith("wt", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Whit), true);
  if (s.endsWith("kg", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Kilogram), true);
  if (s.endsWith("mg", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Milligram), true);

  if (s.endsWith("mcg", end)) return ((out.restEnd = end - 3), (out.unit = Unit.Microgram), true);
  if (s.endsWith("ug", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Microgram), true);
  if (s.endsWith("\u00b5g", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Microgram), true); // µg
  if (s.endsWith("\u03bcg", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Microgram), true); // μg

  if (s.endsWith("g", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Gram), true);
  if (s.endsWith("t", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Megagram), true);

  return false;
}

/**
 * Detect a unit at the end of a mass string, returning the remainder and the unit.
 *
 * This does not trim whitespace; callers typically want to `trimEnd` first.
 *
 * @param {string} s
 * @returns {{ rest: string, unit: number } | null}
 */
export function stripUnit(s) {
  const out = _stripScratch;
  if (!stripUnitAt(s, s.length, out)) return null;
  return { rest: s.slice(0, out.restEnd), unit: out.unit };
}

/**
 * @param {MassParseErrorCode} code
 * @param {number} index
 * @param {Partial<Omit<MassParseError, "code" | "index">>} [extra]
 * @returns {{ ok: false, error: MassParseError }}
 */
function err(code, index, extra = {}) {
  return { ok: false, error: { code, index, ...extra } };
}

/**
 * @template T
 * @param {T} value
 * @returns {{ ok: true, value: T }}
 */
function ok(value) {
  return { ok: true, value };
}

function takeDecimalFrac(unit, rest) {
  const at = rest.length;
  if (rest.endsWith(".")) {
    const r = rest.slice(0, -1);
    if (r.length > 0 && isAsciiDigitCharCode(r.charCodeAt(r.length - 1))) return ok({ rest: r, value: 0 });
    return err("EmptyQuantity", at, { unit });
  }

  const [dRest, digits] = stripTrailingAsciiDigits(rest);
  if (dRest.length === 0) return ok({ rest, value: 0 });

  const nonzeroDigits = trimTrailingAsciiZeroes(digits);
  const len = nonzeroDigits.length;
  if (!dRest.endsWith(".")) return ok({ rest, value: 0 });

  const r = dRest.slice(0, -1);
  if (len === 0) {
    if (r.length > 0 || digits.length > 0) return ok({ rest: r, value: 0 });
    return err("EmptyQuantity", at, { unit });
  }

  const scale = maxDecimalDigits(unit);
  if (len > scale) return err("TooPrecise", at, { unit });

  const b = nonzeroDigits;
  let pv = leastSignificantDigitValue(unit);
  let acc = 0;
  let i = scale;
  while (i > b.length) {
    i -= 1;
    pv *= 10;
  }
  while (i > 0) {
    i -= 1;
    const d = b.charCodeAt(i) & 0x0f;
    acc += d * pv;
    pv *= 10;
  }
  return ok({ rest: r, value: acc });
}

function maxWholeDigitsForUnitScale(unitScale) {
  const q = Math.trunc(Number.MAX_SAFE_INTEGER / unitScale);
  if (q <= 0) return 0;
  return String(q).length;
}

const MAX_WHOLE_DIGITS_BY_UNIT_SCALE = new Map([
  [Unit.Whit, maxWholeDigitsForUnitScale(Unit.Whit)],
  [Unit.Microgram, maxWholeDigitsForUnitScale(Unit.Microgram)],
  [Unit.Milligram, maxWholeDigitsForUnitScale(Unit.Milligram)],
  [Unit.Gram, maxWholeDigitsForUnitScale(Unit.Gram)],
  [Unit.Kilogram, maxWholeDigitsForUnitScale(Unit.Kilogram)],
  [Unit.Megagram, maxWholeDigitsForUnitScale(Unit.Megagram)],
  [Unit.Dram, maxWholeDigitsForUnitScale(Unit.Dram)],
  [Unit.Ounce, maxWholeDigitsForUnitScale(Unit.Ounce)],
  [Unit.Pound, maxWholeDigitsForUnitScale(Unit.Pound)],
  [Unit.Stone, maxWholeDigitsForUnitScale(Unit.Stone)],
  [Unit.LongHundredweight, maxWholeDigitsForUnitScale(Unit.LongHundredweight)],
  [Unit.LongTon, maxWholeDigitsForUnitScale(Unit.LongTon)],
  [Unit.ShortHundredweight, maxWholeDigitsForUnitScale(Unit.ShortHundredweight)],
  [Unit.ShortTon, maxWholeDigitsForUnitScale(Unit.ShortTon)],
  [Unit.Grain, maxWholeDigitsForUnitScale(Unit.Grain)],
  [Unit.Pennyweight, maxWholeDigitsForUnitScale(Unit.Pennyweight)],
  [Unit.TroyOunce, maxWholeDigitsForUnitScale(Unit.TroyOunce)],
]);

function parseWholeFast(unitScale, acc, s, end, out) {
  if (end === 0 || !isAsciiDigitCharCode(s.charCodeAt(end - 1))) return 0;

  const maxDigits = MAX_WHOLE_DIGITS_BY_UNIT_SCALE.get(unitScale) ?? 0;
  let pv = unitScale;
  let digitsSeen = 0;
  let i = end;

  while (i > 0) {
    const cCode = s.charCodeAt(i - 1);
    if (isAsciiDigitCharCode(cCode)) {
      const digit = cCode & 0x0f;
      if (digitsSeen < maxDigits) {
        if (digit !== 0) {
          const add = pv * digit;
          if (add > Number.MAX_SAFE_INTEGER - acc) return -1;
          acc += add;
        }
        digitsSeen += 1;
        if (digitsSeen < maxDigits) {
          if (pv > Math.trunc(Number.MAX_SAFE_INTEGER / 10)) return -1;
          pv *= 10;
        }
      } else if (digit !== 0) {
        return -1;
      }
      i -= 1;
      continue;
    }
    if (isGroupSeparatorCharCode(cCode)) {
      i -= 1;
      continue;
    }
    break;
  }

  out.restEnd = i;
  out.value = acc;
  return 1;
}

function takeDecimalFracFast(unitScale, s, end, out) {
  // Trailing '.' is accepted only if preceded by a digit.
  if (end > 0 && s.charCodeAt(end - 1) === 0x2e /* . */) {
    const rEnd = end - 1;
    if (rEnd > 0 && isAsciiDigitCharCode(s.charCodeAt(rEnd - 1))) {
      out.restEnd = rEnd;
      out.value = 0;
      return true;
    }
    return false;
  }

  // Strip trailing digits without allocating substrings.
  const digitsEnd = end;
  let digitsStart = end;
  while (digitsStart > 0 && isAsciiDigitCharCode(s.charCodeAt(digitsStart - 1))) digitsStart -= 1;

  // No trailing digits: no fraction.
  if (digitsStart === digitsEnd) {
    out.restEnd = end;
    out.value = 0;
    return true;
  }

  // No '.' before digits: no fraction.
  if (digitsStart === 0 || s.charCodeAt(digitsStart - 1) !== 0x2e /* . */) {
    out.restEnd = end;
    out.value = 0;
    return true;
  }

  const restEnd = digitsStart - 1;

  // Trim trailing zeros in the fraction digits.
  let nzEnd = digitsEnd;
  while (nzEnd > digitsStart && s.charCodeAt(nzEnd - 1) === 0x30 /* 0 */) nzEnd -= 1;
  const len = nzEnd - digitsStart;

  // Accept "1.000" and ".000".
  if (len === 0) {
    out.restEnd = restEnd;
    out.value = 0;
    return true;
  }

  const scale = maxDecimalDigits(unitScale);
  if (len > scale) return false;

  const lsd = leastSignificantDigitValue(unitScale);
  let pv = lsd;
  let i = scale;
  while (i > len) {
    i -= 1;
    pv *= 10;
  }
  let acc = 0;
  for (let k = len - 1; k >= 0; k -= 1) {
    const d = s.charCodeAt(digitsStart + k) & 0x0f;
    acc += d * pv;
    pv *= 10;
  }
  out.restEnd = restEnd;
  out.value = acc;
  return true;
}

function parseWhole(unitScale, acc, s) {
  if (s.length === 0 || !isAsciiDigitCharCode(s.charCodeAt(s.length - 1))) {
    return err("EmptyQuantity", s.length, { unit: unitScale });
  }

  const maxDigits = maxWholeDigitsForUnitScale(unitScale);
  let pv = unitScale;
  let digitsSeen = 0;
  let i = s.length;

  while (i > 0) {
    const cCode = s.charCodeAt(i - 1);
    if (cCode >= 0x30 && cCode <= 0x39) {
      const digit = cCode & 0x0f;
      if (digitsSeen < maxDigits) {
        if (digit !== 0) {
          const add = pv * digit;
          if (add > Number.MAX_SAFE_INTEGER - acc) {
            return err("TooBig", i, { unit: unitScale });
          }
          acc += add;
        }
        digitsSeen += 1;
        if (digitsSeen < maxDigits) {
          if (pv > Math.trunc(Number.MAX_SAFE_INTEGER / 10)) return err("TooBig", i, { unit: unitScale });
          pv *= 10;
        }
      } else if (digit !== 0) {
        return err("TooBig", i, { unit: unitScale });
      }
      i -= 1;
      continue;
    }
    if (isGroupSeparatorCharCode(cCode)) {
      i -= 1;
      continue;
    }
    break;
  }

  return ok({ rest: s.slice(0, i), value: acc });
}

/**
 * Parse a mass string, returning a diagnostic error object on failure.
 *
 * Supports decimal fractions for units that can represent them exactly in whit, optional grouping
 * separators (`,` and U+2008 PUNCTUATION SPACE) in whole parts, and compound pound+ounce parsing.
 *
 * @param {string} s
 * @returns {Result<number, MassParseError>}
 */
export function parseDimDiagnostic(s) {
  const rest0 = trimEndJotoWhitespace(s);
  if (rest0.length === 0) return err("Empty", 0);

  const stripped = stripUnit(rest0);
  if (!stripped) return err("NoUnit", rest0.length);

  const unit = stripped.unit;
  const atUnit = stripped.rest.length;
  const rest = trimEndJotoWhitespace(stripped.rest);
  if (rest.length === 0) return err("EmptyQuantity", atUnit, { unit });

  const fracRes = takeDecimalFrac(unit, rest);
  if (fracRes.ok === false) return fracRes;
  if (fracRes.value.rest.length === 0) return ok(fracRes.value.value);

  let acc = fracRes.value.value;
  const wholeRes = parseWhole(unit, acc, fracRes.value.rest);
  if (wholeRes.ok === false) {
    if (wholeRes.error.code === "EmptyQuantity" && acc !== 0) return ok(acc);
    return wholeRes;
  }

  const restAfterWhole = wholeRes.value.rest;
  acc = wholeRes.value.value;

  const sup = superior(unit);
  if (sup != null) {
    const restSup0 = trimEndJotoWhitespace(restAfterWhole);
    const at = restSup0.length;
    const supStripped = stripUnit(restSup0);
    if (supStripped) {
      if (supStripped.unit === sup) {
        const supWhole = parseWhole(sup, acc, trimEndJotoWhitespace(supStripped.rest));
        if (supWhole.ok === false) return supWhole;
        return ok(supWhole.value.value);
      }
      return err("InvalidCompound", at, {
        inferior: unit,
        found: supStripped.unit,
        expected: sup,
      });
    }
  }

  return ok(acc);
}

/**
 * Parse a mass string, returning `null` on error.
 *
 * Use `parseDimDiagnostic` if you want to handle specific errors.
 *
 * @param {string} s
 * @returns {number | null}
 */
export function parseDim(s) {
  const end0 = trimEndJotoWhitespaceIndex(s);
  if (end0 === 0) return null;

  const stripped = _stripScratch;
  if (!stripUnitAt(s, end0, stripped)) return null;

  let end = trimEndJotoWhitespaceIndex(s, stripped.restEnd);
  if (end === 0) return null;

  const unitScale = stripped.unit;
  const num = _numScratch;
  if (!takeDecimalFracFast(unitScale, s, end, num)) return null;

  let acc = num.value;
  end = num.restEnd;
  if (end === 0) return acc;

  const wholeStatus = parseWholeFast(unitScale, acc, s, end, num);
  if (wholeStatus === 0) return acc !== 0 ? acc : null;
  if (wholeStatus < 0) return null;

  acc = num.value;
  end = num.restEnd;

  const sup = superior(unitScale);
  if (sup != null) {
    const endSup0 = trimEndJotoWhitespaceIndex(s, end);
    if (stripUnitAt(s, endSup0, stripped)) {
      if (stripped.unit !== sup) return null;
      const endSup = trimEndJotoWhitespaceIndex(s, stripped.restEnd);
      const supWholeStatus = parseWholeFast(sup, acc, s, endSup, num);
      if (supWholeStatus <= 0) return null;
      return num.value;
    }
  }

  return acc;
}

/**
 * Parse a quantity for a known `unit`, returning a diagnostic error object on failure.
 *
 * This does not do compound unit parsing; it parses a single quantity for the given unit.
 *
 * @param {string} s
 * @param {number} unit
 * @returns {Result<number, MassParseError>}
 */
export function parseAsDiagnostic(s, unit) {
  const rest0 = trimEndJotoWhitespace(s);
  if (rest0.length === 0) return err("EmptyQuantity", 0, { unit });

  const fracRes = takeDecimalFrac(unit, rest0);
  if (fracRes.ok === false) return fracRes;
  if (fracRes.value.rest.length === 0) return ok(fracRes.value.value);

  const acc = fracRes.value.value;
  const wholeRes = parseWhole(unit, acc, fracRes.value.rest);
  if (wholeRes.ok === false) {
    if (wholeRes.error.code === "EmptyQuantity" && acc !== 0) return ok(acc);
    return wholeRes;
  }
  return ok(wholeRes.value.value);
}

/**
 * Parse a quantity for a known `unit`, returning `null` on error.
 *
 * Use `parseAsDiagnostic` if you want to handle specific errors.
 *
 * @param {string} s
 * @param {number} unit
 * @returns {number | null}
 */
export function parseAs(s, unit) {
  const end0 = trimEndJotoWhitespaceIndex(s);
  if (end0 === 0) return null;

  const num = _numScratch;
  if (!takeDecimalFracFast(unit, s, end0, num)) return null;

  const acc = num.value;
  const end = num.restEnd;
  if (end === 0) return acc;

  const wholeStatus = parseWholeFast(unit, acc, s, end, num);
  if (wholeStatus === 0) return acc !== 0 ? acc : null;
  if (wholeStatus < 0) return null;
  return num.value;
}

const _stripScratch = { restEnd: 0, unit: 0 };
const _numScratch = { restEnd: 0, value: 0 };
