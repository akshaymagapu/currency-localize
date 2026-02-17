import Big from "big.js";

const RM = {
  trunc: 0,
  halfExpand: 1,
  halfEven: 2
};

export function roundDecimalStringToMinor(decimal, scale, mode = "halfExpand") {
  if (scale < 0) throw new Error("scale must be >= 0");

  let scaled;
  try {
    const value = new Big(String(decimal).trim());
    scaled = value.times(new Big(10).pow(scale));
  } catch {
    throw new Error(`Invalid decimal amount: ${decimal}`);
  }

  const rounded = roundBigToInt(scaled, mode);
  return BigInt(rounded.toFixed(0));
}

function roundBigToInt(value, mode) {
  if (mode === "ceil") {
    const trunc = value.round(0, 0);
    if (value.eq(trunc)) return trunc;
    return value.gt(trunc) ? trunc.plus(1) : trunc;
  }

  if (mode === "floor") {
    const trunc = value.round(0, 0);
    if (value.eq(trunc)) return trunc;
    return value.lt(trunc) ? trunc.minus(1) : trunc;
  }

  if (!(mode in RM)) {
    throw new Error(`Unsupported rounding mode: ${mode}`);
  }

  return value.round(0, RM[mode]);
}
