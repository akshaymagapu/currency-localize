export function parseLocalizedNumber(input, locale = "en-US", options = {}) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Input is empty");

  const { group, decimal, digitsMap } = getLocaleSymbols(locale);
  const strict = Boolean(options.strict);

  let value = raw
    .replace(/[−]/g, "-")
    .replace(/\u00A0/g, " ");

  const parenthesized = /^\(.*\)$/.test(value);
  if (parenthesized) {
    value = value.slice(1, -1);
  }

  value = translateLocalizedDigits(value, digitsMap);

  if (!strict) {
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
  const group = sample.find((part) => part.type === "group")?.value || ",";
  const decimal = sample.find((part) => part.type === "decimal")?.value || ".";

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

  return { group, decimal, digitsMap };
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
