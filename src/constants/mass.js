/**
 * Constants for common units of mass denominated in *whit* — 1⁄3200 µg increments.
 *
 * The whit is chosen to express practically measurable weights (down to the 0.1 µg range) as well
 * as all common fractional denominations of the international pound (ounces, dram, thousandths of
 * an ounce, grains) and units related to the pound by grains (such as the troy ounce).
 *
 * @module joto/constants/mass
 */

/**
 * Whit — 1⁄3200 µg.
 *
 * This allows common divisions of a `POUND` (`OUNCE`, `DRAM`, `THOUSANDTH_OUNCE`) and tenths of a
 * `MICROGRAM` to be represented interchangeably as integers.
 *
 * Using this base unit, combinations of masses in either US customary units or SI units can be
 * added, subtracted, multiplied, and often divided without loss.
 *
 * [US customary units]: https://en.wikipedia.org/wiki/United_States_customary_units
 * [SI units]: https://en.wikipedia.org/wiki/International_System_of_Units
 *
 * @type {number}
 */
export const WHIT = 1;

/** Microgram. @type {number} */
export const MICROGRAM = 3_200 * WHIT;
/** Milligram. @type {number} */
export const MILLIGRAM = 1_000 * MICROGRAM;
/** Gram. @type {number} */
export const GRAM = 1_000 * MILLIGRAM;
/** Kilogram. @type {number} */
export const KILOGRAM = 1_000 * GRAM;
/**
 * Megagram — tonne/metric ton.
 *
 * Use this for SI tonnes instead of `SHORT_TON` and `LONG_TON`.
 *
 * Aliases: metric ton, tonne.
 *
 * @type {number}
 */
export const MEGAGRAM = 1_000 * KILOGRAM;

/** Dram — exactly 1⁄16 `OUNCE`. @type {number} */
export const DRAM = 5_669_904_625 * WHIT;
/** Ounce — exactly 1⁄16 `POUND`. @type {number} */
export const OUNCE = 16 * DRAM;
/**
 * Pound — as defined in the International Yard and Pound agreement.
 *
 * https://en.wikipedia.org/wiki/International_yard_and_pound
 *
 * @type {number}
 */
export const POUND = 16 * OUNCE;
/** Stone — exactly 14 `POUND`. @type {number} */
export const STONE = 14 * POUND;
/** Long hundredweight — exactly 8 `STONE` or 112 `POUND`. @type {number} */
export const LONG_HUNDREDWEIGHT = 8 * STONE;
/** Long ton — exactly 20 `LONG_HUNDREDWEIGHT`. @type {number} */
export const LONG_TON = 20 * LONG_HUNDREDWEIGHT;
/** Short hundredweight — exactly 100 `POUND`. @type {number} */
export const SHORT_HUNDREDWEIGHT = 100 * POUND;
/** Short ton — exactly 20 `SHORT_HUNDREDWEIGHT`. @type {number} */
export const SHORT_TON = 20 * SHORT_HUNDREDWEIGHT;
/** 1⁄1000 `OUNCE`. @type {number} */
export const THOUSANDTH_OUNCE = 90_718_474 * WHIT;
/** Grain — exactly 1⁄7000 `POUND`. @type {number} */
export const GRAIN = 207_356_512 * WHIT;
/** Pennyweight — exactly 24 `GRAIN`. @type {number} */
export const PENNYWEIGHT = 24 * GRAIN;
/** Troy ounce — exactly 20 `PENNYWEIGHT` or 480 `GRAIN`. @type {number} */
export const TROY_OUNCE = 20 * PENNYWEIGHT;
