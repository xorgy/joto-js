import test from "node:test";
import assert from "node:assert/strict";

import * as T from "@xorgy/joto/constants/temperature";
import { parseDim, parseDimDiagnostic, parseAs, Unit } from "@xorgy/joto/parse/temperature";

test("temperature.parse: invertibility sanity", () => {
  assert.equal(parseDim("100\u00b0C") - parseDim("373.15K"), 0);
  assert.equal(parseDim("32\u00b0F") - parseDim("0\u00b0C"), 0);
});

test("temperature.parse: basic", () => {
  assert.equal(parseDim("0K"), 0);
  assert.equal(parseDim("0\u00b0C"), T.ZERO_CELSIUS);
  assert.equal(parseDim("0\u00b0F"), T.ZERO_FAHRENHEIT);
  assert.equal(parseDim("459.67\u00b0R"), T.ZERO_FAHRENHEIT);
});

test("temperature.parse: decimals accepted/rejected", () => {
  assert.equal(parseDim(".0K"), 0);
  assert.equal(parseDim(".0001K"), 9 * T.SMIDGE);
  assert.equal(parseDim(".00001K"), null);

  assert.equal(parseDim(".0mK"), 0);
  assert.equal(parseDim(".1mK"), 9 * T.SMIDGE);
  assert.equal(parseDim(".01mK"), null);

  assert.equal(parseDim(".0\u00b0R"), 0);
  assert.equal(parseDim(".0001\u00b0R"), 5 * T.SMIDGE);
  assert.equal(parseDim(".00001\u00b0R"), null);
});

test("temperature.parse: grouping separators", () => {
  assert.equal(parseDim("1,000K"), 1_000 * T.KELVIN);
  assert.equal(parseDim(`1\u2008000mK`), 1_000 * T.MILLIKELVIN);
  assert.equal(parseDim(`1\u2008000\u00b0R`), 1_000 * T.RANKINE);
});

test("temperature.parse: sign", () => {
  assert.equal(parseDim("-10\u00b0C"), T.ZERO_CELSIUS - 10 * T.KELVIN);
  assert.equal(parseDim("\u221210\u00b0F"), T.ZERO_FAHRENHEIT - 10 * T.RANKINE);
  assert.equal(parseDim("+10\u00b0C"), T.ZERO_CELSIUS + 10 * T.KELVIN);
  assert.equal(parseDim("+10K"), null);
});

test("temperature.parse: diagnostics shape", () => {
  const r = parseDimDiagnostic("-1K");
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "InvalidSign");
});

test("temperature.parse: parse_as", () => {
  assert.equal(parseAs("(unrelated) 1 ", Unit.Smidge), T.SMIDGE);
  assert.equal(parseAs(".0001", Unit.Kelvin), 9 * T.SMIDGE);
  assert.equal(parseAs("   ", Unit.Kelvin), null);
  assert.equal(parseAs("foo37", Unit.Kelvin), 37 * T.KELVIN);
});
