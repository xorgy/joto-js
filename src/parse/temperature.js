/**
 * Light-weight unit parsing of temperature strings into smidge.
 *
 * This module is intended to offer parsing functions that cover common temperature parsing needs
 * for typesetting, for architectural and mechanical specification, or for general engineering use.
 *
 * In this workspace, `SMIDGE` is defined as 1⁄90 mK. This allows exact interchange between common
 * absolute (Kelvin/Rankine) and relative (Celsius/Fahrenheit) temperature scales, while still
 * representing very fine temperature increments (0.1 mK/0.0001 °R).
 *
 * ## Examples
 * ```js
 * import { KELVIN, RANKINE, ZERO_CELSIUS, ZERO_FAHRENHEIT } from "@xorgy/joto/constants/temperature";
 * import { parseDim } from "@xorgy/joto/parse/temperature";
 *
 * console.assert(parseDim("373.15K") === ZERO_CELSIUS + 100 * KELVIN);
 * console.assert(parseDim("32\u00b0F") === ZERO_FAHRENHEIT + 32 * RANKINE);
 * ```
 *
 * @module joto/parse/temperature
 */

import * as c from "../constants/temperature.js";
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
 * Parse error codes for temperature parsing.
 *
 * @typedef {"Empty"|"NoUnit"|"EmptyQuantity"|"TooBig"|"TooSmall"|"TooPrecise"|"InvalidSign"} TemperatureParseErrorCode
 */

/**
 * A temperature parse error.
 *
 * The `index` field is a UTF-16 code unit index (like `String.prototype.slice`) into the trimmed
 * input string.
 *
 * @typedef {{
 *   code: TemperatureParseErrorCode,
 *   index: number,
 *   unit?: number
 * }} TemperatureParseError
 */

/**
 * Unit type for parsing.
 *
 * These are distinct from the constants in `joto/constants/temperature` in the sense that they
 * are meant to represent parsing/generating behavior, and not numeric behavior.
 *
 * - Absolute units (`K`, `\u00b0R`) parse to absolute temperatures.
 * - Relative units (`\u00b0C`, `\u00b0F`) parse to absolute temperatures by applying an origin
 *   offset (`ZERO_CELSIUS`, `ZERO_FAHRENHEIT`).
 *
 * @readonly
 * @typedef {object} TemperatureUnitEnum
 * @property {number} Smidge Smidge — 1⁄90 mK.
 * @property {number} Millikelvin Millikelvin.
 * @property {number} Kelvin Kelvin — absolute scale of Celsius.
 * @property {number} ThousandthRankine Thousandth rankine — 0.001 °R.
 * @property {number} Rankine Rankine — absolute scale of Fahrenheit.
 * @property {number} Celsius Celsius — relative scale based on Kelvin, with origin at `ZERO_CELSIUS`.
 * @property {number} Fahrenheit Fahrenheit — relative scale based on Rankine, with origin at `ZERO_FAHRENHEIT`.
 */
export const Unit = Object.freeze({
  Smidge: 0,
  Millikelvin: 1,
  Kelvin: 2,
  ThousandthRankine: 3,
  Rankine: 4,
  Celsius: 5,
  Fahrenheit: 6,
});

function isAsciiDigitCharCode(c) {
  return c >= 0x30 && c <= 0x39;
}

/**
 * Canonical abbreviation for a unit.
 *
 * @param {number} unit
 * @returns {string}
 */
export function abbr(unit) {
  switch (unit) {
    case Unit.Smidge:
      return "sd";
    case Unit.Millikelvin:
      return "mK";
    case Unit.Kelvin:
      return "K";
    case Unit.ThousandthRankine:
      return "m\u00b0R";
    case Unit.Rankine:
      return "\u00b0R";
    case Unit.Celsius:
      return "\u00b0C";
    case Unit.Fahrenheit:
      return "\u00b0F";
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
    case Unit.Smidge:
      return "sd";
    case Unit.Millikelvin:
      return "mK";
    case Unit.Kelvin:
      return "K";
    case Unit.ThousandthRankine:
      return "mR";
    case Unit.Rankine:
      return "R";
    case Unit.Celsius:
      return "C";
    case Unit.Fahrenheit:
      return "F";
    default:
      return "";
  }
}

/**
 * Maximum number of decimal fraction digits that are exactly represented in smidge.
 *
 * @param {number} unit
 * @returns {number}
 */
export function maxDecimalDigits(unit) {
  switch (unit) {
    case Unit.Smidge:
      return 0;
    case Unit.Millikelvin:
      return 1;
    case Unit.ThousandthRankine:
      return 1;
    default:
      return 4;
  }
}

/**
 * Unit increment in smidge.
 *
 * @param {number} unit
 * @returns {number}
 */
export function scale(unit) {
  switch (unit) {
    case Unit.Smidge:
      return c.SMIDGE;
    case Unit.Millikelvin:
      return c.MILLIKELVIN;
    case Unit.Kelvin:
    case Unit.Celsius:
      return c.KELVIN;
    case Unit.ThousandthRankine:
      return c.THOUSANDTH_RANKINE;
    case Unit.Rankine:
    case Unit.Fahrenheit:
      return c.RANKINE;
    default:
      return 1;
  }
}

/**
 * Unit origin offset in smidge.
 *
 * For relative scales, this is the absolute temperature corresponding to `0°C` or `0°F`.
 *
 * @param {number} unit
 * @returns {number}
 */
export function originOffset(unit) {
  switch (unit) {
    case Unit.Celsius:
      return c.ZERO_CELSIUS;
    case Unit.Fahrenheit:
      return c.ZERO_FAHRENHEIT;
    default:
      return 0;
  }
}

/**
 * The base to use when parsing the least significant safe decimal digit.
 *
 * @param {number} unit
 * @returns {number}
 */
export function leastSignificantDigitValue(unit) {
  switch (unit) {
    case Unit.Smidge:
      return c.SMIDGE;
    case Unit.Millikelvin:
    case Unit.Kelvin:
    case Unit.Celsius:
      return 9;
    default:
      return 5;
  }
}

/**
 * Detect a unit at the end of a temperature string, returning the remainder and the unit.
 *
 * This does not trim whitespace; callers typically want to `trimEnd` first.
 *
 * For `°C`, `°F`, and `°R`, the degree sign is optional.
 *
 * @param {string} s
 * @returns {{ rest: string, unit: number } | null}
 */
export function stripUnit(s) {
  const out = _stripScratch;
  if (!stripUnitAt(s, s.length, out)) return null;
  return { rest: s.slice(0, out.restEnd), unit: out.unit };
}

function stripUnitAt(s, end, out) {
  // Smidge.
  if (s.endsWith("sd", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Smidge), true);

  // Celsius / Fahrenheit (strip the degree sign if present).
  if (s.endsWith("\u00b0C", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Celsius), true);
  if (s.endsWith("C", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Celsius), true);
  if (s.endsWith("\u00b0F", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Fahrenheit), true);
  if (s.endsWith("F", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Fahrenheit), true);

  // Millikelvin / Kelvin.
  if (s.endsWith("mK", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Millikelvin), true);
  if (s.endsWith("K", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Kelvin), true);

  // Thousandth rankine / Rankine (strip the degree sign if present).
  if (s.endsWith("m\u00b0R", end)) return ((out.restEnd = end - 3), (out.unit = Unit.ThousandthRankine), true);
  if (s.endsWith("mR", end)) return ((out.restEnd = end - 2), (out.unit = Unit.ThousandthRankine), true);
  if (s.endsWith("\u00b0R", end)) return ((out.restEnd = end - 2), (out.unit = Unit.Rankine), true);
  if (s.endsWith("R", end)) return ((out.restEnd = end - 1), (out.unit = Unit.Rankine), true);

  return false;
}

/**
 * @param {TemperatureParseErrorCode} code
 * @param {number} index
 * @param {Partial<Omit<TemperatureParseError, "code" | "index">>} [extra]
 * @returns {{ ok: false, error: TemperatureParseError }}
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

function stripSign(s) {
  if (s.endsWith("+")) return { rest: s.slice(0, -1), sign: 1, has: true };
  if (s.endsWith("-")) return { rest: s.slice(0, -1), sign: -1, has: true };
  if (s.endsWith("\u2212")) return { rest: s.slice(0, -1), sign: -1, has: true };
  return { rest: s, sign: 1, has: false };
}

function takeDecimalFrac(unit, rest) {
  const at = rest.length;
  if (rest.endsWith(".")) {
    const r = rest.slice(0, -1);
    if (r.length > 0 && isAsciiDigitCharCode(r.charCodeAt(r.length - 1))) return ok({ rest: r, value: 0, hadFrac: false });
    return err("EmptyQuantity", at, { unit });
  }

  const [dRest, digits] = stripTrailingAsciiDigits(rest);
  if (dRest.length === 0) return ok({ rest, value: 0, hadFrac: false });

  const hadFracDigits = digits.length > 0;
  const nonzeroDigits = trimTrailingAsciiZeroes(digits);
  const len = nonzeroDigits.length;
  if (!dRest.endsWith(".")) return ok({ rest, value: 0, hadFrac: false });

  const r = dRest.slice(0, -1);
  if (len === 0) {
    if (r.length > 0 || digits.length > 0) return ok({ rest: r, value: 0, hadFrac: hadFracDigits });
    return err("EmptyQuantity", at, { unit });
  }

  const scaleDigits = maxDecimalDigits(unit);
  if (len > scaleDigits) return err("TooPrecise", at, { unit });

  const b = nonzeroDigits;
  let pv = leastSignificantDigitValue(unit);
  let acc = 0;
  let i = scaleDigits;
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
  return ok({ rest: r, value: acc, hadFrac: true });
}

function maxWholeDigitsForScale(scaleValue) {
  const q = Math.trunc(Number.MAX_SAFE_INTEGER / scaleValue);
  if (q <= 0) return 0;
  return String(q).length;
}

function parseWhole(unit, acc, s) {
  if (s.length === 0 || !isAsciiDigitCharCode(s.charCodeAt(s.length - 1))) {
    return err("EmptyQuantity", s.length, { unit });
  }

  const unitScale = scale(unit);
  const maxDigits = maxWholeDigitsForScale(unitScale);
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
            return err("TooBig", i, { unit });
          }
          acc += add;
        }
        digitsSeen += 1;
        if (digitsSeen < maxDigits) {
          if (pv > Math.trunc(Number.MAX_SAFE_INTEGER / 10)) return err("TooBig", i, { unit });
          pv *= 10;
        }
      } else if (digit !== 0) {
        return err("TooBig", i, { unit });
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

function finalize(unit, acc, rest) {
  const trimmed = trimEndJotoWhitespace(rest);
  const signInfo = stripSign(trimmed);
  if (signInfo.has && originOffset(unit) === 0) {
    return err("InvalidSign", signInfo.rest.length, { unit });
  }

  const origin = originOffset(unit);
  if (signInfo.has && signInfo.sign < 0) {
    if (acc > origin) return err("TooSmall", signInfo.rest.length, { unit });
    return ok(origin - acc);
  }

  const v = origin + acc;
  if (v > Number.MAX_SAFE_INTEGER) return err("TooBig", signInfo.rest.length, { unit });
  return ok(v);
}

const MAX_WHOLE_DIGITS_BY_UNIT = Object.freeze({
  [Unit.Smidge]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Smidge))).length,
  [Unit.Millikelvin]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Millikelvin))).length,
  [Unit.Kelvin]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Kelvin))).length,
  [Unit.ThousandthRankine]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.ThousandthRankine))).length,
  [Unit.Rankine]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Rankine))).length,
  [Unit.Celsius]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Celsius))).length,
  [Unit.Fahrenheit]: String(Math.trunc(Number.MAX_SAFE_INTEGER / scale(Unit.Fahrenheit))).length,
});

function parseWholeFast(unit, acc, s, end, out) {
  if (end === 0 || !isAsciiDigitCharCode(s.charCodeAt(end - 1))) return 0;

  const unitScale = scale(unit);
  const maxDigits = MAX_WHOLE_DIGITS_BY_UNIT[unit] ?? 0;
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

function takeDecimalFracFast(unit, s, end, out) {
  // Trailing '.' is accepted only if preceded by a digit.
  if (end > 0 && s.charCodeAt(end - 1) === 0x2e /* . */) {
    const rEnd = end - 1;
    if (rEnd > 0 && isAsciiDigitCharCode(s.charCodeAt(rEnd - 1))) {
      out.restEnd = rEnd;
      out.value = 0;
      out.hadFrac = false;
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
    out.hadFrac = false;
    return true;
  }

  // No '.' before digits: no fraction.
  if (digitsStart === 0 || s.charCodeAt(digitsStart - 1) !== 0x2e /* . */) {
    out.restEnd = end;
    out.value = 0;
    out.hadFrac = false;
    return true;
  }

  const restEnd = digitsStart - 1;

  let nzEnd = digitsEnd;
  while (nzEnd > digitsStart && s.charCodeAt(nzEnd - 1) === 0x30 /* 0 */) nzEnd -= 1;
  const len = nzEnd - digitsStart;

  if (len === 0) {
    out.restEnd = restEnd;
    out.value = 0;
    out.hadFrac = true;
    return true;
  }

  const scaleDigits = maxDecimalDigits(unit);
  if (len > scaleDigits) return false;

  let pv = leastSignificantDigitValue(unit);
  let i = scaleDigits;
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
  out.hadFrac = true;
  return true;
}

function finalizeFast(unit, acc, s, end) {
  let restEnd = trimEndJotoWhitespaceIndex(s, end);
  let sign = 1;
  let hasSign = false;
  if (restEnd > 0) {
    const c = s.charCodeAt(restEnd - 1);
    if (c === 0x2b /* + */) {
      hasSign = true;
      sign = 1;
      restEnd -= 1;
    } else if (c === 0x2d /* - */ || c === 0x2212 /* − */) {
      hasSign = true;
      sign = -1;
      restEnd -= 1;
    }
  }

  const origin = originOffset(unit);
  if (hasSign && origin === 0) return null;

  if (hasSign && sign < 0) {
    if (acc > origin) return null;
    return origin - acc;
  }

  const v = origin + acc;
  return v > Number.MAX_SAFE_INTEGER ? null : v;
}

/**
 * Parse a temperature string, returning a diagnostic error object on failure.
 *
 * Parsed values are absolute temperatures in smidge:
 * - `t°C = ZERO_CELSIUS + t × KELVIN`
 * - `t°F = ZERO_FAHRENHEIT + t × RANKINE`
 *
 * @param {string} s
 * @returns {Result<number, TemperatureParseError>}
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

  const frac = fracRes.value.value;
  const hadFrac = fracRes.value.hadFrac;
  const restAfterFrac = fracRes.value.rest;

  if (restAfterFrac.length === 0) return finalize(unit, frac, restAfterFrac);

  const wholeRes = parseWhole(unit, frac, restAfterFrac);
  if (wholeRes.ok === false) {
    if (wholeRes.error.code === "EmptyQuantity" && hadFrac) return finalize(unit, frac, restAfterFrac);
    return wholeRes;
  }
  return finalize(unit, wholeRes.value.value, wholeRes.value.rest);
}

/**
 * Parse a temperature string, returning `null` on error.
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

  const unit = stripped.unit;
  let end = trimEndJotoWhitespaceIndex(s, stripped.restEnd);
  if (end === 0) return null;

  const num = _numScratch;
  if (!takeDecimalFracFast(unit, s, end, num)) return null;

  let acc = num.value;
  end = num.restEnd;
  const hadFrac = num.hadFrac;

  if (end === 0) return finalizeFast(unit, acc, s, end) ?? null;

  const wholeStatus = parseWholeFast(unit, acc, s, end, num);
  if (wholeStatus === 0) return hadFrac ? (finalizeFast(unit, acc, s, end) ?? null) : null;
  if (wholeStatus < 0) return null;

  acc = num.value;
  end = num.restEnd;
  return finalizeFast(unit, acc, s, end) ?? null;
}

/**
 * Parse a quantity for a known `unit`, returning a diagnostic error object on failure.
 *
 * This parses a single temperature quantity (including origin offsets for relative scales) for
 * the given unit.
 *
 * @param {string} s
 * @param {number} unit
 * @returns {Result<number, TemperatureParseError>}
 */
export function parseAsDiagnostic(s, unit) {
  const rest0 = trimEndJotoWhitespace(s);
  if (rest0.length === 0) return err("EmptyQuantity", 0, { unit });

  const fracRes = takeDecimalFrac(unit, rest0);
  if (fracRes.ok === false) return fracRes;

  const frac = fracRes.value.value;
  const hadFrac = fracRes.value.hadFrac;
  const restAfterFrac = fracRes.value.rest;

  if (restAfterFrac.length === 0) return finalize(unit, frac, restAfterFrac);

  const wholeRes = parseWhole(unit, frac, restAfterFrac);
  if (wholeRes.ok === false) {
    if (wholeRes.error.code === "EmptyQuantity" && hadFrac) return finalize(unit, frac, restAfterFrac);
    return wholeRes;
  }
  return finalize(unit, wholeRes.value.value, wholeRes.value.rest);
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

  let acc = num.value;
  let end = num.restEnd;
  const hadFrac = num.hadFrac;

  if (end === 0) return finalizeFast(unit, acc, s, end) ?? null;

  const wholeStatus = parseWholeFast(unit, acc, s, end, num);
  if (wholeStatus === 0) return hadFrac ? (finalizeFast(unit, acc, s, end) ?? null) : null;
  if (wholeStatus < 0) return null;

  acc = num.value;
  end = num.restEnd;
  return finalizeFast(unit, acc, s, end) ?? null;
}

const _stripScratch = { restEnd: 0, unit: 0 };
const _numScratch = { restEnd: 0, value: 0, hadFrac: false };
