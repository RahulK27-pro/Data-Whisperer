import { useState, useEffect } from "react";
import { Database, Settings, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { stack } from "@/lib/stack";
import DataManager from "@/components/app/DataManager";
import ContextSettings from "@/components/app/ContextSettings";
import Chat from "@/components/app/Chat";

type Section = "data" | "context" | "chat";

const AppPage = () => {
  const [activeSection, setActiveSection] = useState<Section>("data");
  const [tables, setTables] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await stack.getUser();
        if (!currentUser) {
          navigate("/auth");
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    if (user) {
      await user.signOut();
    }
    navigate("/");
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not logged in (will redirect)
  if (!user) {
    return null;
  }

  const sectionTitles: Record<Section, string> = {
    data: "Data Manager",
    context: "Context & Settings",
    chat: "Chat",
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">DataChat</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection("data")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "data"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Database className="h-5 w-5" />
            <span className="font-medium">Data Manager</span>
          </button>

          <button
            onClick={() => setActiveSection("context")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "context"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Context & Settings</span>
          </button>

          <button
            onClick={() => setActiveSection("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "chat"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Chat</span>
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-8 py-4">
          <h1 className="text-2xl font-semibold text-foreground">{sectionTitles[activeSection]}</h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeSection === "data" && <DataManager tables={tables} setTables={setTables} />}
          {activeSection === "context" && <ContextSettings tables={tables} />}
          {activeSection === "chat" && <Chat tables={tables} />}
        </main>
      </div>
    </div>
  );
};

export default AppPage;
