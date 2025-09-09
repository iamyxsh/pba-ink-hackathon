import { Button } from "../ui/button";
import useWalletStore from "@/stores/walletStore";
import CustomDropdown from "./CustomDropdown";
import shortenAddress from "@/lib/shortenAddress";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { polkadotWalletService } from "@/services/polkadotWallet";
import { useState } from "react";

const Header = () => {
  const connectedWalletAddress = useWalletStore((state) => state.address);
  const isWalletConnected = useWalletStore((state) => state.connected);
  const setWallet = useWalletStore((state) => state.setWallet);
  const disconnect = useWalletStore((state) => state.disconnect);
  const location = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const walletInfo = await polkadotWalletService.connectWallet();
      if (walletInfo) {
        setWallet(walletInfo.address, walletInfo.chainId);
      }
    } catch (error) {
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    polkadotWalletService.disconnect();
    disconnect();
  };

  const dropdownItems = [
    {
      value: connectedWalletAddress || "",
      label: shortenAddress(connectedWalletAddress!) || "Wallet Address",
    },
    { value: "logout", label: "Log Out" },
  ];

  const navItems = [
    { path: "/trade", label: "Trade" },
    { path: "/faucet", label: "Faucet" },
    { path: "/manage-liquidity", label: "Manage Liquidity" },
  ];

  return (
    <div className="sticky top-0 z-50 bg-background">
      <nav className="flex items-center justify-between p-5 pl-2 mx-auto max-w-7xl">
        <p className="text-lg font-bold">
          <span className="text-primary text-2xl font-vectrex">DEXTR</span>
        </p>
        <div className="flex flex-1 justify-center">
          <div className="flex space-x-1 border border-primary bg-gray-800 rounded-lg p-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "font-bold px-4 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {isWalletConnected ? (
          <div>
            <CustomDropdown
              value=""
              items={dropdownItems}
              placeholder={shortenAddress(connectedWalletAddress!) || ""}
              onChange={(value) => {
                if (value === "logout") {
                  handleLogout();
                }
              }}
              className="rounded-xl"
            />
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        )}
      </nav>
    </div>
  );
};

export default Header;