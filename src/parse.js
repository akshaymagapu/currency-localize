export function parseLocalizedNumber(input, locale = "en-US", options = {}) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Input is empty");

  const { group, decimal, digitsMap, grouping } = getLocaleSymbols(locale);
  const strict = Boolean(options.strict);

  let value = raw
    .replace(/[−]/g, "-")
    .replace(/\u00A0/g, " ");

  const parenthesized = /^\(.*\)$/.test(value);
  if (parenthesized) {
    value = value.slice(1, -1);
  }

  value = translateLocalizedDigits(value, digitsMap);

  if (strict) {
    if (!isStrictLocalizedNumeric(value, { group, decimal, grouping })) {
      throw new Error(`Could not parse money value: ${input}`);
    }
  } else {
    value = value.replace(/[^0-9+\-.,'\s]/g, "");
  }

  value = value
    .replace(/\s+/g, "")
    .replace(new RegExp(escapeRegExp(group), "g"), "")
    .replace(/'/g, "")
    .replace(new RegExp(escapeRegExp(decimal), "g"), ".");

  if (parenthesized && !value.startsWith("-")) {
    value = `-${value}`;
  }

  if (!/^[+-]?\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Could not parse money value: ${input}`);
  }

  return value;
}

function getLocaleSymbols(locale) {
  const sample = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = normalizeSpace(sample.find((part) => part.type === "group")?.value || ",");
  const decimal = normalizeSpace(sample.find((part) => part.type === "decimal")?.value || ".");
  const grouping = inferGrouping(locale);

  const digitsMap = new Map();
  for (let i = 0; i <= 9; i += 1) {
    const localized = new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumFractionDigits: 0
    }).formatToParts(i).find((part) => part.type === "integer")?.value;
    if (localized) {
      digitsMap.set(localized, String(i));
    }
  }

  return { group, decimal, digitsMap, grouping };
}

function translateLocalizedDigits(value, digitsMap) {
  let out = "";
  for (const ch of value) {
    out += digitsMap.get(ch) ?? ch;
  }
  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSpace(value) {
  return String(value).replace(/\u00A0/g, " ");
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

function isStrictLocalizedNumeric(raw, symbols) {
  const { group, decimal, grouping } = symbols;
  const signCount = (raw.match(/[+-]/g) || []).length;
  if (signCount > 1) return false;
  if (/[+-]/.test(raw.slice(1))) return false;

  const unsigned = raw.replace(/^[+-]/, "");
  const decimalParts = unsigned.split(decimal);
  if (decimalParts.length > 2) return false;

  const [intPart, fracPart] = decimalParts;
  if (!intPart) return false;
  const allowedInt = new RegExp(`^[0-9${escapeRegExp(group)}]+$`);
  if (!allowedInt.test(intPart)) return false;
  if (fracPart !== undefined && !/^[0-9]+$/.test(fracPart)) return false;

  return isValidGrouping(intPart, group, grouping);
}

function isValidGrouping(intPart, group, grouping) {
  const chunks = intPart.split(group);
  if (chunks.some((c) => c.length === 0 || !/^\d+$/.test(c))) return false;
  if (chunks.length === 1) return true;

  const { primary, secondary } = grouping;
  if (!primary || !secondary) return false;

  const last = chunks[chunks.length - 1];
  if (last.length !== primary) return false;

  for (let i = chunks.length - 2; i > 0; i -= 1) {
    if (chunks[i].length !== secondary) return false;
  }

  return chunks[0].length >= 1 && chunks[0].length <= secondary;
}
