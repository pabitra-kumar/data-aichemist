// components/RulesManager.tsx
"use client";

import { useState } from "react";
import {
  Rule,
  RuleType,
  CoRunRule,
  SlotRestrictionRule,
  LoadLimitRule,
  PhaseWindowRule,
  PatternMatchRule,
  PrecedenceOverrideRule,
  createRule,
  validateRule,
} from "@/lib/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RuleFormProps = {
  onAddRule: (rule: Rule) => void;
  availableTasks?: string[];
  availableGroups?: string[];
  availableWorkerGroups?: string[];
};

export function RulesManager({
  onAddRule,
  availableTasks = [],
  availableGroups = [],
  availableWorkerGroups = [],
}: RuleFormProps) {
  const [ruleType, setRuleType] = useState<RuleType>("coRun");
  const [ruleData, setRuleData] = useState<Partial<Rule>>({});

  const handleAddRule = () => {
    try {
      const newRule = createRule(ruleType, ruleData);
      onAddRule(newRule);
      setRuleData({});
    } catch (error) {
      alert(
        `Invalid rule: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const renderRuleForm = () => {
    switch (ruleType) {
      case "coRun":
        return (
          <div className="space-y-2">
            <Label>Task IDs (comma separated)</Label>
            <Input
              value={(ruleData as CoRunRule).tasks?.join(",") || ""}
              onChange={(e) =>
                setRuleData({
                  ...ruleData,
                  tasks: e.target.value.split(",").map((t) => t.trim()),
                })
              }
              placeholder="T1,T2,T3"
            />
          </div>
        );
      case "slotRestriction":
        return (
          <div className="space-y-2">
            <Label>Group</Label>
            <Select
              value={(ruleData as SlotRestrictionRule).group || ""}
              onValueChange={(value) =>
                setRuleData({ ...ruleData, group: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Minimum Common Slots</Label>
            <Input
              type="number"
              min="1"
              value={(ruleData as SlotRestrictionRule).minCommonSlots || ""}
              onChange={(e) =>
                setRuleData({
                  ...ruleData,
                  minCommonSlots: parseInt(e.target.value),
                })
              }
            />
          </div>
        );
      case "loadLimit":
        return (
          <div className="space-y-2">
            <Label>Worker Group</Label>
            <Select
              value={(ruleData as LoadLimitRule).workerGroup || ""}
              onValueChange={(value) =>
                setRuleData({ ...ruleData, workerGroup: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker group" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkerGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Maximum Slots Per Phase</Label>
            <Input
              type="number"
              min="1"
              value={(ruleData as LoadLimitRule).maxSlotsPerPhase || ""}
              onChange={(e) =>
                setRuleData({
                  ...ruleData,
                  maxSlotsPerPhase: parseInt(e.target.value),
                })
              }
            />
          </div>
        );
      case "phaseWindow":
        return (
          <div className="space-y-2">
            <Label>Task ID</Label>
            <Select
              value={(ruleData as PhaseWindowRule).taskId || ""}
              onValueChange={(value) =>
                setRuleData({ ...ruleData, taskId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {availableTasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Allowed Phases (comma separated)</Label>
            <Input
              value={
                (ruleData as PhaseWindowRule).allowedPhases?.join(",") || ""
              }
              onChange={(e) =>
                setRuleData({
                  ...ruleData,
                  allowedPhases: e.target.value
                    .split(",")
                    .map((p) => parseInt(p.trim())),
                })
              }
              placeholder="1,2,3"
            />
          </div>
        );
      case "patternMatch":
        return (
          <div className="space-y-2">
            <Label>Regular Expression</Label>
            <Input
              value={(ruleData as PatternMatchRule).regex || ""}
              onChange={(e) =>
                setRuleData({ ...ruleData, regex: e.target.value })
              }
              placeholder="^[A-Z]{2}\d+$"
            />
            <Label>Template</Label>
            <Input
              value={(ruleData as PatternMatchRule).template || ""}
              onChange={(e) =>
                setRuleData({ ...ruleData, template: e.target.value })
              }
              placeholder="template-name"
            />
          </div>
        );
      case "precedenceOverride":
        return (
          <div className="space-y-2">
            <Label>Rule ID to Override</Label>
            <Input
              value={(ruleData as PrecedenceOverrideRule).ruleId || ""}
              onChange={(e) =>
                setRuleData({ ...ruleData, ruleId: e.target.value })
              }
              placeholder="rule-id"
            />
            <Label>Override Priority</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={
                (ruleData as PrecedenceOverrideRule).overridePriority || ""
              }
              onChange={(e) =>
                setRuleData({
                  ...ruleData,
                  overridePriority: parseInt(e.target.value),
                })
              }
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Add New Rule</h3>
      <div className="space-y-2">
        <Label>Rule Type</Label>
        <Select
          value={ruleType}
          onValueChange={(value) => setRuleType(value as RuleType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select rule type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coRun">Co-Run</SelectItem>
            <SelectItem value="slotRestriction">Slot Restriction</SelectItem>
            <SelectItem value="loadLimit">Load Limit</SelectItem>
            <SelectItem value="phaseWindow">Phase Window</SelectItem>
            <SelectItem value="patternMatch">Pattern Match</SelectItem>
            <SelectItem value="precedenceOverride">
              Precedence Override
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderRuleForm()}

      <div className="space-y-2">
        <Label>Priority (1-10)</Label>
        <Input
          type="number"
          min="1"
          max="10"
          value={ruleData.priority || 5}
          onChange={(e) =>
            setRuleData({ ...ruleData, priority: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Input
          value={ruleData.description || ""}
          onChange={(e) =>
            setRuleData({ ...ruleData, description: e.target.value })
          }
          placeholder="Rule description"
        />
      </div>

      <Button onClick={handleAddRule}>Add Rule</Button>
    </div>
  );
}
