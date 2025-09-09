import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "@/components/custom/Header";
import Trade from "@/pages/Trade";
import Faucet from "@/pages/Faucet";
import ManageLiquidity from "@/pages/ManageLiquidity";

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-auto px-4">
          <Routes>
            <Route path="/trade" element={<Trade />} />
            <Route path="/faucet" element={<Faucet />} />
            <Route path="/manage-liquidity" element={<ManageLiquidity />} />
            <Route path="/" element={<Navigate to="/trade" replace />} />
            <Route path="*" element={<Navigate to="/trade" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
