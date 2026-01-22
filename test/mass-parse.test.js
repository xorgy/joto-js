import test from "node:test";
import assert from "node:assert/strict";

import * as M from "@xorgy/joto/constants/mass";
import { parseDim, parseDimDiagnostic, parseAs, Unit } from "@xorgy/joto/parse/mass";

test("mass.parse: invertibility sanity", () => {
  const v = parseDim("2kg") + parseDim("3oz") - parseDim("2000g") - parseDim("3.000oz");
  assert.equal(v, 0);
});

test("mass.parse: basic + compound", () => {
  assert.equal(parseDim("37g"), 37 * M.GRAM);
  assert.equal(parseDim("11oz"), 11 * M.OUNCE);
  assert.equal(parseDim("9wt"), 9 * M.WHIT);

  assert.equal(parseDim("5lb3oz"), 5 * M.POUND + 3 * M.OUNCE);
  assert.equal(parseDim("5lb 3oz"), 5 * M.POUND + 3 * M.OUNCE);
  assert.equal(parseDim(`  5lb\u202F3oz  `), 5 * M.POUND + 3 * M.OUNCE);
});

test("mass.parse: SI micro variants", () => {
  assert.equal(parseDim("1ug"), M.MICROGRAM);
  assert.equal(parseDim("1\u00b5g"), M.MICROGRAM);
  assert.equal(parseDim("1\u03bcg"), M.MICROGRAM);
});

test("mass.parse: decimals accepted/rejected", () => {
  assert.equal(parseDim(".0mg"), 0);
  assert.equal(parseDim(".00001mg"), 32 * M.WHIT);
  assert.equal(parseDim(".000001mg"), null);
  assert.equal(parseDim(".00000mg"), 0);

  assert.equal(parseDim(".0ug"), 0);
  assert.equal(parseDim(".01ug"), M.MICROGRAM / 100);
  assert.equal(parseDim(".001ug"), null);
  assert.equal(parseDim(".00ug"), 0);

  assert.equal(parseDim(".0oz"), 0);
  assert.equal(parseDim(".001oz"), M.OUNCE / 1000);
  assert.equal(parseDim(".0001oz"), null);

  assert.equal(parseDim(".0ozt"), 0);
  assert.equal(parseDim(".1ozt"), M.TROY_OUNCE / 10);
  assert.equal(parseDim(".01ozt"), null);

  assert.equal(parseDim(".1wt"), null);
  assert.equal(parseDim(".1dr"), null);
});

test("mass.parse: grouping separators", () => {
  assert.equal(parseDim("1,000g"), 1_000 * M.GRAM);
  assert.equal(parseDim(`1\u2008000g`), 1_000 * M.GRAM);
});

test("mass.parse: diagnostics shape", () => {
  const r = parseDimDiagnostic("1.0001oz");
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "TooPrecise");
});

test("mass.parse: parse_as", () => {
  assert.equal(parseAs("(unrelated) 1 ", Unit.Gram), M.GRAM);
  assert.equal(parseAs("foo37", Unit.Kilogram), 37 * M.KILOGRAM);
});
