# currency-localize

Format, parse, and calculate money values safely in JavaScript.

## Install

```bash
npm install currency-localize
```

## Quick Start

```js
import { createCurrencyFormatter } from "currency-localize";

const kit = createCurrencyFormatter();

const amount = kit.money("1234.5", { country: "IN", locale: "en-IN" });
console.log(amount.currency); // INR
console.log(amount.format()); // ₹1,234.50
```

## Common Examples

### Create money values

```js
import { Money } from "currency-localize";

const a = Money.fromMajor("10.25", { currency: "USD" });
const b = Money.fromMinor(310, { currency: "USD" });
```

### Arithmetic

```js
a.add(b).toDecimalString(); // 13.35
a.subtract(b).toDecimalString(); // 7.15
a.multiply("3").toDecimalString(); // 30.75
```

### Split amount (allocation)

```js
const total = Money.fromMajor("10.00", { currency: "USD" });
const [x, y, z] = total.allocate([1, 1, 1]);

x.toDecimalString(); // 3.34
y.toDecimalString(); // 3.33
z.toDecimalString(); // 3.33
```

### Parse user input

```js
const kit = createCurrencyFormatter();

kit.parseMoney("($1,234.50)", {
  currency: "USD",
  locale: "en-US"
}).toDecimalString(); // -1234.50
```

### Strict parse mode

```js
kit.parseMoney("1234.50", {
  currency: "USD",
  locale: "en-US",
  strictParse: true
});
```

## API

### `createCurrencyFormatter(options?)`

Returns a formatter instance with:
- `money(amount, options)`
- `parseMoney(text, options)`
- `fromMinor(minor, options)`
- `resolveCurrency({ country?, currency? })`

### `Money`

- `fromMajor(amount, { currency, ... })`
- `fromMinor(amount, { currency, ... })`
- `parse(text, { currency, locale, ... })`
- `add(other)`
- `subtract(other)`
- `multiply(factor, { roundingMode? })`
- `allocate(ratios)`
- `format({ locale? })`
- `toDecimalString()`
- `toJSON()`
- `toDeterministicString()`
- `withTrace(metadata)`

## Rounding Modes

- `halfExpand` (default)
- `halfEven`
- `ceil`
- `floor`
- `trunc`

## License

MIT
