import test from "node:test";
import assert from "node:assert/strict";

import * as M from "@xorgy/joto/constants/mass";
import { formatDim, Unit } from "@xorgy/joto/format/mass";

test("mass.format: simple + separators", () => {
  assert.deepEqual(formatDim(M.POUND, Unit.Pound, { thousandsSeparator: "," }), { text: "1lb", exact: true });
  assert.equal(formatDim(1_200 * M.POUND, Unit.Pound, { thousandsSeparator: "," }).text, "1,200lb");
  assert.equal(formatDim(1_200_000 * M.GRAM, Unit.Gram, { thousandsSeparator: "\u2008" }).text, `1\u2008200\u2008000g`);
});

test("mass.format: inexact decimals (ounce in pounds)", () => {
  const out = formatDim(1_200 * M.POUND + M.OUNCE, Unit.Pound, { thousandsSeparator: "\u2008" });
  assert.equal(out.text, `1\u2008200.062lb`);
  assert.equal(out.exact, false);
});

test("mass.format: trimming + leading zeros", () => {
  assert.deepEqual(formatDim(12345 * M.MILLIGRAM, Unit.Gram), { text: "12.345g", exact: true });
  assert.equal(formatDim(M.MEGAGRAM / 2, Unit.Megagram).text, "0.5t");
  assert.equal(formatDim(M.MEGAGRAM / 1000, Unit.Megagram).text, "0.001t");
});

test("mass.format: negatives", () => {
  assert.equal(formatDim(-12345 * M.GRAM, Unit.Kilogram).text, `\u221212.345kg`);
  assert.equal(formatDim(-12345 * M.GRAM, Unit.Kilogram, { outputDeviceMode: "ascii" }).text, `-12.345kg`);
  assert.equal(formatDim(-M.MICROGRAM / 100, Unit.Microgram, { outputDeviceMode: "ascii" }).text, `-0.01ug`);
});
