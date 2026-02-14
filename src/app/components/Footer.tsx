import { Github, Twitter, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-accent">
              <span className="font-bold text-xs text-background">D</span>
            </div>
            <span className="text-sm font-semibold text-text-secondary">
              Doefin V2
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="text-text-tertiary hover:text-primary transition-colors"
              aria-label="Documentation"
            >
              <FileText className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-text-tertiary hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-text-tertiary hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
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
