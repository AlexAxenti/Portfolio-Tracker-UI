export type TradeType = 'buy' | 'sell';

export interface Trade {
  id: string;
  ticker: string;
  type: TradeType;
  quantity: number;
  price: number;
  tradeDate: string;
  notes?: string;
}

export type TradeInput = Omit<Trade, 'id'>;
