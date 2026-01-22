/**
 * Formatting utilities for length quantities in iota.
 *
 * Output is returned as `{ text, exact }`, where `exact` is `true` when the value is exactly
 * represented by the formatted string under the chosen options.
 *
 * @module joto/format/length
 */

import { assertSafeInt, formatDecimalFraction, formatWhole } from "../_internal/format-helpers.js";
import { Unit, abbr, asciiAbbr } from "../parse/length.js";

export { Unit };

/**
 * Length formatting options.
 *
 * @typedef {object} LengthFormat
 * @property {number|null} [maxDecimalFractionDigits]
 *   Maximum decimal fraction digits.
 *
 *   By default, the formatter will display as many decimal places as required for exact
 *   representation, if such representation is possible.
 * @property {string|null} [thousandsSeparator]
 *   Thousands separator (a single code point), or `null` for no separator.
 * @property {"whole"|"decimal"} [fracType]
 *   Preferred fraction type.
 *
 *   When the unit supports this fraction type, use it preferentially.
 *
 *   When `allowFracFallback` is `true`, the formatter may try the other fraction type if the
 *   preferred type produces a less exact representation.
 * @property {boolean} [allowFracFallback]
 *   Allow a fraction type other than the preferred one, if it is more exact?
 * @property {boolean} [mixed]
 *   Allow mixed units in output (e.g. feet and inches)?
 * @property {"complex"|"ascii"} [outputDeviceMode]
 *   Output device mode.
 */

/**
 * Output device mode.
 *
 * - `Complex`: Use appropriate Unicode for a device or context where Unicode characters like
 *   U+2044 FRACTION SLASH are likely to be rendered correctly.
 * - `Ascii`: Use only plain ASCII in output, for devices which do not do complex shaping, or for
 *   which non-ASCII text is otherwise undesirable.
 *
 * @readonly
 * @enum {"complex"|"ascii"}
 */
export const OutputDeviceMode = Object.freeze({
  Complex: "complex",
  Ascii: "ascii",
});

/**
 * Fraction type — decimal or whole number fraction.
 *
 * @readonly
 * @enum {"whole"|"decimal"}
 */
export const FracType = Object.freeze({
  Whole: "whole",
  Decimal: "decimal",
});

/**
 * Make a new default length format options object.
 *
 * By default, the formatter will display as many decimal places as required for exact
 * representation, if such representation is possible.
 *
 * @returns {Required<LengthFormat>}
 */
export function defaultFormat() {
  return {
    maxDecimalFractionDigits: null,
    thousandsSeparator: null,
    fracType: FracType.Whole,
    allowFracFallback: true,
    mixed: true,
    outputDeviceMode: OutputDeviceMode.Complex,
  };
}

function maxDecimalDigits(unit) {
  switch (unit) {
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

function leastSignificantDigitValue(unit) {
  const digits = maxDecimalDigits(unit);
  if (digits === 0) return unit;
  return Math.trunc(unit / 10 ** digits);
}

function inferior(unit) {
  return unit === Unit.Foot ? Unit.Inch : null;
}

function formatDecimalFracForUnit(rem, unit, maxDecimalFractionDigits) {
  const places = maxDecimalDigits(unit);
  const maxPlaces = Math.min(places, maxDecimalFractionDigits ?? Infinity);
  let lsd = leastSignificantDigitValue(unit);
  if (maxPlaces < places) {
    lsd *= 10 ** (places - maxPlaces);
    if (rem % lsd !== 0) return { text: "", remainder: rem };
  }
  return formatDecimalFraction(rem, lsd, maxPlaces);
}

function trailingZeros32(x) {
  let v = x;
  let c = 0;
  while ((v & 1) === 0 && c < 32) {
    c += 1;
    v >>>= 1;
  }
  return c;
}

function formatInchFrac(rem, ascii, doSpace) {
  const minDiv = Unit.Inch >> 6;
  const quo = Math.trunc(rem / minDiv);
  const r = rem % minDiv;
  if (quo === 0 || r !== 0 || quo > 64) return { text: "", remainder: rem };

  const tz = trailingZeros32(quo);
  const mag = tz <= 5 ? tz : 5;
  const num = quo >> mag;

  const space = doSpace ? (ascii ? " " : "\uFEFF") : "";
  const slash = ascii ? "/" : "\u2044";

  let denom = "";
  switch (mag) {
    case 5:
      denom = "2";
      break;
    case 4:
      denom = "4";
      break;
    case 3:
      denom = "8";
      break;
    case 2:
      denom = "16";
      break;
    case 1:
      denom = "32";
      break;
    case 0:
      denom = "64";
      break;
    default:
      return { text: "", remainder: rem };
  }

  return { text: space + String(num) + slash + denom, remainder: 0 };
}

function chooseInchFrac(rem, wholeHasDigits, fracType, allowFracFallback, ascii, maxDecimalFractionDigits) {
  const space = wholeHasDigits;
  if (fracType === FracType.Whole) {
    const primary = formatInchFrac(rem, ascii, space);
    if (!allowFracFallback || primary.remainder === 0) {
      primary.wholeFrac = true;
      return primary;
    }

    const fallback = formatDecimalFracForUnit(rem, Unit.Inch, maxDecimalFractionDigits);
    if (fallback.remainder < primary.remainder) {
      fallback.wholeFrac = false;
      return fallback;
    }
    primary.wholeFrac = true;
    return primary;
  }

  const primary = formatDecimalFracForUnit(rem, Unit.Inch, maxDecimalFractionDigits);
  if (!allowFracFallback || primary.remainder === 0) {
    primary.wholeFrac = false;
    return primary;
  }

  const fallback = formatInchFrac(rem, ascii, space);
  if (fallback.remainder < primary.remainder) {
    fallback.wholeFrac = true;
    return fallback;
  }
  primary.wholeFrac = false;
  return primary;
}

/**
 * Format a quantity `q` (in iota) as `unit`.
 *
 * - When `format.mixed` is `true`, the formatter may output a compound feet+inches quantity.
 * - When `unit` is inches, whole fractions down to 64ths may be used (depending on options).
 *
 * Throws if `q` is not a safe integer.
 *
 * @param {number} q Quantity in iota (safe integer).
 * @param {number} unit Output unit (from `Unit`).
 * @param {LengthFormat} [format] Formatting options.
 * @returns {{ text: string, exact: boolean }}
 */
export function formatDim(q, unit, format) {
  assertSafeInt(q);
  const maxDecimalFractionDigits = format?.maxDecimalFractionDigits ?? null;
  const thousandsSeparator = format?.thousandsSeparator ?? null;
  const fracType = format?.fracType ?? FracType.Whole;
  const allowFracFallback = format?.allowFracFallback ?? true;
  const mixed = format?.mixed ?? true;
  const outputDeviceMode = format?.outputDeviceMode ?? OutputDeviceMode.Complex;
  const ascii = outputDeviceMode === "ascii";

  const uq = Math.abs(q);

  let finalUnit = unit;

  // In mixed modes, always format as the inferior unit when the quantity
  // is nonzero and less than the primary unit.
  if (mixed && uq !== 0 && uq < unit) {
    const inf = inferior(unit);
    if (inf != null) {
      finalUnit = inf;
      unit = inf;
    }
  }

  let quo = Math.trunc(uq / unit);
  let rem = uq % unit;

  let whole = "";
  if (mixed) {
    const unitInf = inferior(unit);
    if (unitInf != null && rem !== 0) {
      const infQuo = Math.trunc(rem / unitInf);
      const infRem = rem % unitInf;
      if (infQuo !== 0) {
        finalUnit = unitInf;
        rem = infRem;
        const left = quo !== 0 ? formatWhole(quo, thousandsSeparator) + (ascii ? asciiAbbr(unit) : abbr(unit)) : "";
        whole = left + formatWhole(infQuo, thousandsSeparator);
      }
    }
  }

  if (!whole) {
    if (quo === 0 && rem === 0) {
      whole = "0";
    } else if (quo !== 0) {
      whole = formatWhole(quo, thousandsSeparator);
    }
  }

  let fracText = "";
  let exact = true;

  if (finalUnit === Unit.Inch) {
    const chosen = chooseInchFrac(rem, whole.length > 0, fracType, allowFracFallback, ascii, maxDecimalFractionDigits);
    fracText = chosen.text;
    exact = chosen.remainder === 0;
    if (!chosen.wholeFrac && whole.length === 0 && fracText.startsWith(".")) {
      whole = "0";
    }
  } else {
    const frac = formatDecimalFracForUnit(rem, finalUnit, maxDecimalFractionDigits);
    fracText = frac.text;
    exact = frac.remainder === 0;
    if (whole.length === 0 && fracText.startsWith(".")) {
      whole = "0";
    }
  }

  if (whole.length === 0 && fracText.length === 0) {
    whole = "0";
  }

  const text = ascii
        ? `${q < 0 ? "-" : ""}${whole}${fracText}${asciiAbbr(finalUnit)}`
        : `${q < 0 ? "\u2212" : ""}${whole}${fracText}${abbr(finalUnit)}`;
  return { text, exact };
}
