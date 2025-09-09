import LpOrderBook from "@/components/custom/trade/LPOrderBook";
import RecentOrdersMatched from "@/components/custom/trade/RecentOrdersMatched";
import AllPairs from "@/components/custom/trade/AllPairs";
import { useEffect, useState } from "react";
import Swap from "@/components/custom/swap/Swap";

// Dummy data for RecentOrdersMatched
const dummyOrders = [
  {
    orderId: "1",
    trader: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    tokenIn: "DOT",
    tokenOut: "USDT",
    tokenInAmount: 1.2,
    tokenOutAmount: 2400,
    feeEarned: 12,
  },
  {
    orderId: "2",
    trader: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    tokenIn: "KSM",
    tokenOut: "DOT",
    tokenInAmount: 0.5,
    tokenOutAmount: 7.5,
    feeEarned: 0.1,
  },
  {
    orderId: "3",
    trader: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
    tokenIn: "GLMR",
    tokenOut: "KSM",
    tokenInAmount: 10,
    tokenOutAmount: 0.025,
    feeEarned: 0.0025,
  },
];

const Trade = () => {
  const [orders, setOrders] = useState(dummyOrders);

  // Function to simulate receiving a new order
  const addNewOrder = (newOrder: typeof dummyOrders[0]) => {
    setOrders((prevOrders) => {
      const updatedOrders = [...prevOrders, newOrder];
      return updatedOrders.sort((a, b) => {
        const idA = a.orderId || "";
        const idB = b.orderId || "";
        return idB.localeCompare(idA);
      });
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newOrder = {
        orderId: "4",
        trader: "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM",
        tokenIn: "ASTR",
        tokenOut: "GLMR",
        tokenInAmount: 1000,
        tokenOutAmount: 150,
        feeEarned: 5,
      };
      addNewOrder(newOrder);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="min-w-full min-h-[300px]">
          <LpOrderBook />
        </div>
        <div className="min-h-[300px]">
          <Swap />
        </div>
        <div className="min-h-[300px]">
          <AllPairs />
        </div>
      </div>
      <div className="flex w-full mt-4">
        <RecentOrdersMatched orders={orders} />
      </div>
    </>
  );
};

export default Trade;