/**
 * Constants for common units of temperature denominated in *smidge* — 1⁄90 mK increments.
 *
 * The smidge represents temperatures down to the 100 µK/0.0001 °R range, which is sufficient for
 * almost all practical thermometry. This allows exact interchange between common absolute
 * (Kelvin/Rankine) and relative (Celsius/Fahrenheit) temperature scales.
 *
 * The temperature constants deliberately avoid defining incremental units of temperature by their
 * relative scale names, to remind users to account for the difference in origin/zero point between
 * Fahrenheit and Celsius.
 *
 * [ITS-90]: https://en.wikipedia.org/wiki/International_Temperature_Scale_of_1990
 *
 * @module joto/constants/temperature
 */

/**
 * Smidge — 1⁄90 mK.
 *
 * This allows 0.1 mK and 0.1 °R and their common multiples to be represented interchangeably as
 * integers.
 *
 * To operate on relative scales (Celsius, Fahrenheit), make sure to account for the difference in
 * origin points with `ZERO_CELSIUS` and `ZERO_FAHRENHEIT`.
 *
 * The value 1⁄90 mK was chosen rather than 1⁄9 because ITS-90 defines fixed points to four decimal
 * digits, making some standard temperatures representable with 100 µK precision, but not with 1 mK
 * precision.
 *
 * Using this base unit, combinations of temperatures in US customary units or SI units can be
 * added, subtracted, multiplied, and often divided without loss.
 *
 * [US customary units]: https://en.wikipedia.org/wiki/United_States_customary_units
 * [SI units]: https://en.wikipedia.org/wiki/International_System_of_Units
 *
 * @type {number}
 */
export const SMIDGE = 1;

/** Millikelvin. @type {number} */
export const MILLIKELVIN = 90 * SMIDGE;
/**
 * Kelvin — absolute scale of Celsius.
 *
 * Use this as the increment of Celsius temperatures, where e.g. `10°C = ZERO_CELSIUS + 10 × KELVIN`.
 *
 * Only the absolute form is given here, to avoid confusion due to Celsius not starting at
 * absolute zero.
 *
 * Alias: celsius increment.
 *
 * @type {number}
 */
export const KELVIN = 1_000 * MILLIKELVIN;
/**
 * 0°C — exactly 273.15 `KELVIN`.
 *
 * `ZERO_CELSIUS` is also exactly `ZERO_FAHRENHEIT + 32 × RANKINE`.
 *
 * @type {number}
 */
export const ZERO_CELSIUS = 273_150 * MILLIKELVIN;

/** 1⁄1000 Rankine. @type {number} */
export const THOUSANDTH_RANKINE = 50 * SMIDGE;
/**
 * Rankine — absolute scale of Fahrenheit.
 *
 * Use this as the increment of Fahrenheit temperatures, where e.g.
 * `50°F = ZERO_FAHRENHEIT + 50 × RANKINE`.
 *
 * Only the absolute form is given here, to avoid confusion due to Fahrenheit not starting at
 * absolute zero.
 *
 * Alias: fahrenheit increment.
 *
 * @type {number}
 */
export const RANKINE = 1_000 * THOUSANDTH_RANKINE;
/** 0°F — exactly 459,670 `THOUSANDTH_RANKINE`. @type {number} */
export const ZERO_FAHRENHEIT = 459_670 * THOUSANDTH_RANKINE;
