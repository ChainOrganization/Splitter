export interface Group {
  id: string;
  members: string[]; // Stellar public keys (G...)
}

export interface Expense {
  payer: string;
  amount: number; // in XLM
  description: string;
}

// net balance per member address
export type Balances = Record<string, number>;
