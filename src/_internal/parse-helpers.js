export function trimEndJotoWhitespaceIndex(s, end = s.length) {
  let i = end;
  while (i > 0) {
    const code = s.charCodeAt(i - 1);
    if (
      code === 0x20 ||
      code === 0xa0 ||
      code === 0xfeff ||
      code === 0x202f ||
      (code >= 0x2000 && code <= 0x200b)
    ) {
      i -= 1;
      continue;
    }
    break;
  }
  return i;
}

export function trimEndJotoWhitespace(s) {
  const end = trimEndJotoWhitespaceIndex(s);
  return end === s.length ? s : s.slice(0, end);
}

export function stripTrailingAsciiDigits(s) {
  let end = s.length;
  while (end > 0) {
    const c = s.charCodeAt(end - 1);
    if (c >= 0x30 && c <= 0x39) {
      end -= 1;
    } else {
      break;
    }
  }
  return /** @type {[rest: string, digits: string]} */ ([s.slice(0, end), s.slice(end)]);
}

export function trimTrailingAsciiZeroes(s) {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 0x30) end -= 1;
  return end === s.length ? s : s.slice(0, end);
}

export function isGroupSeparatorCharCode(c) {
  return c === 0x2c /* , */ || c === 0x2008 /* punctuation space */;
}
