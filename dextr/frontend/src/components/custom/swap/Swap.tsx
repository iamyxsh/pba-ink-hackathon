import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import useSwapStore, { type Token } from "@/stores/useSwapStore";

const SwapComponent: React.FC = () => {
  const {
    sellAmount,
    sellCurrency,
    sellBalance,
    buyAmount,
    buyCurrency,
    buyBalance,
    percentageChange,
    isLoading,
    priceData,
    lastPriceUpdate,
    userAddress,
    setSellAmount,
    setSellCurrency,
    setBuyCurrency,
    swapTokens,
    startPriceUpdates,
    stopPriceUpdates,
    fetchBalances,
    setUserAddress,
    placeMarketOrder,
  } = useSwapStore();

  // Supported tokens for DOT/USDC trading
  const tokenOptions: Token[] = ["DOT", "USDC"];

  // Initialize price updates and mock user address on component mount
  useEffect(() => {
    startPriceUpdates();
    
    // Mock user address for demo purposes
    const mockAddress = "5GrpknVvGGrGH3EFuURXeMrWHvbpj3VfER1oX5jFtuGbfzCE";
    setUserAddress(mockAddress);
    fetchBalances(mockAddress);

    return () => {
      stopPriceUpdates();
    };
  }, [startPriceUpdates, stopPriceUpdates, setUserAddress, fetchBalances]);

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setSellAmount(value);
  };

  const handleConnectWallet = () => {
    // Mock wallet connection
    const mockAddress = "5GrpknVvGGrGH3EFuURXeMrWHvbpj3VfER1oX5jFtuGbfzCE";
    setUserAddress(mockAddress);
    fetchBalances(mockAddress);
  };

  return (
    <div className="w-full flex justify-center">
      <Card className="w-full bg-gray-800 border-gray-700 text-white">
        <CardContent className="p-6 space-y-4">
          {/* Price & Connection Status */}
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-400">
              {priceData ? (
                <>
                  {priceData.tokenPair}: ${priceData.price.toFixed(4)}
                  {lastPriceUpdate && (
                    <span className="ml-2 text-xs">
                      Updated: {new Date(lastPriceUpdate).toLocaleTimeString()}
                    </span>
                  )}
                </>
              ) : (
                'Loading prices...'
              )}
            </div>
            <div className="text-gray-400">
              {userAddress ? (
                <span className="text-green-400">
                  Connected: {userAddress.substring(0, 6)}...{userAddress.substring(-4)}
                </span>
              ) : (
                <Button onClick={handleConnectWallet} size="sm" variant="outline">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Sell Section */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Sell</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={sellAmount}
                onChange={handleSellAmountChange}
                placeholder="0"
                className="bg-gray-700 border-gray-600 text-white text-lg"
                disabled={isLoading}
              />
              <Select value={sellCurrency} onValueChange={setSellCurrency}>
                <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokenOptions.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">
                Balance: {sellBalance.toFixed(4)} {sellCurrency}
              </span>
              {sellAmount > sellBalance && (
                <span className="text-red-400">Insufficient balance</span>
              )}
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <button 
              onClick={swapTokens}
              className="rounded-full bg-gray-700 p-2 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Buy Section */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Buy</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={buyAmount}
                readOnly
                placeholder="0"
                className="bg-gray-700 border-gray-600 text-white text-lg"
              />
              <Select value={buyCurrency} onValueChange={setBuyCurrency}>
                <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokenOptions.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">
                Balance: {buyBalance.toFixed(4)} {buyCurrency}
              </span>
              {percentageChange !== 0 && (
                <div className={`${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={placeMarketOrder} 
            className="w-full" 
            disabled={isLoading || !userAddress || sellAmount <= 0 || sellAmount > sellBalance}
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SwapComponent;