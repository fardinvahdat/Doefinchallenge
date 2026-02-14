import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 lg:px-8">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="text-center max-w-md mx-auto space-y-6">
          <div className="h-20 w-20 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-text-tertiary" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            404
          </h1>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">
              Page Not Found
            </h2>
            <p className="text-text-secondary">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
