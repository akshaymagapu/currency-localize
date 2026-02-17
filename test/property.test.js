import test from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { Money, createCurrencyFormatter } from "../src/index.js";

const formatter = createCurrencyFormatter();

test("property: add/subtract inverse", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.bigInt({ min: -9_000_000_000_000n, max: 9_000_000_000_000n }),
      fc.bigInt({ min: -9_000_000_000_000n, max: 9_000_000_000_000n }),
      async (aMinor, bMinor) => {
        const a = Money.fromMinor(aMinor, { currency: "USD" });
        const b = Money.fromMinor(bMinor, { currency: "USD" });
        const roundTrip = a.add(b).subtract(b);
        assert.equal(roundTrip.minor.toString(), a.minor.toString());
      }
    ),
    { numRuns: 200 }
  );
});

test("property: allocate preserves total", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.bigInt({ min: -10_000_000n, max: 10_000_000n }),
      fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 8 }),
      async (minor, ratios) => {
        const total = Money.fromMinor(minor, { currency: "USD" });
        const shares = total.allocate(ratios);
        const sum = shares.reduce((acc, s) => acc + s.minor, 0n);
        assert.equal(sum.toString(), minor.toString());
      }
    ),
    { numRuns: 200 }
  );
});

test("property: format/parse round-trip in tolerant mode for en-US", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.bigInt({ min: -9_000_000_000_000n, max: 9_000_000_000_000n }),
      async (minor) => {
        const a = Money.fromMinor(minor, { currency: "USD", locale: "en-US" });
        const formatted = a.format();
        const parsed = formatter.parseMoney(formatted, {
          currency: "USD",
          locale: "en-US",
          strictParse: false
        });
        assert.equal(parsed.minor.toString(), a.minor.toString());
      }
    ),
    { numRuns: 150 }
  );
});

test("property: strict parse accepts canonical numeric strings", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.bigInt({ min: -9_000_000_000_000n, max: 9_000_000_000_000n }),
      async (minor) => {
        const a = Money.fromMinor(minor, { currency: "USD", locale: "en-US" });
        const parsed = formatter.parseMoney(a.toDecimalString(), {
          currency: "USD",
          locale: "en-US",
          strictParse: true
        });
        assert.equal(parsed.minor.toString(), a.minor.toString());
      }
    ),
    { numRuns: 150 }
  );
});
