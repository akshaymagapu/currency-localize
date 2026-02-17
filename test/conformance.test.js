import test from "node:test";
import assert from "node:assert/strict";
import minorFixtures from "./fixtures/minor-unit-fixtures.json" with { type: "json" };
import localeFixtures from "./fixtures/locale-format-fixtures.json" with { type: "json" };
import { Money, createCurrencyFormatter, getMinorUnit } from "../src/index.js";

const formatter = createCurrencyFormatter();

test("minor-unit conformance fixtures", () => {
  for (const fixture of minorFixtures) {
    assert.equal(getMinorUnit(fixture.currency), fixture.minorUnit, fixture.currency);
  }
});

test("country resolver conformance for known entries", () => {
  assert.equal(formatter.resolveCurrency({ country: "US" }), "USD");
  assert.equal(formatter.resolveCurrency({ country: "IN" }), "INR");
  assert.equal(formatter.resolveCurrency({ country: "JP" }), "JPY");
  assert.equal(formatter.resolveCurrency({ country: "DE" }), "EUR");
});

test("locale formatting fixtures", () => {
  for (const fixture of localeFixtures) {
    const m = Money.fromMinor(fixture.minor, {
      currency: fixture.currency,
      scale: fixture.scale,
      locale: fixture.locale
    });
    assert.equal(m.format(), fixture.expected, `${fixture.locale}:${fixture.currency}`);
  }
});
