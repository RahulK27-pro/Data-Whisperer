import { useState } from "react";
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
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Context saved",
      description: "Your business logic and definitions have been saved successfully.",
    });
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
        <Button onClick={handleSave}>Save All</Button>
      </div>
    </div>
  );
};

export default ContextSettings;
