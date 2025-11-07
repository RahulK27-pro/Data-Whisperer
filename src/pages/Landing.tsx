import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl text-foreground">DataChat</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button onClick={() => navigate("/auth")}>Sign Up</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Chat With Your Database. <span className="text-primary">Instantly.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your database, add your data and business logic, and get instant answers using natural language. No SQL required.
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
            Get Started for Free
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2025 DataChat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
