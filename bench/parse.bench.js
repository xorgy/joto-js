import { bench, do_not_optimize, group, summary } from "mitata";

import * as length from "@xorgy/joto/parse/length";
import * as mass from "@xorgy/joto/parse/mass";
import * as temperature from "@xorgy/joto/parse/temperature";

import { makeXorshift32, shuffleInPlace } from "./_util.js";

summary(() => {
  group('Parse: "32′11﻿1⁄4″"', () => {
    const S = "32\u203211\uFEFF1\u20444\u2033";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(length.parseDim(s));
        },
      };
    });
  });

  group('Parse: "20m"', () => {
    const S = "20m";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(length.parseDim(s));
        },
      };
    });
  });

  group('Parse: "  34,966\' 11\u202f1⁄4"  "', () => {
    const S = "  34,966' 11\u202f1\u20444\"  ";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(length.parseDim(s));
        },
      };
    });
  });

  group('Parse mass: "5lb 3oz"', () => {
    const S = "5lb 3oz";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(mass.parseDim(s));
        },
      };
    });
  });

  group('Parse mass: "20kg"', () => {
    const S = "20kg";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(mass.parseDim(s));
        },
      };
    });
  });

  group('Parse temperature: "100°C"', () => {
    const S = "100\u00b0C";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(temperature.parseDim(s));
        },
      };
    });
  });

  group('Parse temperature: "273.15K"', () => {
    const S = "273.15K";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(temperature.parseDim(s));
        },
      };
    });
  });

  group('Parse temperature: "-459.67°F"', () => {
    const S = "-459.67\u00b0F";
    bench("parseDim", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(temperature.parseDim(s));
        },
      };
    });
  });

  group('Parse: "176" as Inch', () => {
    const S = "176";
    bench("parseAs", function* () {
      yield {
        [0]() {
          return S;
        },
        bench(s) {
          do_not_optimize(length.parseAs(s, length.Unit.Inch));
        },
      };
    });
  });

  group("Length: 48 strings, 8 degenerates, shuffled per iteration.", () => {
    const EXAMPLES = [
      // Inches
      "3in",
      "12.7in",
      "1/2\"",
      "2ft 3in",
      "1.25in",
      "1\u202f203.5in", // narrow no-break space thousands sep
      // Feet
      "5ft",
      "5'11\"",
      "1.5ft",
      "0.25ft",
      "12\u2032", // prime
      // Yards
      "3yd",
      "2.5yd",
      "0.1yd",
      // Nanometers
      "500nm",
      "0.0005nm",
      "123456789nm",
      // Micrometers
      "10um",
      "1\u00b5m",
      "0.5\u00b5m",
      "0.75\u03bcm", // Greek mu
      // Millimeters
      "3mm",
      "30.5mm",
      "999,999mm",
      // Centimeters
      "25cm",
      "2.54cm",
      "0.1cm",
      // Decimeters
      "45dm",
      "1.5dm",
      // Meters
      "1m",
      "0.002m",
      "4m 3mm",
      // Q
      "0.25Q",
      "12Q",
      // Points
      "12pt",
      "8.5pt",
      // Picas
      "6pc",
      "2.5pc",
      // Iota
      "10io",
      "0.1io",
      // And now for some hideous ones
      "12,345,678.9012m",
      "9223372036854775807nm", // i64::MAX in nm
      "1.0000000000100000000000000000000000000000m",
      "4' 11  7/16\"",
      "1,234,567ft 8.999in",
      // Many U+2008 Punctuation Space thousands separators.
      "999\u2008999\u2008999\u2008999\u2008999\u2008999\u2008999\u2008999\u2008999\u2008999\u2008999.9999mm",
      "1234567890.12345Q",
      "18446744073709551615io",
    ];

    // Copy so we can shuffle in-place each iteration without affecting the literal.
    const examples = EXAMPLES.slice();
    let shuffleCounter = 0;

    bench("parseDim (48x)", function* () {
      yield {
        [0]() {
          shuffleCounter += 1;
          const nextU32 = makeXorshift32(0x6d2b79f5 ^ shuffleCounter);
          shuffleInPlace(examples, nextU32);
          return examples;
        },
        bench(ss) {
          let acc = 0;
          for (let i = 0; i < ss.length; i += 1) {
            const v = length.parseDim(ss[i]);
            if (v != null) acc += v;
          }
          do_not_optimize(acc);
        },
      };
    }).gc("inner");
  });

  group("Mass: 32 strings, shuffled per iteration.", () => {
    const EXAMPLES = [
      "1g",
      "1mg",
      "1ug",
      "1\u00b5g",
      "1\u03bcg",
      "1kg",
      "1t",
      "0.5kg",
      "0.001oz",
      "1oz",
      "5lb",
      "5lb 3oz",
      "12oz",
      "0.1ozt",
      "1ozt",
      "5dr",
      "12dwt",
      "2gr",
      "1,000g",
      // Many U+2008 Punctuation Space thousands separators.
      "999\u2008999\u2008999g",
      "12,345,678.901234kg",
      "18446744073709551615wt",
      "0.01ug",
      "0.00001mg",
      "1.000oz",
      "1.0000kg",
      "9223372036854775807ug",
      "1kg 1oz", // invalid compound, should yield null
      "3.141592653589793t",
      "100cwt",
      "1cwt.l",
      "1tn.l",
    ];

    const examples = EXAMPLES.slice();
    let shuffleCounter = 0;

    bench("parseDim (32x)", function* () {
      yield {
        [0]() {
          shuffleCounter += 1;
          const nextU32 = makeXorshift32(0x85ebca6b ^ shuffleCounter);
          shuffleInPlace(examples, nextU32);
          return examples;
        },
        bench(ss) {
          let acc = 0;
          for (let i = 0; i < ss.length; i += 1) {
            const v = mass.parseDim(ss[i]);
            if (v != null) acc += v;
          }
          do_not_optimize(acc);
        },
      };
    }).gc("inner");
  });

  group("Temperature: 32 strings, shuffled per iteration.", () => {
    const EXAMPLES = [
      "0K",
      "273.15K",
      "300K",
      "0\u00b0C",
      "25\u00b0C",
      "-10\u00b0C",
      "32\u00b0F",
      "212\u00b0F",
      "459.67\u00b0R",
      "491.67\u00b0R",
      "0R",
      "1mK",
      "0.1mK",
      ".0001K",
      ".0001\u00b0C",
      ".0001\u00b0F",
      "1mR",
      ".1mR",
      ".0001R",
      "1,000K",
      "999\u2008999mK",
      "23\u2008860K",
      "23,860K",
      "100sd",
      "1smidge",
      "+10K",
      "\u221210\u00b0F",
      "0.0000K",
      "0.0000\u00b0C",
      // Should yield null (unsigned types in Rust; also out-of-range/invalid for JS safe-int).
      "-1K",
      "-9999999999999999999999999999999999999K",
      // Too precise.
      "0.00001K",
    ];

    const examples = EXAMPLES.slice();
    let shuffleCounter = 0;

    bench("parseDim (32x)", function* () {
      yield {
        [0]() {
          shuffleCounter += 1;
          const nextU32 = makeXorshift32(0xc2b2ae35 ^ shuffleCounter);
          shuffleInPlace(examples, nextU32);
          return examples;
        },
        bench(ss) {
          let acc = 0;
          for (let i = 0; i < ss.length; i += 1) {
            const v = temperature.parseDim(ss[i]);
            if (v != null) acc += v;
          }
          do_not_optimize(acc);
        },
      };
    }).gc("inner");
  });
});
