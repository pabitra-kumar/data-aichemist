"use client";

// Next.js + TypeScript Boilerplate for Data Alchemist
// Includes: AG Grid, Zod, XLSX multi-sheet support, Export, Validation, and Rule Builder (basic)

import { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  clientSchema,
  workerSchema,
  taskSchema,
  CoRunRule,
  Rule,
} from "@/lib/validations";
import { validateSheetData, getSchema } from "@/lib/validators";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/app/globals.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function Home() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>("");
  const [workbookData, setWorkbookData] = useState<Record<string, any[]>>({});
  const [rules, setRules] = useState<Rule[]>([]);
  const [coRunTasks, setCoRunTasks] = useState<string>("");
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({});
  const [errorSummary, setErrorSummary] = useState<{
    rows: number;
    cells: number;
  }>({ rows: 0, cells: 0 });
  const gridRef = useRef<any>(null);

  const runValidation = (data: any[]) => {
    const result = validateSheetData(currentSheet, data);
    setErrorMap(result.errorMap);

    const affectedCells = Object.keys(result.errorMap);
    const uniqueRows = new Set(affectedCells.map((key) => key.split("-")[0]));
    setErrorSummary({ rows: uniqueRows.size, cells: affectedCells.length });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetDataObj: Record<string, any[]> = {};
      workbook.SheetNames.forEach((sheet) => {
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
          defval: "",
        });
        sheetDataObj[sheet] = sheetData;
      });

      setWorkbookData(sheetDataObj);
      setSheetNames(workbook.SheetNames);

      const firstSheet = workbook.SheetNames[0];
      setCurrentSheet(firstSheet);
      setRowData(sheetDataObj[firstSheet]);
      setFilteredData([]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (sheet: string) => {
    setCurrentSheet(sheet);
    const data = workbookData[sheet];
    setRowData(data);
    setFilteredData([]);
  };

  useEffect(() => {
    if (rowData.length) {
      runValidation(rowData);
    }
  }, [rowData, currentSheet]);

  useEffect(() => {
    if (!rowData.length) return;
    const fields = Object.keys(rowData[0] || {});
    setColumnDefs(
      fields.map((field) => ({
        field,
        editable: true,
        cellClass: (params: any) =>
          errorMap[`${params.node.rowIndex}-${field}`] ? "ag-cell-error" : "",
      }))
    );
  }, [errorMap, rowData]);

  const onCellValueChanged = (event: any) => {
    const { rowIndex } = event.node;
    const field = event.colDef.field;
    const row = event.data;

    const schema = getSchema(currentSheet);
    if (!schema) return;
    const result = schema.safeParse(row);

    const key = `${rowIndex}-${field}`;
    const isValid =
      result.success ||
      !result.error?.errors.find((err) => err.path[0] === field);

    setErrorMap((prev) => {
      const updated = { ...prev };
      if (isValid) {
        delete updated[key];
      } else {
        updated[key] = true;
      }

      const cells = Object.keys(updated).length;
      const rows = new Set(Object.keys(updated).map((k) => k.split("-")[0]))
        .size;
      setErrorSummary({ rows, cells });

      return updated;
    });

    gridRef.current?.api.refreshCells({
      force: true,
      columns: [field],
      rowNodes: [event.node],
    });
  };

  const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.length ? filteredData : rowData
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentSheet);

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `${currentSheet}.xlsx`
    );

    const rulesBlob = new Blob(
      [JSON.stringify({ rules, priorities: {} }, null, 2)],
      {
        type: "application/json",
      }
    );
    saveAs(rulesBlob, "rules.json");
  };

  const interpretQuery = async (
    query: string
  ): Promise<(row: any) => boolean> => {
    if (query.toLowerCase().includes("prioritylevel 5")) {
      return (row) => Number(row.PriorityLevel) === 5;
    }
    if (query.toLowerCase().includes("duration > 1")) {
      return (row) => Number(row.Duration) > 1;
    }
    return () => true;
  };

  const handleQuerySearch = async () => {
    const filterFn = await interpretQuery(query);
    const results = rowData.filter(filterFn);
    setFilteredData(results);
  };

  const resetFilter = () => {
    setFilteredData([]);
    setQuery("");
  };

  const addCoRunRule = () => {
    const taskIds = coRunTasks
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (taskIds.length < 2) return alert("Please enter at least two task IDs.");
    const newRule: CoRunRule = { type: "coRun", tasks: taskIds };
    setRules([...rules, newRule]);
    setCoRunTasks("");
    alert("Co-Run rule added!");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        📊 Data Alchemist - Upload Data File
      </h1>

      <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} />

      {sheetNames.length > 1 && (
        <div className="my-2">
          <label className="font-semibold">Sheet:</label>
          <select
            className="ml-2 border px-2 py-1"
            value={currentSheet}
            onChange={(e) => handleSheetChange(e.target.value)}
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <input
          type="text"
          placeholder="Search using natural language..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <Button onClick={handleQuerySearch}>🔍 Search</Button>
        <Button variant="outline" onClick={resetFilter}>
          ❌ Clear
        </Button>
      </div>

      <div
        className="ag-theme-alpine mt-4"
        style={{ height: 400, width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredData.length ? filteredData : rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: true,
          }}
          animateRows
          theme="legacy"
          onCellValueChanged={onCellValueChanged}
        />
      </div>

      {errorSummary.cells > 0 && (
        <div className="text-red-600 font-medium">
          🛑 {errorSummary.cells} invalid cells across {errorSummary.rows} rows.
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <Button onClick={exportData}>📤 Export Data + Rules</Button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">➕ Add Co-Run Rule</h2>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="Enter task IDs (e.g. T1,T2)"
            value={coRunTasks}
            onChange={(e) => setCoRunTasks(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <Button variant="secondary" onClick={addCoRunRule}>
            Add Rule
          </Button>
        </div>
      </div>
    </div>
  );
}
