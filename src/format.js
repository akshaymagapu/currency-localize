function localizeDigits(asciiNumber, digitsMap) {
  let out = "";
  for (const ch of asciiNumber) {
    out += digitsMap[ch] ?? ch;
  }
  return out;
}

function inferGrouping(locale) {
  const parts = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0
  }).formatToParts(1234567890123);

  const segments = parts.filter((p) => p.type === "integer").map((p) => p.value.length);
  if (segments.length <= 1) {
    return { primary: 0, secondary: 0 };
  }

  const primary = segments[segments.length - 1];
  const secondary = segments[segments.length - 2] || primary;
  return { primary, secondary };
}

function applyGrouping(integerDigits, groupSymbol, grouping) {
  const { primary, secondary } = grouping;
  if (!primary || integerDigits.length <= primary) return integerDigits;

  const chunks = [];
  let index = integerDigits.length;

  chunks.unshift(integerDigits.slice(index - primary, index));
  index -= primary;

  while (index > 0) {
    const size = secondary || primary;
    const start = Math.max(0, index - size);
    chunks.unshift(integerDigits.slice(start, index));
    index = start;
  }

  return chunks.join(groupSymbol);
}

function extractAffixes(parts) {
  const numeric = new Set(["integer", "group", "decimal", "fraction"]);
  let first = -1;
  let last = -1;

  for (let i = 0; i < parts.length; i += 1) {
    if (numeric.has(parts[i].type)) {
      if (first === -1) first = i;
      last = i;
    }
  }

  if (first === -1) {
    return { prefix: parts.map((p) => p.value).join(""), suffix: "" };
  }

  return {
    prefix: parts.slice(0, first).map((p) => p.value).join(""),
    suffix: parts.slice(last + 1).map((p) => p.value).join("")
  };
}

export function formatMinorAsCurrency(minorAmount, { locale, currency, scale }) {
  const absMinor = minorAmount < 0n ? -minorAmount : minorAmount;

  const intDivisor = 10n ** BigInt(scale);
  const integer = absMinor / intDivisor;
  const fraction = absMinor % intDivisor;

  const fmtOpts = {
    style: "currency",
    currency,
    minimumFractionDigits: scale,
    maximumFractionDigits: scale
  };

  const positiveParts = new Intl.NumberFormat(locale, fmtOpts).formatToParts(1234567.89);
  const negativeParts = new Intl.NumberFormat(locale, fmtOpts).formatToParts(-1234567.89);

  const positiveAffix = extractAffixes(positiveParts);
  const negativeAffix = extractAffixes(negativeParts);

  const groupSymbol = positiveParts.find((p) => p.type === "group")?.value || ",";
  const decimalSymbol = positiveParts.find((p) => p.type === "decimal")?.value || ".";

  const digitsMap = {};
  for (let i = 0; i <= 9; i += 1) {
    const localized = new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumFractionDigits: 0
    }).formatToParts(i).find((p) => p.type === "integer")?.value;
    digitsMap[String(i)] = localized || String(i);
  }

  const grouping = inferGrouping(locale);
  const integerAscii = integer.toString();
  const fractionAscii = scale > 0 ? fraction.toString().padStart(scale, "0") : "";

  const groupedInteger = applyGrouping(integerAscii, groupSymbol, grouping);
  const localizedInteger = localizeDigits(groupedInteger, digitsMap);
  const localizedFraction = localizeDigits(fractionAscii, digitsMap);

  const numberCore = scale > 0
    ? `${localizedInteger}${decimalSymbol}${localizedFraction}`
    : localizedInteger;

  const affix = minorAmount < 0n ? negativeAffix : positiveAffix;
  return `${affix.prefix}${numberCore}${affix.suffix}`;
}
