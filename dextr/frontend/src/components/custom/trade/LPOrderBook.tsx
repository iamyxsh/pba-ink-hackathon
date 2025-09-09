import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LpOrderBook = () => {
  // Mock orderbook data for Polkadot ecosystem
  const bids = [
    { price: 9.95, amount: 150, total: 1492.50 },
    { price: 9.90, amount: 200, total: 1980.00 },
    { price: 9.85, amount: 300, total: 2955.00 },
    { price: 9.80, amount: 450, total: 4410.00 },
    { price: 9.75, amount: 600, total: 5850.00 },
  ];

  const asks = [
    { price: 10.05, amount: 100, total: 1005.00 },
    { price: 10.10, amount: 250, total: 2525.00 },
    { price: 10.15, amount: 350, total: 3552.50 },
    { price: 10.20, amount: 400, total: 4080.00 },
    { price: 10.25, amount: 500, total: 5125.00 },
  ];

  return (
    <Card className="h-full bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Order Book</CardTitle>
        <p className="text-sm text-gray-400">DOT/USDT</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (Sell orders) */}
          <div className="px-4 space-y-1">
            {asks.reverse().map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-gray-700 py-1">
                <span className="text-red-400">{ask.price.toFixed(2)}</span>
                <span className="text-right text-white">{ask.amount}</span>
                <span className="text-right text-gray-400">{ask.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="px-4 py-2 border-y border-gray-700">
            <div className="text-center text-sm">
              <span className="text-gray-400">Spread: </span>
              <span className="text-white">0.10 (1.0%)</span>
            </div>
          </div>

          {/* Bids (Buy orders) */}
          <div className="px-4 space-y-1">
            {bids.map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-gray-700 py-1">
                <span className="text-green-400">{bid.price.toFixed(2)}</span>
                <span className="text-right text-white">{bid.amount}</span>
                <span className="text-right text-gray-400">{bid.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Live orderbook data will be integrated in Step 2
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LpOrderBook;