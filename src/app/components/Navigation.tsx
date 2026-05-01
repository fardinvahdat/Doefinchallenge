import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Plus, BarChart3, Layers, Cpu } from "lucide-react";
import { Button } from "./ui/button";
import { WalletConnect } from "./WalletConnect";
import { VaultMenu } from "./VaultMenu";

export function Navigation() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll while sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const activeCls = "text-primary bg-primary/10";
  const inactiveCls = "text-text-secondary hover:text-text-primary hover:bg-elevated";

  const navLinks = [
    { to: "/create-condition", label: "Create Condition", icon: <Plus className="h-4 w-4 flex-shrink-0" /> },
    { to: "/create-market",    label: "Get Tokens",       icon: <Layers className="h-4 w-4 flex-shrink-0" /> },
    { to: "/markets",          label: "Markets",          icon: <BarChart3 className="h-4 w-4 flex-shrink-0" /> },
  ];

  return (
    <>
      {/* ── Top nav bar ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 group flex-shrink-0"
              aria-label="Doefin home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent transition-transform group-hover:scale-105">
                <span className="font-bold text-sm text-background">D</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Doefin
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-1 flex-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to}>
                  <Button
                    variant="ghost"
                    className={`rounded-md ${isActive(to) ? activeCls : "text-text-secondary hover:text-text-primary hover:bg-surface"}`}
                  >
                    {label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right: vault + wallet + hamburger */}
            <div className="flex items-center gap-2">
              <div className="md:flex hidden items-center gap-2">
                <VaultMenu />
                <WalletConnect />
              </div>
              <button
                className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto bg-background/75 backdrop-blur-sm"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar panel ─────────────────────────────────────────────── */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 min-h-screen max-h-screen right-0 z-50 w-72 md:hidden flex flex-col bg-surface border-l border-border shadow-2xl transition-transform duration-300 ease-in-out py-2 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!sidebarOpen}
      >
        {/* Sidebar header — same height as nav bar */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent group-hover:scale-105 transition-transform">
              <span className="font-bold text-xs text-background">D</span>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Doefin
            </span>
          </Link>
          <button
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1"
          aria-label="Mobile navigation"
        >
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-lg text-sm font-medium transition-colors ${
                isActive(to) ? activeCls : inactiveCls
              }`}
            >
              {icon}
              {label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-border">
            <Link
              to="/architecture"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-lg text-sm font-medium transition-colors ${
                isActive("/architecture") ? activeCls : inactiveCls
              }`}
            >
              <Cpu className="h-4 w-4 flex-shrink-0" />
              Architecture
            </Link>
          </div>
        </nav>

        {/* Bottom safe-area padding */}
        <div
          className="flex-shrink-0 px-4 py-3 border-t border-border space-y-2"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <VaultMenu />
          <WalletConnect />
        </div>
      </div>
    </>
  );
}
