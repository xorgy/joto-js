import test from "node:test";
import assert from "node:assert/strict";

import * as L from "@xorgy/joto/constants/length";
import { formatDim, Unit, FracType } from "@xorgy/joto/format/length";
import { parseDim } from "@xorgy/joto/parse/length";

test("length.format: simple + separators", () => {
  assert.deepEqual(formatDim(L.FOOT, Unit.Foot, { thousandsSeparator: "," }), { text: "1\u2032", exact: true });
  assert.equal(formatDim(1_200 * L.FOOT, Unit.Foot, { thousandsSeparator: "," }).text, "1,200\u2032");
  assert.equal(formatDim(1_200_000 * L.FOOT, Unit.Foot, { thousandsSeparator: "\u2008" }).text, `1\u2008200\u2008000\u2032`);
  assert.equal(
    formatDim(1_200_000 * L.FOOT + L.INCH, Unit.Foot, { thousandsSeparator: "\u2008" }).text,
    `1\u2008200\u2008000\u20321\u2033`,
  );
});

test("length.format: fractions + ascii", () => {
  assert.equal(
    formatDim(1_200_000 * L.FOOT + L.INCH + 25_000 * L.HUNDRED_THOUSANDTH, Unit.Foot, { thousandsSeparator: "," }).text,
    `1,200,000\u20321\uFEFF1\u20444\u2033`,
  );

  assert.equal(
    formatDim(1_200_000 * L.FOOT + L.INCH + 50_000 * L.HUNDRED_THOUSANDTH, Unit.Foot, { outputDeviceMode: "ascii" }).text,
    `1200000'1 1/2"`,
  );
});

test("length.format: decimal inch preference + fallback", () => {
  assert.equal(
    formatDim(1_200_000 * L.FOOT + L.INCH + L.HUNDRED_THOUSANDTH, Unit.Foot, {
      fracType: FracType.Decimal,
    }).text,
    `1200000\u20321.00001\u2033`,
  );

  const out = formatDim(L.INCH + L.HUNDRED_THOUSANDTH + L.IOTA, Unit.Inch, {
    fracType: FracType.Decimal,
    allowFracFallback: true,
  });
  assert.equal(out.text, `1.00001\u2033`);
  assert.equal(out.exact, false);
});

test("length.format: parse/format roundtrip (exact case)", () => {
  const v = parseDim("21'11\uFEFF17\u204432in");
  const o = formatDim(v, Unit.Foot);
  assert.equal(parseDim(o.text), v);
});

test("length.format: negatives", () => {
  assert.equal(formatDim(-12345 * L.MILLIMETER, Unit.Meter, {}).text, `\u221212.345m`);
  assert.equal(formatDim(-12345 * L.MILLIMETER, Unit.Meter, { outputDeviceMode: "ascii" }).text, `-12.345m`);
  assert.equal(formatDim(-L.FOOT / 2, Unit.Foot, { outputDeviceMode: "ascii" }).text, `-6"`);
  assert.equal(formatDim(-(L.FOOT / 2 + 37 * L.SIXTY_FOURTH), Unit.Foot, { outputDeviceMode: "ascii" }).text, `-6 37/64"`);
  assert.equal(formatDim(-37 * L.SIXTY_FOURTH, Unit.Inch, { outputDeviceMode: "ascii" }).text, `-37/64"`);
});
