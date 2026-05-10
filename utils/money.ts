export type Money = {
  amount: number;
  currencySymbol: string;
  raw: string;
};

const moneyPattern = /([$€£])\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g;

export function extractMoneyValues(text: string): Money[] {
  return [...text.matchAll(moneyPattern)].map((match) => ({
    currencySymbol: match[1],
    amount: Number(match[2].replace(/,/g, '')),
    raw: match[0],
  }));
}

export function parseFirstMoney(text: string): Money {
  const [first] = extractMoneyValues(text);
  if (!first) {
    throw new Error(`No currency value was found in: ${text}`);
  }
  return first;
}

export function formatMoneyForAssertion(money: Money): RegExp {
  const fixed = money.amount.toFixed(2).replace('.', '\\.');
  return new RegExp(`\\${money.currencySymbol}\\s?${fixed}`);
}
