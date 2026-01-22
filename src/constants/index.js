/**
 * Constants for interoperation of units.
 *
 * # Operating principle
 *
 * This module interoperates US Customary and SI units of length/displacement, mass, and
 * temperature, while preserving invertibility, avoiding uncontrolled precision loss, and
 * replacing structured unit types (which are tricky to store or compute efficiently) with plain
 * integers.
 *
 * This is accomplished by defining common base units for length, mass, and temperature, which can
 * be used to express US customary units and SI units in the same scale for each domain.
 *
 * ## `constants/length`
 *
 * For length, there is the *iota*, defined as 1⁄9 nm.
 *
 * This allows common fractions of an inch (ten-thousandths, desktop publishing points, and
 * sixty-fourths) and multiples of the nanometer to be represented as natural numbers.
 *
 * ## `constants/mass`
 *
 * For mass, there is the *whit*, defined as 1⁄3200 µg.
 *
 * The whit is chosen to express practically measurable weights (down to the 0.1 µg range) as well
 * as all common fractional denominations of the international pound (ounces, dram, thousandths of
 * an ounce, grains) and units related to the pound by grains (such as the troy ounce).
 *
 * ## `constants/temperature`
 *
 * For temperature, there is the *smidge*, defined as 1⁄90 mK.
 *
 * The smidge represents temperatures down to the 100 µK/0.0001 °R range, which is sufficient for
 * almost all practical thermometry. This also allows you to exactly represent temperatures used in
 * industrial metrology standards such as ITS-90 for fixed points and common derived constants, and
 * allows exact interchange between common absolute (Kelvin/Rankine) and relative
 * (Celsius/Fahrenheit) temperature scales.
 *
 * The temperature constants deliberately avoid defining incremental units of temperature by their
 * relative scale names, to remind users to account for the difference in origin/zero point between
 * Fahrenheit and Celsius.
 *
 * [SI units]: https://en.wikipedia.org/wiki/International_System_of_Units
 * [US customary units]: https://en.wikipedia.org/wiki/United_States_customary_units
 * [ITS-90]: https://en.wikipedia.org/wiki/International_Temperature_Scale_of_1990
 * [Rankine]: https://en.wikipedia.org/wiki/Rankine_scale
 *
 * @module joto/constants
 */
export * as length from "./length.js";
export * as mass from "./mass.js";
export * as temperature from "./temperature.js";
