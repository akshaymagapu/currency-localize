import { defaultCurrencyResolver } from "./countryCurrency.js";
import { getMinorUnit } from "./currencyMeta.js";
import { Money } from "./money.js";

export { Money, getMinorUnit };

export function createCurrencyFormatter(options = {}) {
  const currencyResolver = options.currencyResolver || defaultCurrencyResolver;
  const plugins = options.plugins || [];

  function resolveCurrency(input = {}) {
    if (input.currency) return String(input.currency).toUpperCase();
    const resolved = currencyResolver(input.country);
    if (!resolved) {
      throw new Error("Unable to resolve currency. Provide currency or a known country code.");
    }
    return resolved;
  }

  function makeMoney(amount, input = {}) {
    const currency = resolveCurrency(input);
    return Money.fromMajor(amount, {
      currency,
      scale: input.scale ?? getMinorUnit(currency),
      locale: input.locale,
      roundingMode: input.roundingMode
    });
  }

  function parseMoney(text, input = {}) {
    const currency = resolveCurrency(input);
    return Money.parse(text, {
      currency,
      scale: input.scale ?? getMinorUnit(currency),
      locale: input.locale,
      strict: input.strictParse,
      roundingMode: input.roundingMode
    });
  }

  const api = {
    resolveCurrency,
    money: makeMoney,
    parseMoney,
    fromMinor(minor, input = {}) {
      const currency = resolveCurrency(input);
      return Money.fromMinor(minor, {
        currency,
        scale: input.scale ?? getMinorUnit(currency),
        locale: input.locale
      });
    },
    use(plugin) {
      if (typeof plugin !== "function") throw new Error("plugin must be a function");
      plugin(api);
      return api;
    }
  };

  for (const plugin of plugins) {
    if (typeof plugin !== "function") {
      throw new Error("plugins must contain functions");
    }
    plugin(api);
  }

  return api;
}

export const currencyFormatter = createCurrencyFormatter();
