import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api";
import useSwapStore from "@/stores/useSwapStore";

const Faucet = () => {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const { userAddress, fetchBalances } = useSwapStore();

  const handleFaucetRequest = async (token: 'DOT' | 'USDC') => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(prev => ({ ...prev, [token]: true }));

    try {
      const response = await apiClient.requestFaucetTokens({
        userAddress,
        token
      });

      if (response.success) {
        alert(`Success! ${response.message}\nTx Hash: ${response.txHash}`);
        // Refresh balances
        fetchBalances(userAddress);
      } else {
        alert(`Failed: ${response.message}`);
      }
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [token]: false }));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white">Polkadot Testnet Faucet</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Get test tokens for the Polkadot testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!userAddress && (
            <div className="text-center py-4 bg-gray-700 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Please connect your wallet first by visiting the Trade page
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">DOT</h3>
              <p className="text-gray-400 mb-4">Polkadot native token</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleFaucetRequest('DOT')}
                disabled={!userAddress || isLoading.DOT}
              >
                {isLoading.DOT ? 'Claiming...' : 'Claim 100 DOT'}
              </Button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">USDC</h3>
              <p className="text-gray-400 mb-4">USD Coin stablecoin</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleFaucetRequest('USDC')}
                disabled={!userAddress || isLoading.USDC}
              >
                {isLoading.USDC ? 'Claiming...' : 'Claim 1000 USDC'}
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              {userAddress ? (
                `Connected: ${userAddress.substring(0, 8)}...${userAddress.substring(-6)}`
              ) : (
                'Connect your wallet to claim test tokens'
              )}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Rate limit: Once per 10 minutes per token
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Faucet;