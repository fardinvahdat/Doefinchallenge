import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { WalletConnect } from "./WalletConnect";

export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const activeCls = "text-primary bg-primary/10 rounded-md";
  const inactiveCls = "text-text-secondary hover:text-text-primary hover:bg-surface rounded-md";

  const navLinks = [
    { to: "/create-condition", label: "Create Condition" },
    { to: "/create-market", label: "Get Tokens" },
    { to: "/markets", label: "Markets" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
            aria-label="Doefin — Bitcoin Difficulty Prediction Markets"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent transition-transform group-hover:scale-105">
              <span className="font-bold text-sm text-background">D</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Doefin
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={isActive(to) ? activeCls : inactiveCls}
                >
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side: Wallet + Mobile hamburger */}
          <div className="flex items-center gap-3">
            <WalletConnect />
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl"
          role="dialog"
          aria-label="Mobile navigation menu"
        >
          <nav
            aria-label="Mobile navigation"
            className="container mx-auto px-4 py-4 flex flex-col gap-1"
          >
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive(to) ? activeCls : inactiveCls
                }`}
              >
                {label}
              </Link>
            ))}
            <hr className="border-border my-2" />
            <Link
              to="/architecture"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive("/architecture") ? activeCls : inactiveCls
              }`}
            >
              Architecture
            </Link>
          </nav>
        </div>
      )}
    </nav>
  );
}
