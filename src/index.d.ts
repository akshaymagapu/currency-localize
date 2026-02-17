export type RoundingMode = "halfExpand" | "halfEven" | "ceil" | "floor" | "trunc";

export type MoneyInput = {
  currency?: string;
  country?: string;
  locale?: string;
  scale?: number;
  strictParse?: boolean;
  roundingMode?: RoundingMode;
};

export type MoneyJSON = {
  amount: string;
  minor: string;
  currency: string;
  scale: number;
  trace: ReadonlyArray<Record<string, unknown>>;
};

export class Money {
  readonly minor: bigint;
  readonly currency: string;
  readonly scale: number;
  readonly locale?: string;
  readonly trace: ReadonlyArray<Record<string, unknown>>;

  static fromMajor(amount: string | number | bigint, options: MoneyInput & { currency: string }): Money;
  static fromMinor(minor: string | number | bigint, options: MoneyInput & { currency: string }): Money;
  static parse(input: string, options: MoneyInput & { currency: string; strict?: boolean }): Money;

  add(other: Money): Money;
  subtract(other: Money): Money;
  multiply(factor: string | number | bigint, options?: { scale?: number; roundingMode?: RoundingMode }): Money;
  allocate(ratios: Array<number | bigint>): Money[];
  equals(other: Money): boolean;
  toDecimalString(): string;
  format(options?: { locale?: string }): string;
  toJSON(): MoneyJSON;
  toDeterministicString(): string;
  withTrace(metadata: Record<string, unknown>): Money;
}

export type MoneyKit = {
  resolveCurrency(input?: MoneyInput): string;
  money(amount: string | number | bigint, input?: MoneyInput): Money;
  parseMoney(input: string, options?: MoneyInput): Money;
  fromMinor(minor: string | number | bigint, input?: MoneyInput): Money;
  use(plugin: (api: MoneyKit) => void): MoneyKit;
  [key: string]: unknown;
};

export function createCurrencyFormatter(options?: {
  currencyResolver?: (countryCode?: string) => string | undefined;
  plugins?: Array<(api: MoneyKit) => void>;
}): MoneyKit;

export function getMinorUnit(currency: string): number;

export const currencyFormatter: MoneyKit;
