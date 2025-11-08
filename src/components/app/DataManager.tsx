import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Table as TableIcon, Trash2, Settings, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Column {
  name: string;
  type: "TEXT" | "INTEGER" | "REAL" | "BOOLEAN" | "TIMESTAMP" | "VARCHAR(255)" | "JSONB";
}

interface TableData {
  name: string;
  columns: Column[];
  rows: Record<string, string | number>[];
}

interface DataManagerProps {
  tables: string[];
  setTables: (tables: string[]) => void;
}

const DataManager = ({ tables, setTables }: DataManagerProps) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, TableData>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState<Column[]>([{ name: "", type: "TEXT" }]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlterDialogOpen, setIsAlterDialogOpen] = useState(false);
  const [alterTableName, setAlterTableName] = useState("");
  const [newColumnToAdd, setNewColumnToAdd] = useState<Column>({ name: "", type: "TEXT" });
  const { toast } = useToast();

  // Load existing tables from database on mount
  useEffect(() => {
    const loadTables = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/tables/list');
        const result = await response.json();
        
        if (result.success && result.tables) {
          setTables(result.tables);
          
          // Load schema and data for each table
          for (const tableName of result.tables) {
            await loadTableData(tableName);
          }
        }
      } catch (error) {
        console.error('Failed to load tables:', error);
      }
    };
    
    loadTables();
  }, []);

  // Function to load table schema and data
  const loadTableData = async (tableName: string) => {
    try {
      // Get schema
      const schemaResponse = await fetch(`http://localhost:3001/api/tables/${tableName}/schema`);
      const schemaResult = await schemaResponse.json();
      
      // Get data
      const dataResponse = await fetch(`http://localhost:3001/api/data/${tableName}`);
      const dataResult = await dataResponse.json();
      
      if (schemaResult.success && dataResult.success) {
        // Map database types to our Column types
        const columns: Column[] = schemaResult.columns
          .filter((col: any) => !['id', 'created_at', 'updated_at'].includes(col.column_name))
          .map((col: any) => ({
            name: col.column_name,
            type: mapDbTypeToColumnType(col.data_type)
          }));
        
        setTableData(prev => ({
          ...prev,
          [tableName]: {
            name: tableName,
            columns,
            rows: dataResult.data || []
          }
        }));
      }
    } catch (error) {
      console.error(`Failed to load data for table ${tableName}:`, error);
    }
  };

  // Map database types to our Column types
  const mapDbTypeToColumnType = (dbType: string): Column['type'] => {
    const type = dbType.toUpperCase();
    if (type.includes('INT')) return 'INTEGER';
    if (type.includes('REAL') || type.includes('DOUBLE') || type.includes('FLOAT')) return 'REAL';
    if (type.includes('BOOL')) return 'BOOLEAN';
    if (type.includes('TIMESTAMP') || type.includes('DATE')) return 'TIMESTAMP';
    if (type.includes('VARCHAR')) return 'VARCHAR(255)';
    if (type.includes('JSON')) return 'JSONB';
    return 'TEXT';
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim() || newColumns.some((col) => !col.name.trim())) {
      toast({
        title: "Invalid input",
        description: "Please provide a table name and all column names.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/tables/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: newTableName,
          columns: newColumns
        })
      });

      const result = await response.json();

      if (result.success) {
        setTables([...tables, newTableName]);
        setTableData({
          ...tableData,
          [newTableName]: {
            name: newTableName,
            columns: newColumns,
            rows: [],
          },
        });

        toast({
          title: "Table created",
          description: result.message,
        });

        setNewTableName("");
        setNewColumns([{ name: "", type: "TEXT" }]);
        setIsCreateDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create table",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create table. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddRow = (tableName: string) => {
    const table = tableData[tableName];
    const newRow: Record<string, string | number> = { id: Date.now() }; // Temporary ID
    table.columns.forEach((col) => {
      newRow[col.name] = col.type === "INTEGER" || col.type === "REAL" ? 0 : "";
    });

    setTableData({
      ...tableData,
      [tableName]: {
        ...table,
        rows: [...table.rows, newRow],
      },
    });
    
    setHasUnsavedChanges(true);
  };

  const handleDeleteRow = (tableName: string, rowIndex: number) => {
    const table = tableData[tableName];
    setTableData({
      ...tableData,
      [tableName]: {
        ...table,
        rows: table.rows.filter((_, i) => i !== rowIndex),
      },
    });
    setHasUnsavedChanges(true);
  };

  // Delete entire table
  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete the table "${tableName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/tables/${tableName}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setTables(tables.filter(t => t !== tableName));
        const newTableData = { ...tableData };
        delete newTableData[tableName];
        setTableData(newTableData);
        setSelectedTable(null);

        toast({
          title: "Table deleted",
          description: `Table "${tableName}" has been deleted successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete table",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete table. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add column to existing table
  const handleAddColumn = async () => {
    if (!newColumnToAdd.name.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide a column name.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add column using raw SQL
      const response = await fetch('http://localhost:3001/api/tables/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: alterTableName,
          columnName: newColumnToAdd.name,
          columnType: newColumnToAdd.type
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload table data
        await loadTableData(alterTableName);

        toast({
          title: "Column added",
          description: `Column "${newColumnToAdd.name}" has been added successfully.`,
        });

        setNewColumnToAdd({ name: "", type: "TEXT" });
        setIsAlterDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add column",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add column. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCell = (tableName: string, rowIndex: number, columnName: string, value: string) => {
    const table = tableData[tableName];
    const column = table.columns.find((col) => col.name === columnName);
    const updatedRows = [...table.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [columnName]: (column?.type === "INTEGER" || column?.type === "REAL") ? parseFloat(value) || 0 : value,
    };

    setTableData({
      ...tableData,
      [tableName]: {
        ...table,
        rows: updatedRows,
      },
    });
    
    setHasUnsavedChanges(true);
  };

  // Save all changes to database
  const handleSaveChanges = async (tableName: string) => {
    setIsSaving(true);
    const table = tableData[tableName];
    
    try {
      // Save each row
      for (const row of table.rows) {
        const { id, created_at, updated_at, ...rowData } = row;
        
        if (id && typeof id === 'number' && id > 1000000000000) {
          // New row (temporary ID) - insert
          await fetch('http://localhost:3001/api/data/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName, data: rowData })
          });
        } else if (id) {
          // Existing row - update
          await fetch(`http://localhost:3001/api/data/${tableName}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowData)
          });
        }
      }
      
      // Reload table data from database
      await loadTableData(tableName);
      
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved",
        description: "All changes have been saved to the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome! Your database is empty.</CardTitle>
            <CardDescription>Create your first table to get started with managing your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Table</DialogTitle>
                  <DialogDescription>Define your table schema below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-name">Table Name</Label>
                    <Input
                      id="table-name"
                      placeholder="e.g., travelers"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Columns</Label>
                    {newColumns.map((col, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="Column name"
                          value={col.name}
                          onChange={(e) => {
                            const updated = [...newColumns];
                            updated[i].name = e.target.value;
                            setNewColumns(updated);
                          }}
                        />
                        <select
                          className="border border-input rounded-md px-3"
                          value={col.type}
                          onChange={(e) => {
                            const updated = [...newColumns];
                            updated[i].type = e.target.value as Column['type'];
                            setNewColumns(updated);
                          }}
                        >
                          <option value="TEXT">Text</option>
                          <option value="INTEGER">Integer</option>
                          <option value="REAL">Decimal</option>
                          <option value="BOOLEAN">Boolean</option>
                          <option value="VARCHAR(255)">Varchar(255)</option>
                          <option value="TIMESTAMP">Timestamp</option>
                          <option value="JSONB">JSON</option>
                        </select>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewColumns([...newColumns, { name: "", type: "TEXT" }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Column
                    </Button>
                  </div>
                  <Button onClick={handleCreateTable} className="w-full">
                    Create Table
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">Your Tables</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Table</DialogTitle>
              <DialogDescription>Define your table schema below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="table-name">Table Name</Label>
                <Input
                  id="table-name"
                  placeholder="e.g., travelers"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Columns</Label>
                {newColumns.map((col, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Column name"
                      value={col.name}
                      onChange={(e) => {
                        const updated = [...newColumns];
                        updated[i].name = e.target.value;
                        setNewColumns(updated);
                      }}
                    />
                    <select
                      className="border border-input rounded-md px-3"
                      value={col.type}
                      onChange={(e) => {
                        const updated = [...newColumns];
                        updated[i].type = e.target.value as Column['type'];
                        setNewColumns(updated);
                      }}
                    >
                      <option value="TEXT">Text</option>
                      <option value="INTEGER">Integer</option>
                      <option value="REAL">Decimal</option>
                      <option value="BOOLEAN">Boolean</option>
                      <option value="VARCHAR(255)">Varchar(255)</option>
                      <option value="TIMESTAMP">Timestamp</option>
                      <option value="JSONB">JSON</option>
                    </select>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewColumns([...newColumns, { name: "", type: "TEXT" }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>
              <Button onClick={handleCreateTable} className="w-full">
                Create Table
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedTable ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <Card key={table} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setSelectedTable(table)}>
                    <TableIcon className="h-5 w-5 text-primary" />
                    <CardTitle>{table}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlterTableName(table);
                        setIsAlterDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table);
                      }}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {tableData[table]?.rows.length || 0} rows • {tableData[table]?.columns.length || 0} columns
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedTable(null)}>
              ← Back to Tables
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow(selectedTable)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
              <Button 
                onClick={() => handleSaveChanges(selectedTable)} 
                disabled={!hasUnsavedChanges || isSaving}
                variant="default"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {tableData[selectedTable]?.columns.map((col) => (
                        <th key={col.name} className="px-4 py-3 text-left text-sm font-medium text-foreground">
                          {col.name}
                          <span className="text-muted-foreground ml-1">({col.type})</span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData[selectedTable]?.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-border">
                        {tableData[selectedTable].columns.map((col) => (
                          <td key={col.name} className="px-4 py-3">
                            <Input
                              type={(col.type === "INTEGER" || col.type === "REAL") ? "number" : "text"}
                              value={row[col.name]}
                              onChange={(e) => handleUpdateCell(selectedTable, rowIndex, col.name, e.target.value)}
                              className="border-0 bg-transparent focus-visible:ring-1"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRow(selectedTable, rowIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alter Table Dialog */}
      <Dialog open={isAlterDialogOpen} onOpenChange={setIsAlterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alter Table: {alterTableName}</DialogTitle>
            <DialogDescription>Add a new column to the table</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-column-name">Column Name</Label>
              <Input
                id="new-column-name"
                placeholder="e.g., phone_number"
                value={newColumnToAdd.name}
                onChange={(e) => setNewColumnToAdd({ ...newColumnToAdd, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-column-type">Column Type</Label>
              <select
                id="new-column-type"
                className="w-full border border-input rounded-md px-3 py-2"
                value={newColumnToAdd.type}
                onChange={(e) => setNewColumnToAdd({ ...newColumnToAdd, type: e.target.value as Column['type'] })}
              >
                <option value="TEXT">Text</option>
                <option value="INTEGER">Integer</option>
                <option value="REAL">Decimal</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="VARCHAR(255)">Varchar(255)</option>
                <option value="TIMESTAMP">Timestamp</option>
                <option value="JSONB">JSON</option>
              </select>
            </div>
            <Button onClick={handleAddColumn} className="w-full">
              Add Column
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManager;
