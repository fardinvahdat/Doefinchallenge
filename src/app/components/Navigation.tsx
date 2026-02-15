import { Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { WalletConnect } from "./WalletConnect";

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent transition-transform group-hover:scale-110">
              <span className="font-bold text-sm text-background">D</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Doefin
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/create-condition">
              <Button
                variant="ghost"
                className={
                  isActive("/create-condition")
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }
              >
                Create Condition
              </Button>
            </Link>
            <Link to="/create-market">
              <Button
                variant="ghost"
                className={
                  isActive("/create-market")
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }
              >
                Create Market
              </Button>
            </Link>
            <Link to="/markets">
              <Button
                variant="ghost"
                className={
                  isActive("/markets")
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }
              >
                Markets
              </Button>
            </Link>
            <Link to="/architecture">
              <Button
                variant="ghost"
                className={
                  isActive("/architecture")
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }
              >
                Architecture
              </Button>
            </Link>
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-3">
            <WalletConnect />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2 pb-3 overflow-x-auto">
          <Link to="/create-condition">
            <Button
              variant="ghost"
              size="sm"
              className={
                isActive("/create-condition")
                  ? "text-primary"
                  : "text-text-secondary"
              }
            >
              Create Condition
            </Button>
          </Link>
          <Link to="/create-market">
            <Button
              variant="ghost"
              size="sm"
              className={
                isActive("/create-market")
                  ? "text-primary"
                  : "text-text-secondary"
              }
            >
              Create Market
            </Button>
          </Link>
          <Link to="/markets">
            <Button
              variant="ghost"
              size="sm"
              className={isActive("/markets") ? "text-primary" : "text-text-secondary"}
            >
              Markets
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}