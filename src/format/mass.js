/**
 * Formatting utilities for mass quantities in whit.
 *
 * Output is returned as `{ text, exact }`, where `exact` is `true` when the value is exactly
 * represented by the formatted string under the chosen options.
 *
 * @module joto/format/mass
 */

import { assertSafeInt, formatDecimalFraction, formatWhole } from "../_internal/format-helpers.js";
import { Unit, abbr, asciiAbbr } from "../parse/mass.js";

export { Unit };

/**
 * Mass formatting options.
 *
 * @typedef {object} MassFormat
 * @property {number|null} [maxDecimalFractionDigits]
 *   Maximum decimal fraction digits.
 *
 *   By default, the formatter will display as many decimal places as required for exact
 *   representation, if such representation is possible.
 * @property {string|null} [thousandsSeparator]
 *   Thousands separator (a single code point), or `null` for no separator.
 * @property {"complex"|"ascii"} [outputDeviceMode]
 *   Output device mode.
 */

/**
 * Output device mode.
 *
 * - `Complex`: Use appropriate Unicode for a device or context where non-ASCII unit abbreviations
 *   (e.g. `µg`) are likely to be rendered correctly.
 * - `Ascii`: Use only plain ASCII in output.
 *
 * @readonly
 * @enum {"complex"|"ascii"}
 */
export const OutputDeviceMode = Object.freeze({
  Complex: "complex",
  Ascii: "ascii",
});

/**
 * Make a new default mass format options object.
 *
 * By default, the formatter will display as many decimal places as required for exact
 * representation, if such representation is possible.
 *
 * @returns {Required<MassFormat>}
 */
export function defaultFormat() {
  return {
    maxDecimalFractionDigits: null,
    thousandsSeparator: null,
    outputDeviceMode: OutputDeviceMode.Complex,
  };
}

function maxDecimalDigits(unit) {
  switch (unit) {
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

function leastSignificantDigitValue(unit) {
  const digits = maxDecimalDigits(unit);
  if (digits === 0) return unit;
  return Math.trunc(unit / 10 ** digits);
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

/**
 * Format a quantity `q` (in whit) as `unit`.
 *
 * Throws if `q` is not a safe integer.
 *
 * @param {number} q Quantity in whit (safe integer).
 * @param {number} unit Output unit (from `Unit`).
 * @param {MassFormat} [format] Formatting options.
 * @returns {{ text: string, exact: boolean }}
 */
export function formatDim(q, unit, format) {
  assertSafeInt(q);
  const maxDecimalFractionDigits = format?.maxDecimalFractionDigits ?? null;
  const thousandsSeparator = format?.thousandsSeparator ?? null;
  const outputDeviceMode = format?.outputDeviceMode ?? OutputDeviceMode.Complex;
  const ascii = outputDeviceMode === "ascii";

  const uq = Math.abs(q);

  const quo = Math.trunc(uq / unit);
  const rem = uq % unit;

  const whole = quo === 0 && rem === 0 ? "0" : (quo !== 0 ? formatWhole(quo, thousandsSeparator) : "");
  const frac = formatDecimalFracForUnit(rem, unit, maxDecimalFractionDigits);
  let exact = frac.remainder === 0;

  let wholeFinal = whole;
  if (wholeFinal.length === 0 && frac.text.startsWith(".")) wholeFinal = "0";
  if (wholeFinal.length === 0 && frac.text.length === 0) wholeFinal = "0";

  const text = ascii
    ? `${q < 0 ? "-" : ""}${wholeFinal}${frac.text}${asciiAbbr(unit)}`
    : `${q < 0 ? "\u2212" : ""}${wholeFinal}${frac.text}${abbr(unit)}`;
  return { text, exact };
}
