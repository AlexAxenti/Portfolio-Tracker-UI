export interface Holding {
  id: string;
  userId: string;
  tickerId: string;
  ticker: string;
  companyName?: string;
  shareCount: number;
  averageCost: number;
  currentPrice?: number;
  priceLastUpdatedAt?: string;
  sector?: string;
  categories?: string[];
  notes?: string;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingView extends Holding {
  effectiveCurrentPrice: number;
  totalCostInvested: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  allocationPercent: number;
}
