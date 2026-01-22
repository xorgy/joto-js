/**
 * Light-weight unit parsing into Joto base units.
 *
 * - `parse/length`: parse dimension strings into *iota* (1⁄9 nm).
 * - `parse/mass`: parse mass strings into *whit* (1⁄3200 µg).
 * - `parse/temperature`: parse temperature strings into *smidge* (1⁄90 mK).
 *
 * Parsers return native `number` safe integers (±2^53). For ergonomic JavaScript error reporting,
 * diagnostic parse errors use UTF-16 string indices (code unit indices) rather than byte offsets.
 *
 * @module joto/parse
 */
export * as length from "./length.js";
export * as mass from "./mass.js";
export * as temperature from "./temperature.js";
