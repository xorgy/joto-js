export function assertSafeInt(n) {
  if (!Number.isSafeInteger(n)) {
    throw new RangeError("q must be a safe integer");
  }
}

export function formatWhole(n, thousandsSeparator) {
  if (n === 0) return "0";
  let s = String(n);
  if (!thousandsSeparator) return s;
  let out = "";
  for (let i = s.length; i > 0; i -= 3) {
    const start = i - 3 > 0 ? i - 3 : 0;
    const chunk = s.slice(start, i);
    out = out ? chunk + thousandsSeparator + out : chunk;
  }
  return out;
}

export function formatDecimalFraction(rem, lsd, maxPlaces) {
  const quo = Math.trunc(rem / lsd);
  const remainder = rem % lsd;
  if (quo === 0) return { text: "", remainder };

  const numDigits = maxPlaces;
  let q = quo;
  const quoDigits = String(q).length;
  if (quoDigits > numDigits) {
    const scale = 10 ** numDigits;
    const excess = Math.trunc(q / scale);
    q = q % scale;
    if (excess > 0) return { text: "", remainder: remainder + excess * lsd };
  }

  const digits = String(q).padStart(numDigits, "0").replace(/0+$/u, "");
  return { text: "." + digits, remainder };
}
