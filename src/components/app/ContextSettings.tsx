import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ContextSettingsProps {
  tables: string[];
}

const ContextSettings = ({ tables }: ContextSettingsProps) => {
  const [contexts, setContexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadContexts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/context');
      const result = await response.json();

      if (result.success && result.contexts) {
        const contextMap: Record<string, string> = {};
        result.contexts.forEach((ctx: any) => {
          contextMap[ctx.tableName] = ctx.description;
        });
        setContexts(contextMap);
      }
    } catch (error) {
      console.error('Failed to load contexts:', error);
    }
  };

  // Load existing contexts on mount and when tables change
  useEffect(() => {
    if (tables.length > 0) {
      loadContexts();
    }
  }, [tables]);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Save each context
      const savePromises = Object.entries(contexts)
        .filter(([_, description]) => description.trim())
        .map(([tableName, description]) =>
          fetch('http://localhost:3001/api/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, description })
          })
        );

      const results = await Promise.all(savePromises);
      
      // Check for errors
      const errors = [];
      for (let i = 0; i < results.length; i++) {
        if (!results[i].ok) {
          const errorData = await results[i].json();
          errors.push(errorData);
          console.error('Save error:', errorData);
        }
      }

      if (errors.length === 0) {
        // Reload from database so UI always reflects persisted values
        await loadContexts();

        toast({
          title: "Context saved",
          description: "Your business logic and definitions have been saved successfully.",
        });
      } else {
        toast({
          title: "Error saving context",
          description: errors[0]?.error || "Some contexts could not be saved. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contexts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No tables found</CardTitle>
            <CardDescription>
              You haven't created any tables yet. Please go to the Data Manager to add your first table.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-6">
        {tables.map((table) => (
          <Card key={table}>
            <CardHeader>
              <CardTitle>Table: {table}</CardTitle>
              <CardDescription>
                Define business logic and context for the AI to understand this table better.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`context-${table}`}>Business Logic & Definitions</Label>
                <Textarea
                  id={`context-${table}`}
                  placeholder={`e.g., This table stores all user profiles. The 'balance' field is in cents. A 'frequent traveler' is someone with more than 20 trips.`}
                  value={contexts[table] || ""}
                  onChange={(e) =>
                    setContexts({
                      ...contexts,
                      [table]: e.target.value,
                    })
                  }
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  );
};

export default ContextSettings;
