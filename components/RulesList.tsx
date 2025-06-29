// components/RulesList.tsx
"use client";

import { Rule } from "@/lib/rules";
import { Button } from "@/components/ui/button";

type RulesListProps = {
  rules: Rule[];
  onDelete: (id: string) => void;
};

export function RulesList({ rules, onDelete }: RulesListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Current Rules</h3>
      {rules.length === 0 ? (
        <p className="text-muted-foreground">No rules added yet</p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="border p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{rule.type}</p>
                <p className="text-sm text-muted-foreground">
                  {rule.description || "No description"}
                </p>
                <p className="text-xs">Priority: {rule.priority}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(rule.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
