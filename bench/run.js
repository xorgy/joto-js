import { run } from "mitata";

import "./parse.bench.js";
import "./format.bench.js";

const filter = process.env.MITATA_FILTER ? new RegExp(process.env.MITATA_FILTER, "u") : undefined;
const format = process.env.MITATA_FORMAT || undefined;

await run({
  filter,
  format,
});

