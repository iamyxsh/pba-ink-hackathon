import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/services/api";
import useSwapStore from "@/stores/useSwapStore";

const ManageLiquidity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dotAmount, setDotAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [pools, setPools] = useState<any[]>([]);
  const { userAddress, fetchBalances, accountBalances } = useSwapStore();

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const poolData = await apiClient.getAllLiquidityPools();
      setPools(poolData);
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!dotAmount || !usdcAmount) {
      alert('Please enter amounts for both tokens');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.addLiquidity({
        tokenPair: 'DOT/USDC',
        tokenAAmount: parseFloat(dotAmount),
        tokenBAmount: parseFloat(usdcAmount),
        userAddress,
        slippageTolerance: 0.01 // 1% slippage tolerance
      });

      alert(`Liquidity added successfully!\nLP Tokens: ${response.lpTokensReceived.toFixed(6)}\nTx Hash: ${response.txHash}`);
      
      // Reset form and refresh data
      setDotAmount('');
      setUsdcAmount('');
      fetchPools();
      fetchBalances(userAddress);
    } catch (error) {
      alert(`Failed to add liquidity: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const dotBalance = accountBalances?.balances.find(b => b.token === 'DOT')?.available || 0;
  const usdcBalance = accountBalances?.balances.find(b => b.token === 'USDC')?.available || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Liquidity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Add Liquidity</CardTitle>
            <CardDescription className="text-gray-400">
              Provide liquidity to earn trading fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!userAddress && (
              <div className="text-center py-4 bg-gray-700 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  Please connect your wallet first by visiting the Trade page
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-300">DOT Amount</label>
                <span className="text-xs text-gray-500">Balance: {dotBalance.toFixed(4)} DOT</span>
              </div>
              <Input 
                placeholder="0.0" 
                className="bg-gray-700 border-gray-600" 
                value={dotAmount}
                onChange={(e) => setDotAmount(e.target.value)}
                type="number"
                disabled={!userAddress}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-gray-300">USDC Amount</label>
                <span className="text-xs text-gray-500">Balance: {usdcBalance.toFixed(4)} USDC</span>
              </div>
              <Input 
                placeholder="0.0" 
                className="bg-gray-700 border-gray-600" 
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                type="number"
                disabled={!userAddress}
              />
            </div>

            <div className="text-xs text-gray-500 p-2 bg-gray-700 rounded">
              <p>• Pool: DOT/USDC</p>
              <p>• Slippage Tolerance: 1%</p>
              <p>• You will receive LP tokens representing your share</p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddLiquidity}
              disabled={!userAddress || isLoading || !dotAmount || !usdcAmount}
            >
              {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
            </Button>
          </CardContent>
        </Card>

        {/* Remove Liquidity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Remove Liquidity</CardTitle>
            <CardDescription className="text-gray-400">
              Remove your liquidity and claim fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">LP Token Amount</label>
              <Input placeholder="0.0" className="bg-gray-700 border-gray-600" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Pool</label>
              <select className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-white">
                <option>DOT/USDT</option>
                <option>KSM/DOT</option>
                <option>GLMR/KSM</option>
              </select>
            </div>
            <Button variant="destructive" className="w-full">Remove Liquidity</Button>
          </CardContent>
        </Card>
      </div>

      {/* Your Liquidity Positions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl text-white">Your Liquidity Positions</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your current liquidity positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pools.length > 0 ? (
            <div className="space-y-4">
              {pools.map((pool, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">{pool.pair}</h4>
                      <p className="text-sm text-gray-400">
                        Reserves: {pool.tokenAReserve.toFixed(2)} / {pool.tokenBReserve.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Total LP Tokens: {pool.totalLpTokens.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Positions: {pool.positions?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {new Date(pool.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No liquidity pools found.</p>
              <p className="text-sm mt-2">Add liquidity to create the first pool!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageLiquidity;