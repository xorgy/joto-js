/**
 * Constants for common units of length denominated in *iota* — 1⁄9 nm increments.
 *
 * This allows common fractions of an inch (ten-thousandths, desktop publishing points, and
 * sixty-fourths) and multiples of the nanometer to be represented as natural numbers.
 *
 * @module joto/constants/length
 */

/**
 * One ninth of a nanometer.
 *
 * This allows common fractions of an inch (`TEN_THOUSANDTH`, `POINT`, `SIXTY_FOURTH`) and
 * `NANOMETER` to be represented as integers.
 *
 * Using this base unit, combinations of lengths in either US customary units or SI units can be
 * added, subtracted, multiplied, and often divided without loss.
 *
 * [US customary units]: https://en.wikipedia.org/wiki/United_States_customary_units
 * [SI units]: https://en.wikipedia.org/wiki/International_System_of_Units
 *
 * @type {number}
 */
export const IOTA = 1;

/** Nanometer. @type {number} */
export const NANOMETER = 9 * IOTA;
/** Micrometer. (Alias: micron.) @type {number} */
export const MICROMETER = 1_000 * NANOMETER;
/**
 * 1⁄4 `MILLIMETER` a.k.a. “Q”.
 *
 * This unit is used in typography, particularly in Japan.
 *
 * @type {number}
 */
export const QUARTER_MILLIMETER = 250 * MICROMETER;
/** Millimeter. @type {number} */
export const MILLIMETER = 1_000 * MICROMETER;
/** Centimeter. @type {number} */
export const CENTIMETER = 10 * MILLIMETER;
/** Decimeter. @type {number} */
export const DECIMETER = 10 * CENTIMETER;
/** Meter. @type {number} */
export const METER = 1_000 * MILLIMETER;

/** 1⁄64 `INCH`. @type {number} */
export const SIXTY_FOURTH = 3_571_875 * IOTA;
/** 1⁄32 `INCH`. @type {number} */
export const THIRTY_SECOND = 2 * SIXTY_FOURTH;
/** 1⁄16 `INCH`. @type {number} */
export const SIXTEENTH = 2 * THIRTY_SECOND;
/** 1⁄8 `INCH`. @type {number} */
export const EIGHTH = 2 * SIXTEENTH;
/** 1⁄4 `INCH`. @type {number} */
export const QUARTER = 2 * EIGHTH;
/** 1⁄2 `INCH`. @type {number} */
export const HALF = 2 * QUARTER;
/** 1⁄100000 `INCH`. @type {number} */
export const HUNDRED_THOUSANDTH = 2_286 * IOTA;
/** 1⁄10000 `INCH`. @type {number} */
export const TEN_THOUSANDTH = 10 * HUNDRED_THOUSANDTH;
/**
 * 1⁄1000 `INCH`.
 *
 * Aliases: mil, thousandth-inch.
 *
 * @type {number}
 */
export const THOU = 10 * TEN_THOUSANDTH;
/**
 * One desktop publishing point.
 *
 * Exactly 1⁄72 of an `INCH` or 1⁄12 of a `PICA`.
 *
 * https://en.wikipedia.org/wiki/Point_(typography)#Desktop_publishing_point
 *
 * @type {number}
 */
export const POINT = 3_175_000 * IOTA;
/** Pica — exactly 1⁄6 `INCH` or 12 `POINT`. @type {number} */
export const PICA = 12 * POINT;
/** Inch — exactly 1⁄12 `FOOT`. @type {number} */
export const INCH = 6 * PICA;
/** Foot — exactly 1⁄3 `YARD`. @type {number} */
export const FOOT = 12 * INCH;
/**
 * Yard — as defined in the International Yard and Pound agreement.
 *
 * https://en.wikipedia.org/wiki/International_yard_and_pound
 *
 * @type {number}
 */
export const YARD = 3 * FOOT;
