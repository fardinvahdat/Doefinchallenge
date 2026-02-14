import { Outlet } from "react-router";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { Web3Provider } from "./contexts/Web3Context";

export default function Root() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-background relative flex flex-col">
        <Navigation />
        <main className="relative z-10 flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
    </Web3Provider>
  );
}