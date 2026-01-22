import { bench, do_not_optimize, group, summary } from "mitata";

import * as length from "@xorgy/joto/format/length";
import * as mass from "@xorgy/joto/format/mass";
import * as temperature from "@xorgy/joto/format/temperature";

import { FOOT, INCH, METER, NANOMETER, SIXTY_FOURTH } from "@xorgy/joto/constants/length";
import { KILOGRAM } from "@xorgy/joto/constants/mass";
import { KELVIN, MILLIKELVIN } from "@xorgy/joto/constants/temperature";

summary(() => {
  group('Format length: "20m"', () => {
    const q = 20 * METER;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = length.formatDim(q, length.Unit.Meter);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format length: "32′11﻿1⁄4″"', () => {
    const q = 32 * FOOT + 11 * INCH + 16 * SIXTY_FOURTH;
    const f = Object.freeze({
      maxDecimalFractionDigits: null,
      thousandsSeparator: null,
      fracType: length.FracType.Whole,
      allowFracFallback: true,
      mixed: true,
      outputDeviceMode: length.OutputDeviceMode.Complex,
    });

    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        [1]() {
          return f;
        },
        bench(q, f) {
          const o = length.formatDim(q, length.Unit.Foot, f);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format mass: "20kg"', () => {
    const q = 20 * KILOGRAM;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = mass.formatDim(q, mass.Unit.Kilogram);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format mass: "1.00000000001kg"', () => {
    const q = KILOGRAM + KILOGRAM / 100_000_000_000;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = mass.formatDim(q, mass.Unit.Kilogram);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format temperature: "273.15K"', () => {
    const q = 273 * KELVIN + 150 * MILLIKELVIN;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = temperature.formatDim(q, temperature.Unit.Kelvin);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format temperature: "-459.67°F"', () => {
    const q = 0;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = temperature.formatDim(q, temperature.Unit.Fahrenheit);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format temperature: "0.0001K"', () => {
    const q = KELVIN / 10_000;
    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        bench(q) {
          const o = temperature.formatDim(q, temperature.Unit.Kelvin);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });

  group('Format length: "12,345.6789012m"', () => {
    // Same shape as the Rust bench ("12,345,678.9012m") but kept within JS safe-int range.
    const q = 12_345 * METER + 678_901_200 * NANOMETER;
    const f = Object.freeze({
      thousandsSeparator: ",",
    });

    bench("formatDim", function* () {
      yield {
        [0]() {
          return q;
        },
        [1]() {
          return f;
        },
        bench(q, f) {
          const o = length.formatDim(q, length.Unit.Meter, f);
          do_not_optimize(o.text);
          do_not_optimize(o.exact);
        },
      };
    }).gc("inner");
  });
});
