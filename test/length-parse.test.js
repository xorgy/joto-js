import test from "node:test";
import assert from "node:assert/strict";

import * as L from "@xorgy/joto/constants/length";
import { parseDim, parseDimDiagnostic, parseAs, Unit } from "@xorgy/joto/parse/length";

test("length.parse: invertibility sanity", () => {
  const v =
    parseDim("2.5cm") +
    parseDim("1\u204464in") +
    parseDim("1\u20442 in") -
    parseDim("37,700\u00b5m") -
    parseDim('1/64"');
  assert.equal(v, 0);
});

test("length.parse: basic", () => {
  assert.equal(parseDim("37'"), 37 * L.FOOT);
  assert.equal(parseDim('11"'), 11 * L.INCH);
});

test("length.parse: compound", () => {
  assert.equal(parseDim('37\'11"'), 37 * L.FOOT + 11 * L.INCH);
  assert.equal(parseDim("37'11\u202f1\u20444\""), 37 * L.FOOT + 11 * L.INCH + 1 * L.QUARTER);
});

test("length.parse: inch decimals", () => {
  assert.equal(parseDim('.00001"'), L.HUNDRED_THOUSANDTH);
  assert.equal(
    parseDim("37'11.00039\""),
    37 * L.FOOT + 11 * L.INCH + 39 * L.HUNDRED_THOUSANDTH,
  );
  assert.equal(parseDim("37'11.1\""), 37 * L.FOOT + 11 * L.INCH + L.INCH / 10);
});

test("length.parse: SI whole", () => {
  assert.equal(parseDim("1nm"), L.NANOMETER);
  assert.equal(parseDim("1um"), L.MICROMETER);
  assert.equal(parseDim("1\u00b5m"), L.MICROMETER);
  assert.equal(parseDim("1Q"), L.MILLIMETER / 4);
  assert.equal(parseDim("1mm"), L.MILLIMETER);
  assert.equal(parseDim("1cm"), L.CENTIMETER);
  assert.equal(parseDim("1dm"), L.DECIMETER);
  assert.equal(parseDim("1m"), L.METER);
});

test("length.parse: SI decimals accepted/rejected", () => {
  assert.equal(parseDim(".0nm"), 0);
  assert.equal(parseDim(".1nm"), null);
  assert.equal(parseDim(".000nm"), 0);
  assert.equal(parseDim(".0001nm"), null);

  assert.equal(parseDim(".0um"), 0);
  assert.equal(parseDim(".001um"), L.NANOMETER);
  assert.equal(parseDim(".0001um"), null);
  assert.equal(parseDim(".0000um"), 0);

  assert.equal(parseDim(".0\u00b5m"), 0);
  assert.equal(parseDim(".001\u00b5m"), L.NANOMETER);
  assert.equal(parseDim(".0001\u00b5m"), null);
  assert.equal(parseDim(".0000\u00b5m"), 0);

  assert.equal(parseDim(".0\u03bcm"), 0);
  assert.equal(parseDim(".001\u03bcm"), L.NANOMETER);
  assert.equal(parseDim(".0001\u03bcm"), null);
  assert.equal(parseDim(".0000\u03bcm"), 0);

  assert.equal(parseDim(".0Q"), 0);
  assert.equal(parseDim(".0001Q"), 25 * L.NANOMETER);
  assert.equal(parseDim(".000004Q"), null);
  assert.equal(parseDim(".0000000Q"), 0);

  assert.equal(parseDim(".0mm"), 0);
  assert.equal(parseDim(".000001mm"), L.NANOMETER);
  assert.equal(parseDim(".0000001mm"), null);
  assert.equal(parseDim(".0000000mm"), 0);

  assert.equal(parseDim(".0cm"), 0);
  assert.equal(parseDim(".0000001cm"), L.NANOMETER);
  assert.equal(parseDim(".00000001cm"), null);
  assert.equal(parseDim(".0000000cm"), 0);

  assert.equal(parseDim(".0dm"), 0);
  assert.equal(parseDim(".00000001dm"), L.NANOMETER);
  assert.equal(parseDim(".000000001dm"), null);
  assert.equal(parseDim(".00000000dm"), 0);

  assert.equal(parseDim(".0m"), 0);
  assert.equal(parseDim(".000000001m"), L.NANOMETER);
  assert.equal(parseDim(".0000000001m"), null);
  assert.equal(parseDim(".000000000m"), 0);
});

test("length.parse: assorted whitespace + grouping separators", () => {
  assert.equal(
    parseDim(`320,333\u00a0\uFEFF\u2009\u200A\u202f\u2033`),
    320_333 * L.INCH,
  );
  assert.equal(
    parseDim(`\u2005\uFEFF17\u204432\u2000\u2033\u2001\u2002\u2003\u2004`),
    34 * L.SIXTY_FOURTH,
  );
  assert.equal(
    parseDim(`\u2006\uFEFF3\u20448\u2007\u2033\u2008\u2009\u200A\u200B`),
    24 * L.SIXTY_FOURTH,
  );

  assert.equal(parseDim(`67\u2008000,000\u2008000\u202fio`), 67_000_000_000);
});

test("length.parse: parse_as", () => {
  assert.equal(parseAs("(unrelated) 1 ", Unit.Iota), L.IOTA);
  assert.equal(parseAs(".000000001", Unit.Meter), L.NANOMETER);
  assert.equal(parseAs(".001", Unit.Micrometer), L.NANOMETER);
  assert.equal(parseAs("3/8", Unit.Inch), 3 * L.EIGHTH);
  assert.equal(parseAs("   ", Unit.Millimeter), null);
  assert.equal(parseAs(".0001", Unit.Micrometer), null);
  assert.equal(parseAs("foo37", Unit.Centimeter), 37 * L.CENTIMETER);
});

test("length.parse: diagnostics shape", () => {
  const r = parseDimDiagnostic("1.0000001mm");
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "TooPrecise");
});
