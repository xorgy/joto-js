export function makeXorshift32(seed) {
  let s = seed >>> 0;
  return function nextU32() {
    s ^= (s << 13) >>> 0;
    s ^= s >>> 17;
    s ^= (s << 5) >>> 0;
    return s >>> 0;
  };
}

export function shuffleInPlace(array, nextU32) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = nextU32() % (i + 1);
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}

