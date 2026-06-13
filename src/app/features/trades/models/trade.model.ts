export type TradeType = 'buy' | 'sell';

export interface Trade {
  id: string;
  userId: string;
  tickerId: string;
  ticker: string;
  type: TradeType;
  quantity: number;
  price: number;
  tradeDate: string;
  notes?: string;
  createdAt: string;
}

export type TradeInput = Omit<Trade, 'id' | 'userId' | 'tickerId' | 'createdAt'>;
