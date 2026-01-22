/**
 * Light-weight unit parsing of dimension strings into iota.
 *
 * This module is intended to cover common dimension parsing needs for typesetting, architectural
 * and mechanical specification, and general engineering use.
 *
 * The parsers do not allocate (beyond normal JS engine internals), avoid regex-heavy parsing, and
 * return base-unit quantities as `number` safe integers (±2^53).
 *
 * ## Examples
 * ```js
 * import { FOOT, INCH, MILLIMETER, SIXTY_FOURTH } from "@xorgy/joto/constants/length";
 * import { parseDim } from "@xorgy/joto/parse/length";
 *
 * console.assert(parseDim("2.5cm") === 25 * MILLIMETER);
 * console.assert(
 *   parseDim("46'11\u202f37\u204464\"") === 46 * FOOT + 11 * INCH + 37 * SIXTY_FOURTH,
 * );
 * ```
 *
 * ## Invertibility
 *
 * Invertibility is the primary attraction of iota as a base unit. You can add and subtract mixed
 * units without loss (within the safe-integer range):
 *
 * ```js
 * import { parseDim } from "@xorgy/joto/parse/length";
 *
 * const p = (s) => {
 *   const v = parseDim(s);
 *   if (v == null) throw new Error(`parse failed: ${s}`);
 *   return v;
 * };
 *
 * console.assert(
 *   0 === p("2.5cm") + p("1\u204464in") + p("0.500 in") - p("37,700\u03bcm") - p("1/64\u2033"),
 * );
 * ```
 *
 * @module joto/parse/length
 */

import * as c from "../constants/length.js";
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
 * Parse error codes for length parsing.
 *
 * @typedef {"Empty"|"NoUnit"|"EmptyQuantity"|"TooBig"|"TooPrecise"|"BadDenominator"|"BadNumerator"|"InvalidCompound"} LengthParseErrorCode
 */

/**
 * A length parse error.
 *
 * The `index` field is a UTF-16 code unit index (like `String.prototype.slice`) into the trimmed
 * input string.
 *
 * @typedef {{
 *   code: LengthParseErrorCode,
 *   index: number,
 *   unit?: number,
 *   inferior?: number,
 *   found?: number,
 *   expected?: number
 * }} LengthParseError
 */

/**
 * Unit type for parsing.
 *
 * These are distinct from the constants in `joto/constants/length` in the sense that they are
 * meant to represent parsing/generating behavior, and not numeric behavior.
 *
 * @readonly
 * @typedef {object} LengthUnitEnum
 * @property {number} Iota Iota — one ninth of a nanometer.
 * @property {number} Inch Inch — exactly 1⁄12 of a Foot.
 * @property {number} Foot Foot — exactly 1⁄3 of a Yard.
 * @property {number} Yard Yard — defined in the International Yard and Pound agreement.
 * @property {number} Point Desktop publishing point — exactly 1⁄72 of an inch or 1⁄12 of a pica.
 * @property {number} Pica Desktop publishing pica — exactly 1⁄6 of an inch or 12 points.
 * @property {number} Nanometer Nanometer.
 * @property {number} Micrometer Micrometer.
 * @property {number} Millimeter Millimeter.
 * @property {number} Centimeter Centimeter.
 * @property {number} Decimeter Decimeter.
 * @property {number} Meter Meter.
 * @property {number} Q Q — quarter-millimeter; a typesetting unit primarily used in Japan (250 µm).
 */
export const Unit = Object.freeze({
  Iota: c.IOTA,
  Inch: c.INCH,
  Foot: c.FOOT,
  Yard: c.YARD,
  Point: c.POINT,
  Pica: c.PICA,
  Nanometer: c.NANOMETER,
  Micrometer: c.MICROMETER,
  Millimeter: c.MILLIMETER,
  Centimeter: c.CENTIMETER,
  Decimeter: c.DECIMETER,
  Meter: c.METER,
  Q: c.QUARTER_MILLIMETER,
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
    case Unit.Iota:
      return "io";
    case Unit.Foot:
      return "\u2032"; // ′
    case Unit.Inch:
      return "\u2033"; // ″
    case Unit.Yard:
      return "yd";
    case Unit.Point:
      return "pt";
    case Unit.Pica:
      return "pc";
    case Unit.Nanometer:
      return "nm";
    case Unit.Micrometer:
      return "\u00b5m"; // µm
    case Unit.Millimeter:
      return "mm";
    case Unit.Centimeter:
      return "cm";
    case Unit.Decimeter:
      return "dm";
    case Unit.Meter:
      return "m";
    case Unit.Q:
      return "Q";
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
    case Unit.Iota:
      return "io";
    case Unit.Foot:
      return "'";
    case Unit.Inch:
      return '"';
    case Unit.Yard:
      return "yd";
    case Unit.Point:
      return "pt";
    case Unit.Pica:
      return "pc";
    case Unit.Nanometer:
      return "nm";
    case Unit.Micrometer:
      return "um";
    case Unit.Millimeter:
      return "mm";
    case Unit.Centimeter:
      return "cm";
    case Unit.Decimeter:
      return "dm";
    case Unit.Meter:
      return "m";
    case Unit.Q:
      return "Q";
    default:
      return "";
  }
}

function unitName(u) {
  switch (u) {
    case Unit.Iota:
      return "Iota";
    case Unit.Inch:
      return "Inch";
    case Unit.Foot:
      return "Foot";
    case Unit.Yard:
      return "Yard";
    case Unit.Point:
      return "Point";
    case Unit.Pica:
      return "Pica";
    case Unit.Nanometer:
      return "Nanometer";
    case Unit.Micrometer:
      return "Micrometer";
    case Unit.Millimeter:
      return "Millimeter";
    case Unit.Centimeter:
      return "Centimeter";
    case Unit.Decimeter:
      return "Decimeter";
    case Unit.Meter:
      return "Meter";
    case Unit.Q:
      return "Q";
    default:
      return "Unknown";
  }
}

function maxDecimalDigits(u) {
  switch (u) {
    case Unit.Inch:
    case Unit.Pica:
    case Unit.Yard:
    case Unit.Foot:
      return 5;
    case Unit.Meter:
      return 9;
    case Unit.Decimeter:
      return 8;
    case Unit.Centimeter:
      return 7;
    case Unit.Millimeter:
      return 6;
    case Unit.Q:
      return 4;
    case Unit.Micrometer:
    case Unit.Point:
      return 3;
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
  return u === Unit.Inch ? Unit.Foot : null;
}

function inferior(u) {
  return u === Unit.Foot ? Unit.Inch : null;
}

function stripUnitAt(s, end, out) {
  // Inch.
  if (s.endsWith('"', end)) return ((out.restEnd = end - 1), (out.unit = Unit.Inch), true);
  if (s.endsWith("in", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Inch), true);
  if (s.endsWith("\u2033", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Inch), true); // ″

  // Foot.
  if (s.endsWith("'", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Foot), true);
  if (s.endsWith("ft", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Foot), true);
  if (s.endsWith("\u2032", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Foot), true); // ′

  if (s.endsWith("yd", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Yard), true);

  if (s.endsWith("nm", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Nanometer), true);

  if (s.endsWith("um", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Micrometer), true);
  if (s.endsWith("\u00b5m", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Micrometer), true); // µm
  if (s.endsWith("\u03bcm", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Micrometer), true); // μm

  if (s.endsWith("mm", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Millimeter), true);
  if (s.endsWith("cm", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Centimeter), true);
  if (s.endsWith("dm", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Decimeter), true);
  if (s.endsWith("m", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Meter), true);

  if (s.endsWith("Q", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Q), true);

  if (s.endsWith("pt", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Point), true);
  if (s.endsWith("pc", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Pica), true);

  if (s.endsWith("io", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Iota), true);

  return false;
}

/**
 * Detect a unit at the end of a length string, returning the remainder and the unit.
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
 * @param {LengthParseErrorCode} code
 * @param {number} index
 * @param {Partial<Omit<LengthParseError, "code" | "index">>} [extra]
 * @returns {{ ok: false, error: LengthParseError }}
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

function parseInchDenomPv(s) {
  switch (s) {
    case "2":
      return { den: 2, pv: c.INCH / 2 };
    case "4":
      return { den: 4, pv: c.INCH / 4 };
    case "8":
      return { den: 8, pv: c.INCH / 8 };
    case "16":
      return { den: 16, pv: c.INCH / 16 };
    case "32":
      return { den: 32, pv: c.INCH / 32 };
    case "64":
      return { den: 64, pv: c.INCH / 64 };
    default:
      return null;
  }
}

function parseInchNum(s) {
  if (s.length === 1) return s.charCodeAt(0) & 0x0f;
  if (s.length === 2) {
    const tens = (s.charCodeAt(0) & 0x0f) * 10;
    const ones = s.charCodeAt(1) & 0x0f;
    return tens + ones;
  }
  return null;
}

function takeInchFrac(rest) {
  const at = rest.length;
  const unit = Unit.Inch;
  const [dRest, denomDigits] = stripTrailingAsciiDigits(rest);
  if (denomDigits.length === 0) return err("EmptyQuantity", at, { unit });

  if (dRest.endsWith("/") || dRest.endsWith("\u2044")) {
    const denInfo = parseInchDenomPv(denomDigits);
    if (!denInfo) return err("BadDenominator", at, { unit });

    const s = dRest.slice(0, -1);
    const atNum = s.length;
    const [numRest, numeratorDigits] = stripTrailingAsciiDigits(s);
    if (numeratorDigits.length === 0) return err("BadNumerator", atNum, { unit });

    const num = parseInchNum(numeratorDigits);
    if (num == null || num < 1 || num >= denInfo.den) {
      return err("BadNumerator", atNum, { unit });
    }
    return ok({ rest: trimEndJotoWhitespace(numRest), value: denInfo.pv * num });
  }

  if (dRest.endsWith(".")) {
    const scale = maxDecimalDigits(unit);
    const r = dRest.slice(0, -1);
    const atR = r.length;
    const digits = trimTrailingAsciiZeroes(denomDigits);
    const len = digits.length;
    if (len === 0) return ok({ rest: r, value: 0 });
    if (len > scale) return err("TooPrecise", atR, { unit });

    let pv = leastSignificantDigitValue(unit);
    let i = scale;
    while (i > len) {
      i -= 1;
      pv *= 10;
    }
    let acc = 0;
    while (i > 0) {
      i -= 1;
      const d = digits.charCodeAt(i) & 0x0f;
      acc += d * pv;
      pv *= 10;
    }
    return ok({ rest: r, value: acc });
  }

  return ok({ rest, value: 0 });
}

function maxWholeDigitsForUnitScale(unitScale) {
  const q = Math.trunc(Number.MAX_SAFE_INTEGER / unitScale);
  if (q <= 0) return 0;
  return String(q).length;
}

const MAX_WHOLE_DIGITS_BY_UNIT_SCALE = new Map([
  [Unit.Iota, maxWholeDigitsForUnitScale(Unit.Iota)],
  [Unit.Inch, maxWholeDigitsForUnitScale(Unit.Inch)],
  [Unit.Foot, maxWholeDigitsForUnitScale(Unit.Foot)],
  [Unit.Yard, maxWholeDigitsForUnitScale(Unit.Yard)],
  [Unit.Point, maxWholeDigitsForUnitScale(Unit.Point)],
  [Unit.Pica, maxWholeDigitsForUnitScale(Unit.Pica)],
  [Unit.Nanometer, maxWholeDigitsForUnitScale(Unit.Nanometer)],
  [Unit.Micrometer, maxWholeDigitsForUnitScale(Unit.Micrometer)],
  [Unit.Millimeter, maxWholeDigitsForUnitScale(Unit.Millimeter)],
  [Unit.Centimeter, maxWholeDigitsForUnitScale(Unit.Centimeter)],
  [Unit.Decimeter, maxWholeDigitsForUnitScale(Unit.Decimeter)],
  [Unit.Meter, maxWholeDigitsForUnitScale(Unit.Meter)],
  [Unit.Q, maxWholeDigitsForUnitScale(Unit.Q)],
]);

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

  let nzEnd = digitsEnd;
  while (nzEnd > digitsStart && s.charCodeAt(nzEnd - 1) === 0x30 /* 0 */) nzEnd -= 1;
  const len = nzEnd - digitsStart;

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

function parseInchDenomFast(s, denomStart, denomEnd) {
  const len = denomEnd - denomStart;
  if (len === 1) {
    const d0 = s.charCodeAt(denomStart) & 0x0f;
    switch (d0) {
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      default:
        return 0;
    }
  }
  if (len === 2) {
    const d0 = s.charCodeAt(denomStart) & 0x0f;
    const d1 = s.charCodeAt(denomStart + 1) & 0x0f;
    const v = d0 * 10 + d1;
    switch (v) {
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      default:
        return 0;
    }
  }
  return 0;
}

function parseInchNumFast(s, start, end) {
  const len = end - start;
  if (len === 1) return s.charCodeAt(start) & 0x0f;
  if (len === 2) return (s.charCodeAt(start) & 0x0f) * 10 + (s.charCodeAt(start + 1) & 0x0f);
  return null;
}

function takeInchFracFast(s, end, out) {
  // Strip trailing digits to get possible denominator digits.
  const denomEnd = end;
  let denomStart = end;
  while (denomStart > 0 && isAsciiDigitCharCode(s.charCodeAt(denomStart - 1))) denomStart -= 1;
  if (denomStart === denomEnd) return false;

  // Whole fraction form: ... <num> ('/' | '⁄') <den>
  if (denomStart > 0) {
    const sep = s.charCodeAt(denomStart - 1);
    if (sep === 0x2f /* / */ || sep === 0x2044 /* ⁄ */) {
      const den = parseInchDenomFast(s, denomStart, denomEnd);
      if (den === 0) return false;

      const numEnd = denomStart - 1;
      let numStart = numEnd;
      while (numStart > 0 && isAsciiDigitCharCode(s.charCodeAt(numStart - 1))) numStart -= 1;
      if (numStart === numEnd) return false;

      const num = parseInchNumFast(s, numStart, numEnd);
      if (num == null || num < 1 || num >= den) return false;

      out.restEnd = trimEndJotoWhitespaceIndex(s, numStart);
      out.value = (c.INCH / den) * num;
      return true;
    }
  }

  // Decimal fraction form: ... '.' <digits>
  if (denomStart > 0 && s.charCodeAt(denomStart - 1) === 0x2e /* . */) {
    const restEnd = denomStart - 1;
    let nzEnd = denomEnd;
    while (nzEnd > denomStart && s.charCodeAt(nzEnd - 1) === 0x30 /* 0 */) nzEnd -= 1;
    const len = nzEnd - denomStart;
    if (len === 0) {
      out.restEnd = restEnd;
      out.value = 0;
      return true;
    }

    const scale = maxDecimalDigits(Unit.Inch);
    if (len > scale) return false;

    let pv = leastSignificantDigitValue(Unit.Inch);
    let i = scale;
    while (i > len) {
      i -= 1;
      pv *= 10;
    }
    let acc = 0;
    for (let k = len - 1; k >= 0; k -= 1) {
      const d = s.charCodeAt(denomStart + k) & 0x0f;
      acc += d * pv;
      pv *= 10;
    }
    out.restEnd = restEnd;
    out.value = acc;
    return true;
  }

  out.restEnd = end;
  out.value = 0;
  return true;
}

/**
 * Parse a dimension string, returning a diagnostic error object on failure.
 *
 * This supports:
 * - Decimal fractions for units that can represent them exactly in iota.
 * - Inch whole fractions with `/` or U+2044 FRACTION SLASH, down to 64ths.
 * - Optional grouping separators (`,` and U+2008 PUNCTUATION SPACE) in whole parts.
 * - Optional trailing whitespace from a fixed “Joto whitespace” set.
 * - Compound foot+inch parsing (e.g. `37'11\u2033`).
 *
 * @param {string} s
 * @returns {Result<number, LengthParseError>}
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

  let acc = 0;
  let restAfterFrac = rest;
  if (unit === Unit.Inch) {
    const r = takeInchFrac(restAfterFrac);
    if (r.ok === false) return r;
    acc = r.value.value;
    restAfterFrac = r.value.rest;
  } else {
    const r = takeDecimalFrac(unit, restAfterFrac);
    if (r.ok === false) return r;
    if (r.value.rest.length === 0) return ok(r.value.value);
    acc = r.value.value;
    restAfterFrac = r.value.rest;
  }

  const wholeRes = parseWhole(unit, acc, restAfterFrac);
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
 * Parse a dimension string, returning `null` on error.
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

  const unitScale = stripped.unit;
  let end = trimEndJotoWhitespaceIndex(s, stripped.restEnd);
  if (end === 0) return null;

  const num = _numScratch;
  let acc = 0;
  if (unitScale === Unit.Inch) {
    if (!takeInchFracFast(s, end, num)) return null;
    acc = num.value;
    end = num.restEnd;
    if (end === 0) return acc;
  } else {
    if (!takeDecimalFracFast(unitScale, s, end, num)) return null;
    acc = num.value;
    end = num.restEnd;
    if (end === 0) return acc;
  }

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
 * @returns {Result<number, LengthParseError>}
 */
export function parseAsDiagnostic(s, unit) {
  const rest0 = trimEndJotoWhitespace(s);
  if (rest0.length === 0) return err("EmptyQuantity", 0, { unit });

  let acc = 0;
  let restAfterFrac = rest0;
  if (unit === Unit.Inch) {
    const r = takeInchFrac(restAfterFrac);
    if (r.ok === false) return r;
    acc = r.value.value;
    restAfterFrac = r.value.rest;
  } else {
    const r = takeDecimalFrac(unit, restAfterFrac);
    if (r.ok === false) return r;
    if (r.value.rest.length === 0) return ok(r.value.value);
    acc = r.value.value;
    restAfterFrac = r.value.rest;
  }

  const wholeRes = parseWhole(unit, acc, restAfterFrac);
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

  let end = end0;
  let acc = 0;

  const num = _numScratch;

  if (unit === Unit.Inch) {
    if (!takeInchFracFast(s, end, num)) return null;
    acc = num.value;
    end = num.restEnd;
    if (end === 0) return acc;
  } else {
    if (!takeDecimalFracFast(unit, s, end, num)) return null;
    acc = num.value;
    end = num.restEnd;
    if (end === 0) return acc;
  }

  const wholeStatus = parseWholeFast(unit, acc, s, end, num);
  if (wholeStatus === 0) return acc !== 0 ? acc : null;
  if (wholeStatus < 0) return null;
  return num.value;
}

const _stripScratch = { restEnd: 0, unit: 0 };
const _numScratch = { restEnd: 0, value: 0 };

/**
 * Return basic metadata for a length unit.
 *
 * @param {number} unit
 * @returns {Readonly<{
 *   name: string,
 *   maxDecimalDigits: number,
 *   leastSignificantDigitValue: number,
 *   superior: number | null,
 *   inferior: number | null
 * }>}
 */
export function unitInfo(unit) {
  return Object.freeze({
    name: unitName(unit),
    maxDecimalDigits: maxDecimalDigits(unit),
    leastSignificantDigitValue: leastSignificantDigitValue(unit),
    superior: superior(unit),
    inferior: inferior(unit),
  });
}
