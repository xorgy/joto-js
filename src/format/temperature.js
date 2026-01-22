/**
 * Formatting utilities for temperature quantities in smidge.
 *
 * Output is returned as `{ text, exact }`, where `exact` is `true` when the value is exactly
 * represented by the formatted string under the chosen options.
 *
 * For relative units (`°C`, `°F`), formatting is done relative to the appropriate origin offset
 * (`ZERO_CELSIUS`, `ZERO_FAHRENHEIT`).
 *
 * @module joto/format/temperature
 */

import { assertSafeInt, formatDecimalFraction, formatWhole } from "../_internal/format-helpers.js";
import { Unit, abbr, asciiAbbr, maxDecimalDigits, leastSignificantDigitValue, originOffset, scale } from "../parse/temperature.js";

export { Unit };

/**
 * Temperature formatting options.
 *
 * @typedef {object} TemperatureFormat
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
 * - `Complex`: Use appropriate Unicode for a device or context where Unicode characters like the
 *   degree sign are likely to be rendered correctly.
 * - `Ascii`: Use only plain ASCII in output (e.g. `C` instead of `°C`).
 *
 * @readonly
 * @enum {"complex"|"ascii"}
 */
export const OutputDeviceMode = Object.freeze({
  Complex: "complex",
  Ascii: "ascii",
});

/**
 * Make a new default temperature format options object.
 *
 * By default, the formatter will display as many decimal places as required for exact
 * representation, if such representation is possible.
 *
 * @returns {Required<TemperatureFormat>}
 */
export function defaultFormat() {
  return {
    maxDecimalFractionDigits: null,
    thousandsSeparator: null,
    outputDeviceMode: OutputDeviceMode.Complex,
  };
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
 * Format an absolute temperature `q` (in smidge) as `unit`.
 *
 * For relative units, the output is relative to the origin:
 * - `t°C` is computed from `q - ZERO_CELSIUS`
 * - `t°F` is computed from `q - ZERO_FAHRENHEIT`
 *
 * Throws if `q` is not a safe integer.
 *
 * @param {number} q Absolute temperature in smidge (safe integer).
 * @param {number} unit Output unit (from `Unit`).
 * @param {TemperatureFormat} [format] Formatting options.
 * @returns {{ text: string, exact: boolean }}
 */
export function formatDim(q, unit, format) {
  assertSafeInt(q);
  const maxDecimalFractionDigits = format?.maxDecimalFractionDigits ?? null;
  const thousandsSeparator = format?.thousandsSeparator ?? null;
  const outputDeviceMode = format?.outputDeviceMode ?? OutputDeviceMode.Complex;
  const ascii = outputDeviceMode == "ascii";

  const origin = originOffset(unit);
  const delta = q - origin;
  const negative = delta < 0;
  const mag = negative ? -delta : delta;

  const unitScale = scale(unit);
  const quo = Math.trunc(mag / unitScale);
  const rem = mag % unitScale;

  let whole = quo === 0 && rem === 0 ? "0" : (quo !== 0 ? formatWhole(quo, thousandsSeparator) : "");
  const frac = formatDecimalFracForUnit(rem, unit, maxDecimalFractionDigits);
  const exact = frac.remainder === 0;
  if (whole.length === 0 && frac.text.startsWith(".")) whole = "0";
  if (whole.length === 0 && frac.text.length === 0) whole = "0";

  const text = ascii
    ? `${negative ? "-" : ""}${whole}${frac.text}${asciiAbbr(unit)}`
    : `${negative ? "\u2212" : ""}${whole}${frac.text}${abbr(unit)}`;
  return { text, exact };
}
