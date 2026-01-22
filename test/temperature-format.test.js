import test from "node:test";
import assert from "node:assert/strict";

import * as T from "@xorgy/joto/constants/temperature";
import { formatDim, Unit } from "@xorgy/joto/format/temperature";

test("temperature.format: basic", () => {
  const o1 = formatDim(373 * T.KELVIN + 150 * T.MILLIKELVIN, Unit.Kelvin);
  assert.deepEqual(o1, { text: "373.15K", exact: true });

  const o2 = formatDim(T.ZERO_CELSIUS + 100 * T.KELVIN, Unit.Celsius);
  assert.deepEqual(o2, { text: "100\u00b0C", exact: true });

  const o3 = formatDim(T.ZERO_FAHRENHEIT + 32 * T.RANKINE, Unit.Fahrenheit);
  assert.deepEqual(o3, { text: "32\u00b0F", exact: true });
});

test("temperature.format: negative relative outputs", () => {
  const o1 = formatDim(0, Unit.Celsius);
  assert.deepEqual(o1, { text: "\u2212273.15\u00b0C", exact: true });

  const o2 = formatDim(0, Unit.Fahrenheit);
  assert.deepEqual(o2, { text: "\u2212459.67\u00b0F", exact: true });
});

test("temperature.format: thousand separators + ascii", () => {
  const o = formatDim(T.ZERO_CELSIUS + 12_345 * T.KELVIN, Unit.Celsius, { thousandsSeparator: "," });
  assert.equal(o.text, "12,345\u00b0C");

  const oAscii = formatDim(T.ZERO_CELSIUS, Unit.Celsius, { outputDeviceMode: "ascii" });
  assert.equal(oAscii.text, "0C");
});

test("temperature.format: limiting decimal places", () => {
  const o1 = formatDim(T.KELVIN / 10_000, Unit.Kelvin);
  assert.deepEqual(o1, { text: "0.0001K", exact: true });

  const o2 = formatDim(T.KELVIN / 10_000, Unit.Kelvin, { maxDecimalFractionDigits: 1 });
  assert.deepEqual(o2, { text: "0K", exact: false });

  const o3 = formatDim(T.KELVIN / 10, Unit.Kelvin, { maxDecimalFractionDigits: 1 });
  assert.deepEqual(o3, { text: "0.1K", exact: true });
});
