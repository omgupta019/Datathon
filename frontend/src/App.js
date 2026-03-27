import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import RoleSelection from "@/pages/RoleSelection";
import WalletConnect from "@/pages/WalletConnect";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import BlockchainLedger from "@/pages/BlockchainLedger";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/connect-wallet" element={<WalletConnect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/blockchain" element={<BlockchainLedger />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        richColors
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            fontFamily: "'Manrope', sans-serif",
          },
        }}
      />
    </AppProvider>
  );
}

export default App;
