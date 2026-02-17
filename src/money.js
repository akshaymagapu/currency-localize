import { getMinorUnit } from "./currencyMeta.js";
import { formatMinorAsCurrency } from "./format.js";
import { parseLocalizedNumber } from "./parse.js";
import { roundDecimalStringToMinor } from "./rounding.js";
import Big from "big.js";

function pow10(n) {
  return 10n ** BigInt(n);
}

export class Money {
  constructor(minorAmount, currency, options = {}) {
    if (typeof minorAmount !== "bigint") {
      throw new Error("minorAmount must be a bigint");
    }

    const code = String(currency || "").toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      throw new Error("currency must be a valid ISO-4217 code");
    }

    this.minor = minorAmount;
    this.currency = code;
    this.scale = options.scale ?? getMinorUnit(code);
    this.locale = options.locale;
    this.trace = freezeTrace(options.trace ?? []);

    Object.freeze(this);
  }

  static fromMajor(amount, options) {
    const { currency, scale = getMinorUnit(currency), roundingMode = "halfExpand" } = options || {};
    if (!currency) throw new Error("currency is required");

    const value = typeof amount === "string" ? amount : String(amount);
    const minor = roundDecimalStringToMinor(value, scale, roundingMode);

    return new Money(minor, currency, {
      scale,
      locale: options?.locale,
      trace: [
        {
          op: "fromMajor",
          amount: String(amount),
          roundingMode
        }
      ]
    });
  }

  static fromMinor(minor, options) {
    const { currency, scale = getMinorUnit(currency), locale } = options || {};
    if (!currency) throw new Error("currency is required");
    return new Money(BigInt(minor), currency, {
      scale,
      locale,
      trace: [
        {
          op: "fromMinor",
          amount: String(minor)
        }
      ]
    });
  }

  static parse(input, options) {
    const { locale = "en-US", strict = false, ...rest } = options || {};
    const normalized = parseLocalizedNumber(input, locale, { strict });
    const out = Money.fromMajor(normalized, { ...rest, locale });
    return out.withTrace({
      op: "parse",
      input: String(input),
      strict
    });
  }

  add(other) {
    assertSameCurrency(this, other);
    return new Money(this.minor + other.minor, this.currency, {
      scale: this.scale,
      locale: this.locale,
      trace: appendTrace(this, {
        op: "add",
        rhsMinor: other.minor.toString()
      })
    });
  }

  subtract(other) {
    assertSameCurrency(this, other);
    return new Money(this.minor - other.minor, this.currency, {
      scale: this.scale,
      locale: this.locale,
      trace: appendTrace(this, {
        op: "subtract",
        rhsMinor: other.minor.toString()
      })
    });
  }

  multiply(factor, options = {}) {
    const scale = options.scale ?? this.scale;
    const roundingMode = options.roundingMode ?? "halfExpand";

    const decimal = this.toDecimalString();
    const product = new Big(decimal).times(String(factor)).toString();
    const minor = roundDecimalStringToMinor(product, scale, roundingMode);
    return new Money(minor, this.currency, {
      scale,
      locale: this.locale,
      trace: appendTrace(this, {
        op: "multiply",
        factor: String(factor),
        roundingMode
      })
    });
  }

  allocate(ratios) {
    if (!Array.isArray(ratios) || ratios.length === 0) {
      throw new Error("ratios must be a non-empty array");
    }

    const normalized = ratios.map((value) => {
      const asBigInt = BigInt(value);
      if (asBigInt <= 0n) {
        throw new Error("Each ratio must be > 0");
      }
      return asBigInt;
    });

    const total = normalized.reduce((sum, value) => sum + value, 0n);
    if (total <= 0n) throw new Error("ratios sum must be > 0");

    const shares = normalized.map((value) => (this.minor * value) / total);
    let remainder = this.minor - shares.reduce((sum, share) => sum + share, 0n);

    for (let i = 0; remainder > 0n; i = (i + 1) % shares.length) {
      shares[i] += 1n;
      remainder -= 1n;
    }

    for (let i = 0; remainder < 0n; i = (i + 1) % shares.length) {
      shares[i] -= 1n;
      remainder += 1n;
    }

    return shares.map((minor, index) => new Money(minor, this.currency, {
      scale: this.scale,
      locale: this.locale,
      trace: appendTrace(this, {
        op: "allocate",
        ratios: normalized.map(String),
        shareIndex: String(index)
      })
    }));
  }

  equals(other) {
    return other instanceof Money && this.currency === other.currency && this.minor === other.minor;
  }

  toDecimalString() {
    const base = pow10(this.scale);
    const abs = this.minor < 0n ? -this.minor : this.minor;
    const intPart = abs / base;
    const fracPart = abs % base;

    const frac = this.scale === 0 ? "" : `.${fracPart.toString().padStart(this.scale, "0")}`;
    return `${this.minor < 0n ? "-" : ""}${intPart.toString()}${frac}`;
  }

  format(options = {}) {
    const locale = options.locale || this.locale || "en-US";
    return formatMinorAsCurrency(this.minor, {
      locale,
      currency: this.currency,
      scale: this.scale
    });
  }

  toJSON() {
    return {
      amount: this.toDecimalString(),
      minor: this.minor.toString(),
      currency: this.currency,
      scale: this.scale,
      trace: this.trace
    };
  }

  toDeterministicString() {
    return canonicalJSONStringify(this.toJSON());
  }

  withTrace(metadata) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new Error("metadata must be an object");
    }
    return new Money(this.minor, this.currency, {
      scale: this.scale,
      locale: this.locale,
      trace: appendTrace(this, metadata)
    });
  }
}

function assertSameCurrency(left, right) {
  if (!(right instanceof Money)) {
    throw new Error("Expected a Money instance");
  }
  if (left.currency !== right.currency || left.scale !== right.scale) {
    throw new Error("Currency mismatch");
  }
}

function appendTrace(money, step) {
  return [...money.trace, normalizeTraceStep(step)];
}

function freezeTrace(trace) {
  if (!Array.isArray(trace)) throw new Error("trace must be an array");
  const normalized = trace.map(normalizeTraceStep);
  return Object.freeze(normalized);
}

function normalizeTraceStep(step) {
  const out = {};
  for (const key of Object.keys(step).sort()) {
    const value = step[key];
    if (Array.isArray(value)) {
      out[key] = value.map((item) => String(item));
      continue;
    }
    if (value === null || value === undefined) {
      out[key] = value;
      continue;
    }
    if (typeof value === "object") {
      out[key] = canonicalizeObject(value);
      continue;
    }
    out[key] = String(value);
  }
  return Object.freeze(out);
}

function canonicalizeObject(obj) {
  const out = {};
  for (const key of Object.keys(obj).sort()) {
    const value = obj[key];
    if (Array.isArray(value)) {
      out[key] = value.map((item) => String(item));
    } else if (value && typeof value === "object") {
      out[key] = canonicalizeObject(value);
    } else {
      out[key] = value === undefined ? undefined : String(value);
    }
  }
  return out;
}

function canonicalJSONStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return value;
}
