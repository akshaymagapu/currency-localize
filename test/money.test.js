import test from "node:test";
import assert from "node:assert/strict";
import { Money, createCurrencyFormatter } from "../src/index.js";

test("resolves currency from country and formats", () => {
  const kit = createCurrencyFormatter();
  const value = kit.money("1234.5", { country: "IN", locale: "en-IN" });
  assert.equal(value.currency, "INR");
  assert.equal(value.format(), "₹1,234.50");
});

test("parses locale number", () => {
  const kit = createCurrencyFormatter();
  const value = kit.parseMoney("1.234,50", {
    locale: "de-DE",
    currency: "EUR"
  });
  assert.equal(value.toDecimalString(), "1234.50");
});

test("money add/subtract immutable", () => {
  const a = Money.fromMajor("10.25", { currency: "USD" });
  const b = Money.fromMajor("3.10", { currency: "USD" });

  const sum = a.add(b);
  const diff = a.subtract(b);

  assert.equal(sum.toDecimalString(), "13.35");
  assert.equal(diff.toDecimalString(), "7.15");
  assert.equal(a.toDecimalString(), "10.25");
});

test("multiply keeps precision", () => {
  const a = Money.fromMajor("0.10", { currency: "USD" });
  const out = a.multiply("3");
  assert.equal(out.toDecimalString(), "0.30");
});

test("halfEven rounding works", () => {
  const even = Money.fromMajor("1.005", {
    currency: "USD",
    scale: 2,
    roundingMode: "halfEven"
  });
  const odd = Money.fromMajor("1.015", {
    currency: "USD",
    scale: 2,
    roundingMode: "halfEven"
  });

  assert.equal(even.toDecimalString(), "1.00");
  assert.equal(odd.toDecimalString(), "1.02");
});

test("allocate distributes remainder", () => {
  const total = Money.fromMajor("10.00", { currency: "USD" });
  const [a, b, c] = total.allocate([1, 1, 1]);

  assert.deepEqual(
    [a.toDecimalString(), b.toDecimalString(), c.toDecimalString()],
    ["3.34", "3.33", "3.33"]
  );
});

test("plugin can extend api", () => {
  const kit = createCurrencyFormatter({
    plugins: [
      (api) => {
        api.asMinorString = (m) => m.minor.toString();
      }
    ]
  });

  const value = kit.money("12", { currency: "USD" });
  assert.equal(kit.asMinorString(value), "1200");
});

test("formats very large values without precision loss", () => {
  const m = Money.fromMajor("9007199254740993.01", { currency: "USD" });
  assert.equal(m.format({ locale: "en-US" }), "$9,007,199,254,740,993.01");
});

test("supports negative accounting-style parse in tolerant mode", () => {
  const kit = createCurrencyFormatter();
  const m = kit.parseMoney("($1,234.50)", { locale: "en-US", currency: "USD" });
  assert.equal(m.toDecimalString(), "-1234.50");
});

test("strict parse rejects currency symbols", () => {
  const kit = createCurrencyFormatter();
  assert.throws(() => kit.parseMoney("$1,234.50", {
    locale: "en-US",
    currency: "USD",
    strictParse: true
  }));
});

test("strict parse rejects malformed en-US grouping", () => {
  const kit = createCurrencyFormatter();
  assert.throws(() => kit.parseMoney("12,34.56", {
    locale: "en-US",
    currency: "USD",
    strictParse: true
  }));
});

test("strict parse accepts valid en-IN grouping", () => {
  const kit = createCurrencyFormatter();
  const out = kit.parseMoney("12,34,567.89", {
    locale: "en-IN",
    currency: "INR",
    strictParse: true
  });
  assert.equal(out.toDecimalString(), "1234567.89");
});

test("allocation rejects non-positive ratios", () => {
  const total = Money.fromMajor("10.00", { currency: "USD" });
  assert.throws(() => total.allocate([1, 0, 1]));
  assert.throws(() => total.allocate([1, -1, 1]));
});

test("deterministic serialization includes canonical trace", () => {
  const base = Money.fromMajor("10.00", { currency: "USD" });
  const withMeta = base.withTrace({ requestId: "abc-123", userId: 42 });
  const out = withMeta.multiply("2").toDeterministicString();

  assert.equal(
    out,
    JSON.stringify({
      amount: "20.00",
      currency: "USD",
      minor: "2000",
      scale: 2,
      trace: [
        { amount: "10.00", op: "fromMajor", roundingMode: "halfExpand" },
        { requestId: "abc-123", userId: "42" },
        { factor: "2", op: "multiply", roundingMode: "halfExpand" }
      ]
    })
  );
});
