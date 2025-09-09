import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import shortenAddress from "@/lib/shortenAddress";

interface Order {
  orderId: string;
  trader: string;
  tokenIn: string;
  tokenOut: string;
  tokenInAmount: number;
  tokenOutAmount: number;
  feeEarned: number;
}

interface RecentOrdersMatchedProps {
  orders: Order[];
}

const RecentOrdersMatched: React.FC<RecentOrdersMatchedProps> = ({ orders }) => {
  return (
    <Card className="w-full bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Recent Orders Matched</CardTitle>
        <p className="text-sm text-gray-400">Latest executed trades</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 px-2 py-2 text-xs text-gray-400 border-b border-gray-700">
            <span>Order ID</span>
            <span>Trader</span>
            <span>From</span>
            <span>To</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Fee Earned</span>
          </div>

          {/* Orders */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div 
                  key={order.orderId} 
                  className="grid grid-cols-6 gap-4 px-2 py-3 text-xs hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="text-primary font-mono">#{order.orderId}</span>
                  <span className="text-gray-300 font-mono">
                    {shortenAddress(order.trader)}
                  </span>
                  <span className="text-white">
                    {order.tokenInAmount.toFixed(3)} {order.tokenIn}
                  </span>
                  <span className="text-white">
                    {order.tokenOutAmount.toFixed(3)} {order.tokenOut}
                  </span>
                  <span className="text-right text-green-400">
                    {order.tokenOutAmount.toFixed(2)}
                  </span>
                  <span className="text-right text-yellow-400">
                    {order.feeEarned.toFixed(4)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No recent orders found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center py-4 border-t border-gray-700 mt-4">
          <p className="text-xs text-gray-500">
            Real-time order data will be integrated in Step 2
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersMatched;