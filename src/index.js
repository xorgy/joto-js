/**
 * Joto base units for JavaScript.
 *
 * This package provides:
 * - Base unit constants for length (*iota*), mass (*whit*), and temperature (*smidge*).
 * - Parsers for converting human-friendly dimension strings into base-unit quantities.
 * - Formatters for converting base-unit quantities back into strings.
 *
 * The JavaScript implementation targets native `number` safe integers (±2^53) and is dependency
 * free, ESM-only, and intended to work in modern browsers and relatively recent Node/Bun.
 *
 * @module joto
 */
export * as constants from "./constants/index.js";
export * as parse from "./parse/index.js";
export * as format from "./format/index.js";
