<div align=center>

# Joto

[![ISC/MIT/Apache 2.0](https://img.shields.io/badge/license-ISC%2FMIT%2FApache-blue.svg)](#license)
[![Build status](https://github.com/xorgy/joto-js/workflows/CI/badge.svg)](https://github.com/xorgy/joto-js/actions)
[![npm version](https://img.shields.io/npm/v/%40xorgy%2Fjoto.svg)](https://www.npmjs.com/package/@xorgy/joto)

</div>

## Operating principle

In this workspace we set out to interoperate US Customary and SI units of length/displacement, mass, and temperature, while preserving invertibility, avoiding uncontrolled precision loss, and replacing structured unit types ― which are tricky to store or compute efficiently ― with plain integers.

This is accomplished by defining common base units for length, mass, and temperature, which can be used to express [US customary units](<https://en.wikipedia.org/wiki/United_States_customary_units>) and [SI units](<https://en.wikipedia.org/wiki/International_System_of_Units>) in the same scale for each domain.

### Length/displacement

For length, there is the *iota*, defined as 1⁄9 nm.

This allows common fractions of an inch (ten-thousandths, desktop publishing points, and sixty-fourths) and multiples of the nanometer to be represented as natural numbers.

### Mass

For mass, there is the *whit*, defined as 1⁄3200 µg.

The whit is chosen to express practically measurable weights (down to the 0.1 µg range) as well as all common fractional denominations of the international pound (ounces, dram, thousandths of an ounce, grains) and units related to the pound by grains (such as the troy ounce).

### Temperature

For temperature, there is the *smidge*, defined as 1⁄90 mK.

The smidge represents temperatures down to the 100 µK/0.0001 °R range, which is sufficient for almost all practical thermometry. This also allows you to exactly represent temperatures used in industrial metrology standards such as [ITS-90](<https://en.wikipedia.org/wiki/International_Temperature_Scale_of_1990>) for fixed points and common derived constants, and allows exact interchange between common absolute (Kelvin/[Rankine](<https://en.wikipedia.org/wiki/Rankine_scale>)) and relative (Celsius/Fahrenheit) temperature scales.

## Install

```sh
npm i @xorgy/joto
# or
yarn add @xorgy/joto
```

## Usage

### Length

```js
import { METER } from "@xorgy/joto/constants/length";
import { parseDim } from "@xorgy/joto/parse/length";
import { formatDim, Unit } from "@xorgy/joto/format/length";

const q = parseDim("2.5cm"); // iota
console.log(q === 0.025 * METER); // true

const out = formatDim(q, Unit.Meter);
console.log(out.text, out.exact); // "0.025m", true
```

### Mass

```js
import { KILOGRAM, OUNCE, POUND } from "@xorgy/joto/constants/mass";
import { parseDim } from "@xorgy/joto/parse/mass";
import { formatDim, Unit } from "@xorgy/joto/format/mass";

const q = parseDim("5lb 3oz"); // whit
console.log(q === 5 * POUND + 3 * OUNCE); // true

console.log(formatDim(2 * KILOGRAM, Unit.Kilogram).text); // "2kg"
```

### Temperature

```js
import { KELVIN, ZERO_CELSIUS } from "@xorgy/joto/constants/temperature";
import { parseDim } from "@xorgy/joto/parse/temperature";
import { formatDim, Unit } from "@xorgy/joto/format/temperature";

// Values are absolute temperatures in smidge.
const boiling = parseDim("373.15K");
console.log(boiling === ZERO_CELSIUS + 100 * KELVIN); // true

console.log(formatDim(boiling, Unit.Celsius).text); // "100°C"
```

## API overview

Subpath imports are supported:

- `@xorgy/joto/constants/length`, `@xorgy/joto/constants/mass`, `@xorgy/joto/constants/temperature`
- `@xorgy/joto/parse/length`, `@xorgy/joto/parse/mass`, `@xorgy/joto/parse/temperature`
- `@xorgy/joto/format/length`, `@xorgy/joto/format/mass`, `@xorgy/joto/format/temperature`

Parsing:

- `parseDim(s)` → `number | null`
- `parseDimDiagnostic(s)` → `{ ok: true, value } | { ok: false, error }`
- `parseAs(s, unit)` / `parseAsDiagnostic(s, unit)` for parsing without a unit suffix

Formatting:

- `formatDim(q, unit, options?)` → `{ text: string, exact: boolean }`
- `defaultFormat()` → default options object

## Error handling

Diagnostic parse errors use JavaScript string indices (UTF-16 code unit indices) via `error.index`.

```js
import { parseDimDiagnostic } from "@xorgy/joto/parse/length";

const r = parseDimDiagnostic("0.1nm");
if (!r.ok) {
  console.log(r.error.code, r.error.index);
}
```

## Safe integer range

This package currently targets safe integers in native JavaScript `number`.

- Parsing returns `null` (or a diagnostic error) when the value cannot be represented as a safe
  integer.
- Formatting throws a `RangeError` if the input quantity is not a safe integer.

## Benchmarks

Benchmarks use Mitata. Make sure to expose gc when running the benchmarks:

```sh
node --expose-gc bench/run.js
```

```sh
bun bench/run.js
```

## License

Licensed under, at your option:

- ISC license ([LICENSE-ISC](LICENSE-ISC))
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

## Contribution

Contributions are welcome by pull request or email.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in
the work by you, as defined in the Apache-2.0 license, shall be licensed as above, without any
additional terms or conditions.
