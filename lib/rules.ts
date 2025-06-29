// lib/rules.ts
import { z } from "zod";

// Rule type definitions
export const ruleTypes = [
    "coRun",
    "slotRestriction",
    "loadLimit",
    "phaseWindow",
    "patternMatch",
    "precedenceOverride",
] as const;

export type RuleType = typeof ruleTypes[number];

export const baseRuleSchema = z.object({
    type: z.enum(ruleTypes),
    priority: z.number().min(1).max(10).default(5),
    description: z.string().optional(),
});

export const coRunRuleSchema = baseRuleSchema.extend({
    type: z.literal("coRun"),
    tasks: z.array(z.string()).min(2),
});

export const slotRestrictionRuleSchema = baseRuleSchema.extend({
    type: z.literal("slotRestriction"),
    group: z.string(),
    minCommonSlots: z.number().min(1),
});

export const loadLimitRuleSchema = baseRuleSchema.extend({
    type: z.literal("loadLimit"),
    workerGroup: z.string(),
    maxSlotsPerPhase: z.number().min(1),
});

export const phaseWindowRuleSchema = baseRuleSchema.extend({
    type: z.literal("phaseWindow"),
    taskId: z.string(),
    allowedPhases: z.array(z.number()).min(1),
});

export const patternMatchRuleSchema = baseRuleSchema.extend({
    type: z.literal("patternMatch"),
    regex: z.string(),
    template: z.string(),
    parameters: z.record(z.unknown()),
});

export const precedenceOverrideRuleSchema = baseRuleSchema.extend({
    type: z.literal("precedenceOverride"),
    ruleId: z.string(),
    overridePriority: z.number().min(1),
});

export type Rule = z.infer<typeof baseRuleSchema> & {
    id: string;
};

export type CoRunRule = z.infer<typeof coRunRuleSchema> & { id: string };
export type SlotRestrictionRule = z.infer<typeof slotRestrictionRuleSchema> & { id: string };
export type LoadLimitRule = z.infer<typeof loadLimitRuleSchema> & { id: string };
export type PhaseWindowRule = z.infer<typeof phaseWindowRuleSchema> & { id: string };
export type PatternMatchRule = z.infer<typeof patternMatchRuleSchema> & { id: string };
export type PrecedenceOverrideRule = z.infer<typeof precedenceOverrideRuleSchema> & { id: string };

// Rule creation helpers
export function createRule<T extends Rule>(type: T["type"], data: Omit<T, "id" | "type">): T {
    return {
        id: crypto.randomUUID(),
        type,
        ...data,
    } as T;
}

// Rule validation
export function validateRule(rule: unknown): Rule {
    switch ((rule as Rule).type) {
        case "coRun":
            return coRunRuleSchema.parse(rule) as CoRunRule;
        case "slotRestriction":
            return slotRestrictionRuleSchema.parse(rule) as SlotRestrictionRule;
        case "loadLimit":
            return loadLimitRuleSchema.parse(rule) as LoadLimitRule;
        case "phaseWindow":
            return phaseWindowRuleSchema.parse(rule) as PhaseWindowRule;
        case "patternMatch":
            return patternMatchRuleSchema.parse(rule) as PatternMatchRule;
        case "precedenceOverride":
            return precedenceOverrideRuleSchema.parse(rule) as PrecedenceOverrideRule;
        default:
            throw new Error("Invalid rule type");
    }
}

// Rule export
export function exportRules(rules: Rule[]) {
    return JSON.stringify(rules, null, 2);
}