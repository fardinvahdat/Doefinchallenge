import { Link } from "react-router";
import { Github, Twitter, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center space-x-2 group flex-shrink-0"
            aria-label="Doefin home"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-primary to-accent group-hover:scale-105 transition-transform">
              <span className="font-bold text-xs text-background">D</span>
            </div>
            <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
              Doefin
            </span>
          </Link>

          {/* Footer links */}
          <div className="flex items-center gap-1">
            <Link
              to="/architecture"
              className="px-3 py-2.5 min-h-[44px] flex items-center text-xs text-text-tertiary hover:text-text-secondary transition-colors rounded-md hover:bg-elevated"
            >
              Developer Docs
            </Link>

            <span
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center opacity-40 cursor-not-allowed text-text-tertiary rounded-md"
              title="Documentation coming soon"
              aria-label="Documentation (coming soon)"
            >
              <FileText className="h-5 w-5" />
            </span>
            <span
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center opacity-40 cursor-not-allowed text-text-tertiary rounded-md"
              title="GitHub coming soon"
              aria-label="GitHub (coming soon)"
            >
              <Github className="h-5 w-5" />
            </span>
            <span
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center opacity-40 cursor-not-allowed text-text-tertiary rounded-md"
              title="Twitter coming soon"
              aria-label="Twitter (coming soon)"
            >
              <Twitter className="h-5 w-5" />
            </span>
          </div>

          {/* Copyright */}
          <div className="text-xs text-text-tertiary flex-shrink-0">
            © 2026 Doefin. Built on Base Sepolia.
          </div>
        </div>
      </div>
    </footer>
  );
}
