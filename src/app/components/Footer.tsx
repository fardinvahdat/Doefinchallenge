import { Link } from "react-router";
import { Github, Twitter, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand — F-02: removed "V2" */}
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-accent">
              <span className="font-bold text-xs text-background">D</span>
            </div>
            <span className="text-sm font-semibold text-text-secondary">
              Doefin
            </span>
          </div>

          {/* Footer links */}
          <div className="flex items-center gap-6">
            {/* A-01: Architecture moved here as developer docs link */}
            <Link
              to="/architecture"
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Developer Docs
            </Link>

            {/* F-01: Real links or disabled with "coming soon" — using opacity + disabled cursor */}
            <span
              className="opacity-40 cursor-not-allowed text-text-tertiary"
              title="Documentation coming soon"
              aria-label="Documentation (coming soon)"
            >
              <FileText className="h-5 w-5" />
            </span>
            <span
              className="opacity-40 cursor-not-allowed text-text-tertiary"
              title="GitHub coming soon"
              aria-label="GitHub (coming soon)"
            >
              <Github className="h-5 w-5" />
            </span>
            <span
              className="opacity-40 cursor-not-allowed text-text-tertiary"
              title="Twitter coming soon"
              aria-label="Twitter (coming soon)"
            >
              <Twitter className="h-5 w-5" />
            </span>
          </div>

          {/* Copyright */}
          <div className="text-xs text-text-tertiary">
            © 2026 Doefin. Built on Base Sepolia.
          </div>
        </div>
      </div>
    </footer>
  );
}
