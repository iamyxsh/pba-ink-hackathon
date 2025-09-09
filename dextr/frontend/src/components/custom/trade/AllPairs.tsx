import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AllPairs = () => {
  // Single DOT/USDC pair with enhanced data
  const marketData = {
    pair: "DOT/USDC",
    price: 7.25,
    change24h: 2.8,
    volume24h: 2850000,
    high24h: 7.45,
    low24h: 7.02,
    totalTrades24h: 1847,
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <Card className="h-full bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">DOT/USDC Market</CardTitle>
        <p className="text-sm text-gray-400">24h Performance</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {/* Market Stats */}
          <div className="px-4 py-4 space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">DOT/USDC</h3>
              <p className="text-gray-400">Polkadot • USD Coin</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400">Last Price</p>
                <p className="text-2xl font-bold text-white">${marketData.price.toFixed(2)}</p>
                <p className={`text-sm font-medium ${marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Volume</p>
                <p className="text-2xl font-bold text-white">${formatVolume(marketData.volume24h)}</p>
                <p className="text-sm text-gray-400">{marketData.totalTrades24h.toLocaleString()} trades</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              <div>
                <p className="text-sm text-gray-400">24h High</p>
                <p className="text-lg font-semibold text-white">${marketData.high24h.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Low</p>
                <p className="text-lg font-semibold text-white">${marketData.low24h.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Market Statistics */}
          <div className="px-4 py-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Market Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Spread</span>
                <span className="text-white">0.02%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white">$8.2B</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Circulating Supply</span>
                <span className="text-white">1.13B DOT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">All-Time High</span>
                <span className="text-white">$54.98</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center py-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Live market data will be integrated in Step 2
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllPairs;