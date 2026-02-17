import countryToCurrency from "country-to-currency";

// Consumers can override/extend via createCurrencyFormatter({ currencyResolver }).
// Source: ISO country-to-currency dataset from the `country-to-currency` package.
export const COUNTRY_TO_CURRENCY = Object.freeze(countryToCurrency);

export function defaultCurrencyResolver(countryCode) {
  if (!countryCode) return undefined;
  const code = String(countryCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return undefined;
  return COUNTRY_TO_CURRENCY[code];
}
